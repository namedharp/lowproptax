import "server-only";

import { createDemoResearch } from "./demo-data";
import { getLlmConfiguration, llmIsConfigured } from "./llm-config";
import {
  hybridQuery,
  qdrantIsConfigured,
  QDRANT_COLLECTIONS,
  type EvidenceScope,
  type QdrantPoint,
} from "./qdrant";
import { redactPrivateExcerpt } from "./redaction";
import { liveModeIsExplicitlyEnabled } from "./runtime-mode";
import type {
  AppealCase,
  EvidenceCitation,
  ResearchResult,
  SimilarCase,
} from "./types";

type StructuredAnswer = {
  answer: string;
  limitations: string[];
  evidence_gaps: string[];
  inferences: string[];
  citation_numbers: number[];
};

type GeneratedAnswer = {
  structured: StructuredAnswer;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

const ANSWER_SCHEMA = {
  name: "sacramento_appeal_research",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "answer",
      "limitations",
      "evidence_gaps",
      "inferences",
      "citation_numbers",
    ],
    properties: {
      answer: { type: "string" },
      limitations: { type: "array", items: { type: "string" } },
      evidence_gaps: { type: "array", items: { type: "string" } },
      inferences: { type: "array", items: { type: "string" } },
      citation_numbers: {
        type: "array",
        items: { type: "integer", minimum: 1 },
      },
    },
  },
};

export function liveResearchIsConfigured(): boolean {
  return Boolean(
    llmIsConfigured() &&
      qdrantIsConfigured() &&
      liveModeIsExplicitlyEnabled(),
  );
}

export function embeddingIsConfigured(): boolean {
  return qdrantIsConfigured();
}

export async function researchAppeal(
  question: string,
  appealCase: AppealCase,
): Promise<ResearchResult> {
  if (!liveResearchIsConfigured()) {
    return createDemoResearch(question, appealCase);
  }
  if (appealCase.county.toLowerCase() !== "sacramento") {
    throw new Error("The live research pilot is restricted to Sacramento County.");
  }

  const startedAt = Date.now();
  const searchText = buildSearchText(question, appealCase);
  const [publicPoints, appealPoints, privatePoints] = await Promise.all([
    hybridQuery(QDRANT_COLLECTIONS.research, {
      text: searchText,
      limit: 8,
    }),
    hybridQuery(QDRANT_COLLECTIONS.appeals, {
      text: searchText,
      limit: 6,
    }),
    hybridQuery(QDRANT_COLLECTIONS.private, {
      text: searchText,
      appealId: appealCase.id,
      limit: 5,
    }),
  ]);

  const publicCitations = publicPoints
    .map((point) => pointToCitation(point, "public"))
    .filter((item): item is EvidenceCitation => item !== null);
  const appealCitations = appealPoints
    .map((point) => pointToCitation(point, "prior_appeal"))
    .filter((item): item is EvidenceCitation => item !== null);
  const privateCitations = privatePoints
    .map((point) => pointToCitation(point, "private_case"))
    .filter((item): item is EvidenceCitation => item !== null)
    .map((citation) => ({
      ...citation,
      excerpt: redactPrivateExcerpt(citation.excerpt).text,
      sourceUrl: undefined,
    }));
  const allCitations = [
    ...publicCitations,
    ...appealCitations,
    ...privateCitations,
  ];
  const similarCases = appealPoints
    .map(pointToSimilarCase)
    .filter((item): item is SimilarCase => item !== null);

  const generated = await generateGroundedAnswer(
    question,
    appealCase,
    allCitations,
    similarCases,
  );
  const cited = selectCitations(
    allCitations,
    generated.structured.citation_numbers,
  );
  const llm = getLlmConfiguration();

  return {
    mode: "live",
    answer: generated.structured.answer,
    confidence: confidenceFromResults(
      publicPoints,
      appealPoints,
      privatePoints,
      cited.length,
    ),
    similarCases,
    citations: cited,
    gaps: uniqueStrings([
      ...generated.structured.evidence_gaps,
      ...deriveEvidenceGaps(appealCase, allCitations),
    ]),
    limitations: uniqueStrings(generated.structured.limitations),
    inferences: generated.structured.inferences.map((item) =>
      /^inference:/i.test(item) ? item : `Inference: ${item}`,
    ),
    generatedAt: new Date().toISOString(),
    telemetry: {
      durationMs: Date.now() - startedAt,
      provider: llm.provider,
      model: llm.model,
      retrievedPointIds: [...publicPoints, ...appealPoints, ...privatePoints].map(
        (point) => String(point.id),
      ),
      ...generated.usage,
    },
  };
}

