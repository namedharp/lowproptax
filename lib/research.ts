import { createDemoResearch } from "./demo-data";
import type {
  AppealCase,
  EvidenceCitation,
  ResearchResult,
  SimilarCase,
} from "./types";

type QdrantPoint = {
  id?: string | number;
  score?: number;
  payload?: Record<string, unknown> | null;
};

const OPENAI_URL = "https://api.openai.com/v1";

export function liveResearchIsConfigured(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY &&
      process.env.QDRANT_URL &&
      process.env.QDRANT_API_KEY &&
      process.env.DEMO_MODE !== "true",
  );
}

export async function researchAppeal(
  question: string,
  appealCase: AppealCase,
): Promise<ResearchResult> {
  if (!liveResearchIsConfigured()) {
    return createDemoResearch(question, appealCase);
  }

  const vector = await createEmbedding(buildSearchText(question, appealCase));
  const [researchPoints, appealPoints] = await Promise.all([
    queryQdrant(
      process.env.QDRANT_RESEARCH_COLLECTION ?? "lpt_research",
      vector,
      appealCase.county,
      8,
    ),
    queryQdrant(
      process.env.QDRANT_APPEAL_COLLECTION ?? "appeal_comps",
      vector,
      appealCase.county,
      6,
    ),
  ]);

  const citations = researchPoints
    .map(pointToCitation)
    .filter((item): item is EvidenceCitation => item !== null);
  const similarCases = appealPoints
    .map(pointToSimilarCase)
    .filter((item): item is SimilarCase => item !== null);
  const evidence = citations
    .map(
      (citation, index) =>
        `[${index + 1}] ${citation.title} (${citation.county}, ${citation.documentType})\n${citation.excerpt}`,
    )
    .join("\n\n");

  const answer = await generateGroundedAnswer(
    question,
    appealCase,
    evidence,
    similarCases,
  );

  return {
    mode: "live",
    answer,
    confidence: confidenceFromResults(researchPoints, appealPoints),
    similarCases,
    citations,
    gaps: deriveEvidenceGaps(appealCase, citations),
    generatedAt: new Date().toISOString(),
  };
}

