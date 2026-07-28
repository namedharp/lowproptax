import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildHybridQueryBody } from "../lib/qdrant-query";

type EvaluationQuestion = {
  id: string;
  appealId: string;
  question: string;
  expectedDocumentIds: string[];
  unsupportedFactualClaims: number;
  responseDurationMs: number;
  taxYear?: string;
  propertyType?: string;
  documentType?: string;
  outcome?: string;
};

type QdrantPoint = {
  id: string | number;
  score?: number;
  payload?: Record<string, unknown>;
};

const path = process.argv.slice(2).find((item) => !item.startsWith("--"));
if (!path) {
  throw new Error("Provide the analyst-written evaluation JSON file.");
}
const raw = JSON.parse(await readFile(resolve(path), "utf8")) as {
  questions?: EvaluationQuestion[];
};
const questions = raw.questions ?? [];
if (questions.length < 30) {
  throw new Error("The pilot gate requires at least 30 analyst-written questions.");
}
const reviewedAppeals = new Set(questions.map((item) => item.appealId));
if (reviewedAppeals.size < 20 || reviewedAppeals.size > 30) {
  throw new Error("The pilot gate requires questions from 20 to 30 appeals.");
}
requireEnvironment(["QDRANT_URL", "QDRANT_API_KEY"]);

const latencies: number[] = [];
let relevantTopFive = 0;
let citationsWithPages = 0;
let citationCount = 0;

for (const question of questions) {
  if (
    !question.id ||
    !question.appealId ||
    question.question.trim().length < 5 ||
    !question.expectedDocumentIds.length ||
    !Number.isInteger(question.unsupportedFactualClaims) ||
    question.unsupportedFactualClaims < 0 ||
    !Number.isFinite(question.responseDurationMs) ||
    question.responseDurationMs <= 0
  ) {
    throw new Error(`Evaluation question ${question.id || "unknown"} is incomplete.`);
  }
  const startedAt = performance.now();
  const [publicPoints, appealPoints] = await Promise.all([
    query(process.env.QDRANT_RESEARCH_COLLECTION ?? "lpt_research_live", question),
    query(process.env.QDRANT_APPEAL_COLLECTION ?? "appeal_comps_live", question),
  ]);
  latencies.push(performance.now() - startedAt);
  const topFive = [...publicPoints, ...appealPoints]
    .sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0))
    .slice(0, 5);
  if (
    topFive.some((point) =>
      question.expectedDocumentIds.includes(
        String(point.payload?.document_id ?? ""),
      ),
    )
  ) {
    relevantTopFive += 1;
  }
  for (const point of topFive) {
    citationCount += 1;
    if (Number(point.payload?.page_start) > 0) citationsWithPages += 1;
  }
}

const privateLeaks = await Promise.all([
  privatePointCount(process.env.QDRANT_RESEARCH_COLLECTION ?? "lpt_research_live"),
  privatePointCount(process.env.QDRANT_APPEAL_COLLECTION ?? "appeal_comps_live"),
]);
const relevanceRate = relevantTopFive / questions.length;
const pageRate = citationCount ? citationsWithPages / citationCount : 0;
const p95 = percentile(latencies, 0.95);
const responseP95 = percentile(
  questions.map((item) => item.responseDurationMs),
  0.95,
);
const unsupportedFactualClaims = questions.reduce(
  (total, item) => total + item.unsupportedFactualClaims,
  0,
);
const report = {
  reviewedAppeals: reviewedAppeals.size,
  questions: questions.length,
  relevantEvidenceTopFiveRate: relevanceRate,
  pageReferenceRate: pageRate,
  privatePointsInPublicCollections: privateLeaks.reduce(
    (total, count) => total + count,
    0,
  ),
  retrievalP95Ms: Math.round(p95),
  researchResponseP95Ms: Math.round(responseP95),
  unsupportedFactualClaims,
  gates: {
    relevantEvidenceTopFive: relevanceRate >= 0.85,
    pageReferences: pageRate >= 0.95,
    privateCollectionSeparation: privateLeaks.every((count) => count === 0),
    researchResponseLatency: responseP95 < 20_000,
    groundedAnswers: unsupportedFactualClaims === 0,
  },
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (Object.values(report.gates).some((passed) => !passed)) process.exitCode = 1;

async function query(
  collection: string,
  question: EvaluationQuestion,
): Promise<QdrantPoint[]> {
  const response = await qdrantFetch(
    `/collections/${encodeURIComponent(collection)}/points/query`,
    {
      method: "POST",
      body: JSON.stringify(
        buildHybridQueryBody({
          text: question.question,
          limit: 10,
          filters: {
            taxYear: question.taxYear,
            propertyType: question.propertyType,
            documentType: question.documentType,
            outcome: question.outcome,
          },
        }),
      ),
    },
  );
  if (!response.ok) throw new Error(`Evaluation query failed (${response.status}).`);
  const data = (await response.json()) as {
    result?: { points?: QdrantPoint[] } | QdrantPoint[];
  };
  return Array.isArray(data.result) ? data.result : (data.result?.points ?? []);
}

async function privatePointCount(collection: string): Promise<number> {
  const response = await qdrantFetch(
    `/collections/${encodeURIComponent(collection)}/points/count`,
    {
      method: "POST",
      body: JSON.stringify({
        exact: true,
        filter: {
          must: [{ key: "visibility", match: { value: "private_case" } }],
        },
      }),
    },
  );
  if (!response.ok) throw new Error(`Privacy count failed (${response.status}).`);
  const data = (await response.json()) as { result?: { count?: number } };
  return Number(data.result?.count ?? 0);
}

async function qdrantFetch(
  path: string,
  init: RequestInit,
): Promise<Response> {
  return fetch(`${process.env.QDRANT_URL!.replace(/\/+$/, "")}${path}`, {
    ...init,
    headers: {
      "api-key": process.env.QDRANT_API_KEY!,
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(20_000),
  });
}

function percentile(values: number[], rank: number): number {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * rank) - 1)];
}

function requireEnvironment(names: string[]) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment values: ${missing.join(", ")}`);
  }
}