async function generateGroundedAnswer(
  question: string,
  appealCase: AppealCase,
  citations: EvidenceCitation[],
  similarCases: SimilarCase[],
): Promise<GeneratedAnswer> {
  const evidence = citations
    .map((citation, index) => {
      const pages = pageLabel(citation);
      return [
        `[${index + 1}]`,
        `scope=${citation.sourceType}`,
        `title=${citation.title}`,
        `document_type=${citation.documentType}`,
        pages ? `pages=${pages}` : "pages=not provided",
        `excerpt=${citation.excerpt}`,
      ].join("\n");
    })
    .join("\n\n");
  const compactCases = similarCases
    .map(
      (item) =>
        `${item.id}: ${item.outcome}; retrieval match ${item.match}%; ${item.reason}`,
    )
    .join("\n");

  const instructions = [
    "You are an internal California property-tax appeal research assistant.",
    "The pilot is restricted to Sacramento County.",
    "Answer only from the supplied case facts and evidence excerpts.",
    "Every factual statement drawn from evidence must cite one or more source numbers in square brackets.",
    "Do not invent a ruling, page, fact, legal conclusion, valuation conclusion, or success probability.",
    "Put analytical deductions only in the inferences array and phrase them conditionally.",
    "If the evidence does not support an answer, say so and identify the missing evidence.",
    "Private-case excerpts have already been redacted. Do not try to infer removed identifiers.",
    "Return only JSON matching the requested schema.",
  ].join(" ");
  const safeCase = {
    county: "Sacramento",
    propertyType: appealCase.propertyType,
    taxYear: appealCase.taxYear,
    assessedValue: appealCase.assessedValue,
    requestedValue: appealCase.requestedValue,
    filingDeadline: appealCase.deadline,
    caseTheory: appealCase.issue,
  };
  const input = `CASE FACTS\n${JSON.stringify(safeCase)}\n\nQUESTION\n${question}\n\nEVIDENCE\n${evidence || "No evidence excerpts were returned."}\n\nSIMILAR APPEAL METADATA\n${compactCases || "No comparable appeals were returned."}`;
  const llm = getLlmConfiguration();
  const response = await fetchWithTimeout(`${llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: bearerHeaders(llm.apiKey),
    body: JSON.stringify({
      model: llm.model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: input },
      ],
      response_format: {
        type: "json_schema",
        json_schema: ANSWER_SCHEMA,
      },
      ...(llm.maxTokens ? { max_tokens: llm.maxTokens } : {}),
      ...(llm.temperature !== undefined
        ? { temperature: llm.temperature }
        : {}),
      ...(llm.serviceTier ? { service_tier: llm.serviceTier } : {}),
      ...(llm.reasoningEffort
        ? { reasoning_effort: llm.reasoningEffort }
        : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(`Answer generation failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("The model returned an empty answer.");
  const structured = parseStructuredAnswer(raw, citations.length);
  return {
    structured,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  };
}

function parseStructuredAnswer(
  raw: string,
  citationCount: number,
): StructuredAnswer {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as Partial<StructuredAnswer>;
  if (typeof parsed.answer !== "string" || parsed.answer.trim().length === 0) {
    throw new Error("The structured answer did not include an answer.");
  }
  return {
    answer: parsed.answer.trim(),
    limitations: stringArray(parsed.limitations),
    evidence_gaps: stringArray(parsed.evidence_gaps),
    inferences: stringArray(parsed.inferences),
    citation_numbers: Array.isArray(parsed.citation_numbers)
      ? [
          ...new Set(
            parsed.citation_numbers.filter(
              (value): value is number =>
                Number.isInteger(value) && value > 0 && value <= citationCount,
            ),
          ),
        ]
      : [],
  };
}

function pointToCitation(
  point: QdrantPoint,
  scope: EvidenceScope,
): EvidenceCitation | null {
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
      (scope === "private_case"
        ? "Private case document"
        : "Sacramento County record"),
    county: "Sacramento",
    documentType:
      firstString(payload.document_type, payload.doc_type) ?? "Source record",
    excerpt: excerpt.slice(0, 900),
    sourceUrl:
      scope === "private_case"
        ? undefined
        : firstString(payload.source_url, payload.url),
    sourceType: scope,
    documentId: firstString(payload.document_id),
    pageStart: firstNumber(payload.page_start, payload.page),
    pageEnd: firstNumber(payload.page_end, payload.page),
  };
}

