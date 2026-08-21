import type {
  FoiaChunk,
  FoiaSourceDocument,
  IngestionPreview,
  NormalizedFoiaDocument,
} from "./types";

const COUNTY_ALIASES: Record<string, string> = {
  alameda: "Alameda",
  "contra costa": "Contra Costa",
  eldorado: "El Dorado",
  "el dorado": "El Dorado",
  fresno: "Fresno",
  losangeles: "Los Angeles",
  "los angeles": "Los Angeles",
  placer: "Placer",
  riverside: "Riverside",
  sacramento: "Sacramento",
  "san bernardino": "San Bernardino",
  "san diego": "San Diego",
  "san francisco": "San Francisco",
  "san joaquin": "San Joaquin",
  "santa clara": "Santa Clara",
  solano: "Solano",
  sonoma: "Sonoma",
  yolo: "Yolo",
};

const DOCUMENT_TYPES: Array<[RegExp, string]> = [
  [/\bfindings?\b|\bfinding of fact\b/i, "findings"],
  [/\bdecision\b|\border\b|\bruling\b/i, "decision"],
  [/\bagenda\b|\bminutes\b/i, "hearing_agenda"],
  [/\bprocedure\b|\bmanual\b|\bguide(lines?)?\b/i, "procedural_guidance"],
  [/\btraining\b|\bpresentation\b/i, "training_material"],
  [/\bstatistics?\b|\bsummary\b|\breport\b/i, "appeal_statistics"],
  [/\bapplication\b|\bform\b/i, "form"],
  [/\bcorrespondence\b|\bemail\b|\bletter\b/i, "correspondence"],
];

export async function normalizeFoiaDocument(
  input: FoiaSourceDocument,
): Promise<NormalizedFoiaDocument> {
  const sourceId = cleanRequired(input.sourceId, "Source ID", 500);
  const title = cleanRequired(input.title, "Title", 500);
  const text = normalizeText(cleanRequired(input.text, "Text", 5_000_000));
  const county = normalizeCounty(input.county, title, text);
  const documentType = normalizeDocumentType(input.documentType, title);
  const visibility = input.visibility ?? "public_foia";
  if (!["public_foia", "private_case"].includes(visibility)) {
    throw new Error("Visibility must be public_foia or private_case.");
  }

  return {
    sourceId,
    title,
    text,
    county,
    documentType,
    sourceUrl: cleanOptional(input.sourceUrl, 2000),
    modifiedAt: cleanOptional(input.modifiedAt, 100),
    visibility,
    metadata: sanitizeMetadata(input.metadata ?? {}),
    contentHash: await sha256(text),
  };
}

export async function previewFoiaDocument(
  input: FoiaSourceDocument,
): Promise<IngestionPreview> {
  const normalized = await normalizeFoiaDocument(input);
  const chunks = await chunkFoiaDocument(normalized);
  const warnings: string[] = [];
  if (normalized.county === "Unknown") {
    warnings.push("County could not be identified.");
  }
  if (normalized.documentType === "other") {
    warnings.push("Document type could not be classified.");
  }
  if (normalized.text.length < 400) {
    warnings.push("Very little text was extracted; the source may require OCR.");
  }

  const { text, ...source } = normalized;
  return {
    source: { ...source, characterCount: text.length },
    chunks,
    warnings,
  };
}

export async function chunkFoiaDocument(
  document: NormalizedFoiaDocument,
  targetCharacters = 1800,
  overlapCharacters = 240,
): Promise<FoiaChunk[]> {
  if (targetCharacters < 400 || overlapCharacters >= targetCharacters) {
    throw new Error("Invalid chunk configuration.");
  }

  const paragraphs = document.text
    .split(/\n{2,}/)
    .map((value) => value.trim())
    .filter(Boolean);
  const rawChunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const pieces = splitLongText(paragraph, targetCharacters);
    for (const piece of pieces) {
      const candidate = buffer ? `${buffer}\n\n${piece}` : piece;
      if (candidate.length <= targetCharacters || !buffer) {
        buffer = candidate;
        continue;
      }
      rawChunks.push(buffer);
      const overlap = tailAtWordBoundary(buffer, overlapCharacters);
      buffer = overlap ? `${overlap}\n\n${piece}` : piece;
    }
  }
  if (buffer) rawChunks.push(buffer);
  if (!rawChunks.length) rawChunks.push(document.text);

  return Promise.all(
    rawChunks.map(async (text, index) => ({
      id: await stablePointId(document.sourceId, document.contentHash, index),
      sourceId: document.sourceId,
      index,
      total: rawChunks.length,
      text,
      tokenEstimate: Math.ceil(text.length / 4),
    })),
  );
}

export function normalizeCounty(
  provided: string | undefined,
  title = "",
  text = "",
): string {
  const candidate = cleanCountyValue(provided ?? "");
  if (candidate) return COUNTY_ALIASES[candidate] ?? titleCase(candidate);

  const sample = `${title}\n${text.slice(0, 4000)}`.toLowerCase();
  for (const [alias, name] of Object.entries(COUNTY_ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}(?:\\s+county)?\\b`, "i").test(sample)) {
      return name;
    }
  }
  return "Unknown";
}

export function normalizeDocumentType(
  provided: string | undefined,
  title: string,
): string {
  const supplied = provided
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  if (supplied) return supplied;
  return DOCUMENT_TYPES.find(([pattern]) => pattern.test(title))?.[1] ?? "other";
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function cleanCountyValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bcounty of\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function cleanRequired(value: unknown, label: string, limit: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  if (value.length > limit) throw new Error(`${label} is too large.`);
  return value.trim();
}

function cleanOptional(value: unknown, limit: number): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (value.length > limit) throw new Error("Metadata value is too large.");
  return value.trim();
}

function sanitizeMetadata(value: Record<string, unknown>): Record<string, unknown> {
  const serialized = JSON.stringify(value);
  if (serialized.length > 20_000) throw new Error("Metadata is too large.");
  return JSON.parse(serialized) as Record<string, unknown>;
}

function splitLongText(value: string, limit: number): string[] {
  if (value.length <= limit) return [value];
  const pieces: string[] = [];
  let remaining = value;
  while (remaining.length > limit) {
    let split = remaining.lastIndexOf(" ", limit);
    if (split < limit * 0.6) split = limit;
    pieces.push(remaining.slice(0, split).trim());
    remaining = remaining.slice(split).trim();
  }
  if (remaining) pieces.push(remaining);
  return pieces;
}

function tailAtWordBoundary(value: string, characters: number): string {
  if (value.length <= characters) return value;
  const tail = value.slice(-characters);
  const firstSpace = tail.indexOf(" ");
  return (firstSpace >= 0 ? tail.slice(firstSpace + 1) : tail).trim();
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function stablePointId(
  sourceId: string,
  contentHash: string,
  index: number,
): Promise<string> {
  const hash = await sha256(`${sourceId}:${contentHash}:${index}`);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
