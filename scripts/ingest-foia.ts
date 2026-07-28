import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  chunkFoiaDocument,
  normalizeFoiaDocument,
} from "../lib/ingestion/normalize";
import type { FoiaSourceDocument } from "../lib/ingestion/types";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const manifestPath = args.find((value) => !value.startsWith("--"));

if (!manifestPath) {
  throw new Error(
    "Provide a JSON manifest path. Example: npm run ingest:preview -- ./foia-manifest.json",
  );
}

const documents = await readManifest(resolve(manifestPath));
const prepared = [];
for (const source of documents) {
  const document = await normalizeFoiaDocument(source);
  if (document.visibility !== "public_foia") {
    throw new Error(
      `Refusing to index private source "${document.title}" into the public FOIA collection.`,
    );
  }
  const chunks = await chunkFoiaDocument(document);
  prepared.push({ document, chunks });
}

if (dryRun) {
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: "dry-run",
        documents: prepared.length,
        chunks: prepared.reduce((total, item) => total + item.chunks.length, 0),
        sources: prepared.map(({ document, chunks }) => ({
          sourceId: document.sourceId,
          title: document.title,
          county: document.county,
          documentType: document.documentType,
          contentHash: document.contentHash,
          chunks: chunks.length,
        })),
      },
      null,
      2,
    )}\n`,
  );
  process.exit(0);
}

requireEnvironment([
  "QDRANT_URL",
  "QDRANT_API_KEY",
  "EMBEDDING_API_KEY",
]);

let indexedPoints = 0;
for (const { document, chunks } of prepared) {
  const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.text));
  const points = chunks.map((chunk, index) => ({
    id: chunk.id,
    vector: embeddings[index],
    payload: {
      text: chunk.text,
      title: document.title,
      county: document.county,
      doc_type: document.documentType,
      source_url: document.sourceUrl,
      source_id: document.sourceId,
      content_hash: document.contentHash,
      visibility: document.visibility,
      chunk_index: chunk.index,
      chunk_total: chunk.total,
      source_modified_at: document.modifiedAt,
      ...document.metadata,
    },
  }));
  await upsertQdrant(points);
  indexedPoints += points.length;
}

process.stdout.write(
  `${JSON.stringify(
    {
      mode: "indexed",
      documents: prepared.length,
      points: indexedPoints,
      collection: process.env.QDRANT_RESEARCH_COLLECTION ?? "lpt_research",
    },
    null,
    2,
  )}\n`,
);

async function readManifest(path: string): Promise<FoiaSourceDocument[]> {
  const raw = JSON.parse(await readFile(path, "utf8")) as
    | FoiaSourceDocument[]
    | { documents?: FoiaSourceDocument[] };
  const documents = Array.isArray(raw) ? raw : raw.documents;
  if (!documents?.length) throw new Error("The manifest contains no documents.");
  if (documents.length > 10_000) throw new Error("The manifest is too large.");
  return documents;
}

async function createEmbeddings(inputs: string[]): Promise<number[][]> {
  const all: number[][] = [];
  for (let offset = 0; offset < inputs.length; offset += 32) {
    const batch = inputs.slice(offset, offset + 32);
    const baseUrl = (
      process.env.EMBEDDING_API_BASE_URL ?? "https://api.openai.com/v1"
    ).replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
        input: batch,
      }),
    });
    if (!response.ok) {
      throw new Error(`Embedding batch failed (${response.status}).`);
    }
    const data = (await response.json()) as {
      data?: Array<{ index: number; embedding: number[] }>;
    };
    const ordered = (data.data ?? [])
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);
    if (ordered.length !== batch.length) {
      throw new Error("Embedding provider returned an incomplete batch.");
    }
    all.push(...ordered);
  }
  return all;
}

async function upsertQdrant(
  points: Array<{
    id: string;
    vector: number[];
    payload: Record<string, unknown>;
  }>,
): Promise<void> {
  const baseUrl = process.env.QDRANT_URL!.replace(/\/+$/, "");
  const collection =
    process.env.QDRANT_RESEARCH_COLLECTION ?? "lpt_research";
  const response = await fetch(
    `${baseUrl}/collections/${encodeURIComponent(collection)}/points?wait=true`,
    {
      method: "PUT",
      headers: {
        "api-key": process.env.QDRANT_API_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({ points }),
    },
  );
  if (!response.ok) {
    throw new Error(`Qdrant upsert failed (${response.status}).`);
  }
}

function requireEnvironment(names: string[]) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment values: ${missing.join(", ")}`);
  }
}
