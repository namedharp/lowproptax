import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { GoogleAuth } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";
import type { FoiaSourceDocument } from "../lib/ingestion/types";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  md5Checksum?: string;
  parents?: string[];
};

const FOLDER_MIME = "application/vnd.google-apps.folder";
const GOOGLE_DOC = "application/vnd.google-apps.document";
const GOOGLE_SHEET = "application/vnd.google-apps.spreadsheet";
const GOOGLE_SLIDE = "application/vnd.google-apps.presentation";
const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is required.");
const syncStartedAt = new Date().toISOString();

const outArgument = process.argv
  .slice(2)
  .find((value) => value.startsWith("--out="));
const outputPath = resolve(
  outArgument?.slice("--out=".length) ?? "work/foia-drive-manifest.json",
);

const authHeader = await createAuthorizationHeader();
const files = await walkFolder(folderId);
const documents: FoiaSourceDocument[] = [];
const skipped: Array<{
  id: string;
  name: string;
  reason: string;
  sourceUrl?: string;
  modifiedAt?: string;
  localPath?: string;
}> = [];

for (const file of files) {
  try {
    const text = await extractFileText(file);
    if (!text.trim()) {
      const localPath = await saveOcrCandidate(file);
      skipped.push({
        id: file.id,
        name: file.name,
        reason: "No extractable text; OCR or a format-specific extractor is required.",
        sourceUrl: file.webViewLink,
        modifiedAt: file.modifiedTime,
        localPath,
      });
      continue;
    }
    documents.push({
      sourceId: file.id,
      title: file.name,
      text,
      sourceUrl: file.webViewLink,
      modifiedAt: file.modifiedTime,
      county: "Sacramento",
      visibility: "public_foia",
      metadata: {
        county_slug: "sacramento",
        drive_file_id: file.id,
        drive_mime_type: file.mimeType,
        drive_md5: file.md5Checksum,
      },
    });
  } catch (error) {
    skipped.push({
      id: file.id,
      name: file.name,
      reason: error instanceof Error ? error.message : "Extraction failed.",
    });
  }
}

async function saveOcrCandidate(file: DriveFile): Promise<string | undefined> {
  if (file.mimeType !== "application/pdf") return undefined;
  const bytes = await download(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
  );
  const safeId = file.id.replace(/[^a-zA-Z0-9_-]/g, "");
  const path = resolve(dirname(outputPath), "ocr", `${safeId}.pdf`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  return path;
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceFolderId: folderId,
      documents,
      skipped,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
await recordDriveSynchronization(files.length, documents.length, skipped.length);

process.stdout.write(
  `${JSON.stringify(
    {
      outputPath,
      discovered: files.length,
      extracted: documents.length,
      skipped: skipped.length,
    },
    null,
    2,
  )}\n`,
);

async function walkFolder(rootFolderId: string): Promise<DriveFile[]> {
  const queue = [rootFolderId];
  const output: DriveFile[] = [];
  const visited = new Set<string>();

  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (visited.size > 5000) throw new Error("Drive folder traversal limit exceeded.");

    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        q: `'${current.replaceAll("'", "\\'")}' in parents and trashed = false`,
        fields:
          "nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,md5Checksum,parents)",
        pageSize: "1000",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const response = await driveFetch(
        `https://www.googleapis.com/drive/v3/files?${params}`,
      );
      const payload = (await response.json()) as {
        files?: DriveFile[];
        nextPageToken?: string;
      };
      for (const file of payload.files ?? []) {
        if (file.mimeType === FOLDER_MIME) queue.push(file.id);
        else output.push(file);
      }
      pageToken = payload.nextPageToken;
    } while (pageToken);
  }
  return output;
}

async function extractFileText(file: DriveFile): Promise<string> {
  if (file.mimeType === GOOGLE_DOC) {
    return decode(
      await download(
        `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text%2Fplain`,
      ),
    );
  }
  if (file.mimeType === GOOGLE_SHEET) {
    return decode(
      await download(
        `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text%2Fcsv`,
      ),
    );
  }
  if (file.mimeType === GOOGLE_SLIDE) {
    const pdf = await download(
      `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application%2Fpdf`,
    );
    return extractPdfText(pdf);
  }
  const bytes = await download(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
  );
  if (file.mimeType === "application/pdf") return extractPdfText(bytes);
  if (
    file.mimeType.startsWith("text/") ||
    ["application/json", "application/csv"].includes(file.mimeType)
  ) {
    return decode(bytes);
  }
  throw new Error(`Unsupported source type: ${file.mimeType}`);
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await pdfjs.getDocument({
    data: bytes,
    useSystemFonts: true,
  }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(`[Page ${pageNumber}]\n${text}`);
  }
  return pages.join("\n\n");
}

async function download(url: string): Promise<Uint8Array> {
  const response = await driveFetch(url);
  return new Uint8Array(await response.arrayBuffer());
}

async function driveFetch(url: string): Promise<Response> {
  const target = new URL(url);
  if (!authHeader && process.env.GOOGLE_DRIVE_API_KEY) {
    target.searchParams.set("key", process.env.GOOGLE_DRIVE_API_KEY);
  }
  const response = await fetch(target, {
    headers: authHeader ? { authorization: authHeader } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Drive request failed (${response.status}).`);
  }
  return response;
}

async function createAuthorizationHeader(): Promise<string | undefined> {
  const inlineCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !inlineCredentials) {
    return undefined;
  }
  const auth = new GoogleAuth({
    ...(inlineCredentials
      ? {
          credentials: JSON.parse(inlineCredentials) as {
            client_email: string;
            private_key: string;
          },
        }
      : {}),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token ? `Bearer ${token.token}` : undefined;
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

async function recordDriveSynchronization(
  seen: number,
  upserted: number,
  skipped: number,
): Promise<void> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: queued, error: queueError } = await supabase
    .from("source_sync_runs")
    .select("id")
    .eq("source_system", "sacramento_drive")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (queueError) {
    throw new Error(`Unable to inspect Drive sync queue: ${queueError.message}`);
  }
  const payload = {
    source_system: "sacramento_drive",
    trigger_type: queued ? "manual" : "scheduled",
    status: skipped ? "partial" : "succeeded",
    records_seen: seen,
    records_upserted: upserted,
    records_skipped: skipped,
    records_failed: 0,
    started_at: syncStartedAt,
    finished_at: new Date().toISOString(),
    cursor: { manifest: outputPath },
  };
  const query = queued
    ? supabase.from("source_sync_runs").update(payload).eq("id", queued.id)
    : supabase.from("source_sync_runs").insert(payload);
  const { error } = await query;
  if (error) throw new Error(`Unable to record Drive sync: ${error.message}`);
}
