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
  if (document.county !== "Sacramento") {
    throw new Error(
      `Refusing to index non-Sacramento source "${document.title}" during the pilot.`,
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
]);

let indexedPoints = 0;
for (const { document, chunks } of prepared) {
  const points = chunks.map((chunk) => ({
    id: chunk.id,
    vector: {
      dense: {
        text: chunk.text,
        model:
          process.env.QDRANT_DENSE_MODEL ??
          "sentence-transformers/all-minilm-l6-v2",
      },
      bm25: {
        text: chunk.text,
        model: process.env.QDRANT_BM25_MODEL ?? "qdrant/bm25",
      },
    },
    payload: {
      ...document.metadata,
      text: chunk.text,
      title: document.title,
      county: "Sacramento",
      county_slug: "sacramento",
      document_type: document.documentType,
      source_url: document.sourceUrl,
      document_id: document.sourceId,
      content_hash: document.contentHash,
      visibility: document.visibility,
      source_type: "public",
      chunk_index: chunk.index,
      chunk_total: chunk.total,
      source_modified_at: document.modifiedAt,
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
      collection:
        process.env.QDRANT_RESEARCH_COLLECTION ?? "lpt_research_live",
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

async function upsertQdrant(
  points: Array<{
    id: string;
    vector: {
      dense: { text: string; model: string };
      bm25: { text: string; model: string };
    };
    payload: Record<string, unknown>;
  }>,
): Promise<void> {
  const baseUrl = process.env.QDRANT_URL!.replace(/\/+$/, "");
  const collection =
    process.env.QDRANT_RESEARCH_COLLECTION ?? "lpt_research_live";
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
