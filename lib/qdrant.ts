import "server-only";

import type {
  ResearchLibraryFilters,
  ResearchLibraryItem,
  SourceHealth,
} from "./types";
import { buildHybridQueryBody } from "./qdrant-query";

export {
  buildHybridQueryBody,
  DENSE_MODEL,
  PILOT_COUNTY_SLUG,
  SPARSE_MODEL,
} from "./qdrant-query";

export type QdrantPoint = {
  id?: string | number;
  score?: number;
  payload?: Record<string, unknown> | null;
};

export type EvidenceScope = "public" | "prior_appeal" | "private_case";

export const QDRANT_COLLECTIONS = {
  research:
    process.env.QDRANT_RESEARCH_COLLECTION ?? "lpt_research_live",
  appeals: process.env.QDRANT_APPEAL_COLLECTION ?? "appeal_comps_live",
  private: process.env.QDRANT_PRIVATE_COLLECTION ?? "case_private_live",
} as const;

export function qdrantIsConfigured(): boolean {
  return Boolean(process.env.QDRANT_URL && process.env.QDRANT_API_KEY);
}

export async function hybridQuery(
  collection: string,
  input: {
    text: string;
    limit: number;
    appealId?: string;
    filters?: Omit<ResearchLibraryFilters, "query">;
  },
): Promise<QdrantPoint[]> {
  if (!qdrantIsConfigured()) return [];
  const response = await qdrantFetch(
    `/collections/${encodeURIComponent(collection)}/points/query`,
    {
      method: "POST",
      body: JSON.stringify(buildHybridQueryBody(input)),
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

export async function searchResearchLibrary(
  filters: ResearchLibraryFilters,
): Promise<ResearchLibraryItem[]> {
  const [publicPoints, appealPoints] = await Promise.all([
    hybridQuery(QDRANT_COLLECTIONS.research, {
      text: filters.query,
      limit: 20,
      filters,
    }),
    hybridQuery(QDRANT_COLLECTIONS.appeals, {
      text: filters.query,
      limit: 12,
      filters,
    }),
  ]);
  return [
    ...publicPoints.map((point) => libraryItem(point, "public")),
    ...appealPoints.map((point) => libraryItem(point, "prior_appeal")),
  ]
    .filter((item): item is ResearchLibraryItem => item !== null)
    .sort((left, right) => right.score - left.score)
    .slice(0, 25);
}

export async function getQdrantHealth(): Promise<{
  source: SourceHealth;
  collections: Array<{
    alias: string;
    target?: string;
    status: "ready" | "missing" | "unconfigured";
    pointCount?: number;
  }>;
}> {
  const aliases = Object.values(QDRANT_COLLECTIONS);
  if (!qdrantIsConfigured()) {
    return {
      source: {
        id: "qdrant",
        label: "Sacramento evidence index",
        status: "unconfigured",
        detail: "Server credentials have not been configured.",
      },
      collections: aliases.map((alias) => ({
        alias,
        status: "unconfigured",
      })),
    };
  }

  const collections = await Promise.all(
    aliases.map(async (alias) => {
      try {
        const aliasResponse = await qdrantFetch(
          `/aliases/${encodeURIComponent(alias)}`,
        );
        if (!aliasResponse.ok) return { alias, status: "missing" as const };
        const aliasData = (await aliasResponse.json()) as {
          result?: { aliases?: Array<{ alias_name?: string; collection_name?: string }> };
        };
        const target = aliasData.result?.aliases?.find(
          (item) => item.alias_name === alias,
        )?.collection_name;
        if (!target) return { alias, status: "missing" as const };
        const collectionResponse = await qdrantFetch(
          `/collections/${encodeURIComponent(target)}`,
        );
        if (!collectionResponse.ok) {
          return { alias, target, status: "missing" as const };
        }
        const collectionData = (await collectionResponse.json()) as {
          result?: { points_count?: number; status?: string };
        };
        return {
          alias,
          target,
          status:
            collectionData.result?.status === "green"
              ? ("ready" as const)
              : ("missing" as const),
          pointCount: collectionData.result?.points_count,
        };
      } catch {
        return { alias, status: "missing" as const };
      }
    }),
  );
  const ready = collections.filter((item) => item.status === "ready").length;
  return {
    source: {
      id: "qdrant",
      label: "Sacramento evidence index",
      status: ready === aliases.length ? "healthy" : "degraded",
      detail: `${ready} of ${aliases.length} live aliases are ready.`,
      recordCount: collections.reduce(
        (total, item) => total + (item.pointCount ?? 0),
        0,
      ),
    },
    collections,
  };
}

function libraryItem(
  point: QdrantPoint,
  sourceType: "public" | "prior_appeal",
): ResearchLibraryItem | null {
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
      "Sacramento County record",
    county: "Sacramento",
    documentType:
      firstString(payload.document_type, payload.doc_type) ?? "Source record",
    excerpt: excerpt.slice(0, 700),
    sourceUrl: firstString(payload.source_url, payload.url),
    sourceType,
    documentId: firstString(payload.document_id),
    pageStart: firstNumber(payload.page_start, payload.page),
    pageEnd: firstNumber(payload.page_end, payload.page),
    score: Number(point.score ?? 0),
    taxYear: firstString(payload.tax_year),
    propertyType: firstString(payload.property_type),
    outcome: firstString(payload.outcome),
  };
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

async function qdrantFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(
      `${process.env.QDRANT_URL!.replace(/\/+$/, "")}${path}`,
      {
        ...init,
        headers: {
          "api-key": process.env.QDRANT_API_KEY!,
          "content-type": "application/json",
          ...init.headers,
        },
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