function pointToSimilarCase(point: QdrantPoint): SimilarCase | null {
  const payload = point.payload ?? {};
  const rawOutcome = (firstString(payload.outcome, payload.status) ?? "Pending")
    .toLowerCase()
    .trim();
  const outcome: SimilarCase["outcome"] =
    rawOutcome === "win" || rawOutcome === "reduced"
      ? "Win"
      : rawOutcome === "loss" || rawOutcome === "denied"
        ? "Loss"
        : rawOutcome === "withdrawn"
          ? "Withdrawn"
          : "Pending";
  const score = Number(point.score ?? 0);
  return {
    id: String(
      firstString(payload.appeal_number, payload.case_number) ??
        point.id ??
        "Unknown",
    ),
    county: "Sacramento",
    year: String(firstString(payload.tax_year, payload.year) ?? "Not stored"),
    propertyType:
      firstString(payload.property_type, payload.type) ?? "Property",
    match: Math.round(Math.max(0, Math.min(1, score)) * 100),
    outcome,
    reduction: firstNullableNumber(
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

function selectCitations(
  citations: EvidenceCitation[],
  numbers: number[],
): EvidenceCitation[] {
  if (!numbers.length) {
    return citations
      .slice(0, Math.min(citations.length, 5))
      .map((item, index) => ({ ...item, sourceNumber: index + 1 }));
  }
  return numbers.flatMap((number): EvidenceCitation[] => {
      const item = citations[number - 1];
      return item ? [{ ...item, sourceNumber: number }] : [];
    });
}

function confidenceFromResults(
  research: QdrantPoint[],
  appeals: QdrantPoint[],
  privatePoints: QdrantPoint[],
  citationCoverage: number,
): number {
  const resultCount = research.length + appeals.length + privatePoints.length;
  if (!resultCount) return 20;
  const scopeCoverage =
    Number(research.length > 0) +
    Number(appeals.length > 0) +
    Number(privatePoints.length > 0);
  const countScore = Math.min(30, resultCount * 2);
  const coverageScore = scopeCoverage * 10;
  const citationScore = Math.min(12, citationCoverage * 3);
  const scores = [...research, ...appeals, ...privatePoints]
    .map((point) => Number(point.score))
    .filter((score) => Number.isFinite(score) && score > 0)
    .slice(0, 10);
  const retrievalStrength = scores.length
    ? Math.min(
        18,
        (scores.reduce((total, score) => total + score, 0) / scores.length) *
          24,
      )
    : 0;
  return Math.min(
    92,
    Math.round(
      18 + countScore + coverageScore + citationScore + retrievalStrength,
    ),
  );
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
    gaps.push("Broaden the Sacramento source search before relying on this answer.");
  }
  if (!citations.some((item) => item.pageStart)) {
    gaps.push("Page locators are missing from the retrieved evidence.");
  }
  return gaps;
}

function buildSearchText(question: string, appealCase: AppealCase): string {
  return [
    question,
    "Sacramento County",
    appealCase.propertyType,
    appealCase.issue,
    appealCase.taxYear,
  ].join("\n");
}

function pageLabel(citation: EvidenceCitation): string | undefined {
  if (!citation.pageStart) return undefined;
  return citation.pageEnd && citation.pageEnd !== citation.pageStart
    ? `${citation.pageStart}-${citation.pageEnd}`
    : String(citation.pageStart);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
        .map((item) => item.trim())
    : [];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function firstString(...values: unknown[]): string | undefined {
  const value = values.find(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
  return value?.trim();
}

function firstNumber(...values: unknown[]): number | undefined {
  const value = values.find(
    (item) =>
      typeof item === "number" ||
      (typeof item === "string" && item.trim().length > 0),
  );
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstNullableNumber(...values: unknown[]): number | null {
  return firstNumber(...values) ?? null;
}

function bearerHeaders(apiKey: string | undefined): Record<string, string> {
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
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