async function createEmbedding(input: string): Promise<number[]> {
  const response = await fetchWithTimeout(`${OPENAI_URL}/embeddings`, {
    method: "POST",
    headers: openAIHeaders(),
    body: JSON.stringify({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: input.slice(0, 12000),
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };
  const embedding = data.data?.[0]?.embedding;
  if (!embedding?.length) throw new Error("Embedding response was empty.");
  return embedding;
}

async function queryQdrant(
  collection: string,
  vector: number[],
  county: string,
  limit: number,
): Promise<QdrantPoint[]> {
  const baseUrl = process.env.QDRANT_URL!.replace(/\/+$/, "");
  const response = await fetchWithTimeout(
    `${baseUrl}/collections/${encodeURIComponent(collection)}/points/query`,
    {
      method: "POST",
      headers: {
        "api-key": process.env.QDRANT_API_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: vector,
        limit,
        with_payload: true,
        filter: {
          must: [{ key: "county", match: { value: county } }],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Evidence search failed for ${collection} (${response.status}).`,
    );
  }

  const data = (await response.json()) as {
    result?: { points?: QdrantPoint[] } | QdrantPoint[];
  };
  return Array.isArray(data.result)
    ? data.result
    : (data.result?.points ?? []);
}

async function generateGroundedAnswer(
  question: string,
  appealCase: AppealCase,
  evidence: string,
  similarCases: SimilarCase[],
): Promise<string> {
  const compactCases = similarCases
    .map(
      (item) =>
        `${item.id}: ${item.outcome}; match ${item.match}%; ${item.reason}`,
    )
    .join("\n");

  const response = await fetchWithTimeout(`${OPENAI_URL}/responses`, {
    method: "POST",
    headers: openAIHeaders(),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-sol",
      store: false,
      instructions:
        "You are an internal California property-tax appeal research assistant. Answer only from the supplied evidence. Clearly distinguish evidence from inference. Never invent a ruling, fact, citation, or success probability. Be concise, practical, and state material limitations. Cite source numbers in square brackets.",
      input: `CASE\n${JSON.stringify(appealCase)}\n\nQUESTION\n${question}\n\nPUBLIC EVIDENCE\n${evidence || "No research passages were returned."}\n\nSIMILAR APPEALS\n${compactCases || "No comparable appeals were returned."}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Answer generation failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };
  const text =
    data.output_text ??
    data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text ?? "")
      .join("\n");

  if (!text?.trim()) throw new Error("The model returned an empty answer.");
  return text.trim();
}

function openAIHeaders(): Record<string, string> {
  return {
    authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "content-type": "application/json",
  };
}

function buildSearchText(question: string, appealCase: AppealCase): string {
  return [
    question,
    appealCase.county,
    appealCase.propertyType,
    appealCase.issue,
    appealCase.taxYear,
  ].join("\n");
}

function pointToCitation(point: QdrantPoint): EvidenceCitation | null {
  const payload = point.payload ?? {};
  const excerpt = firstString(
    payload.text,
    payload.content,
    payload.page_content,
    payload.chunk,
  );
  if (!excerpt) return null;

  return {
    id: String(point.id ?? crypto.randomUUID()),
    title:
      firstString(payload.title, payload.filename, payload.document_name) ??
      "Public-record evidence",
    county: firstString(payload.county) ?? "California",
    documentType:
      firstString(payload.doc_type, payload.document_type) ?? "Source record",
    excerpt: excerpt.slice(0, 420),
    sourceUrl: firstString(payload.source_url, payload.url),
  };
}

function pointToSimilarCase(point: QdrantPoint): SimilarCase | null {
  const payload = point.payload ?? {};
  const rawOutcome = (firstString(payload.outcome, payload.status) ?? "Pending")
    .toLowerCase()
    .trim();
  const outcome: SimilarCase["outcome"] =
    rawOutcome === "win"
      ? "Win"
      : rawOutcome === "loss"
        ? "Loss"
        : rawOutcome === "withdrawn"
          ? "Withdrawn"
          : "Pending";

  return {
    id: String(
      firstString(payload.appeal_number, payload.case_number) ??
        point.id ??
        "Unknown",
    ),
    county: firstString(payload.county) ?? "Unknown",
    year: String(firstString(payload.tax_year, payload.year) ?? "—"),
    propertyType:
      firstString(payload.property_type, payload.type) ?? "Property",
    match: Math.round(Math.max(0, Math.min(1, point.score ?? 0)) * 100),
    outcome,
    reduction: firstNumber(
      payload.reduction_percent,
      payload.reduction_pct,
      payload.percent_reduction,
    ),
    reason:
      firstString(
        payload.reason,
        payload.summary,
        payload.notes,
        payload.decision,
      ) ?? "No written reason was stored with this appeal.",
  };
}

function confidenceFromResults(
  research: QdrantPoint[],
  appeals: QdrantPoint[],
): number {
  const scores = [...research, ...appeals]
    .map((point) => point.score)
    .filter((score): score is number => typeof score === "number");
  if (!scores.length) return 45;
  const average =
    scores.reduce((total, score) => total + score, 0) / scores.length;
  return Math.round(Math.max(45, Math.min(92, average * 100)));
}

function deriveEvidenceGaps(
  appealCase: AppealCase,
  citations: EvidenceCitation[],
): string[] {
  const gaps = [
    `Confirm all valuation evidence is anchored to the ${appealCase.taxYear} lien date.`,
    "Reconcile the requested value to a complete calculation with documented inputs.",
  ];
  if (citations.length < 3) {
    gaps.push("Broaden the source search before relying on this answer.");
  }
  return gaps;
}

function firstString(...values: unknown[]): string | undefined {
  return values.find(
    (value): value is string =>
      typeof value === "string" && value.trim() !== "",
  );
}

function firstNumber(...values: unknown[]): number | null {
  const value = values.find(
    (item) =>
      typeof item === "number" ||
      (typeof item === "string" && item !== ""),
  );
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
