import type { ResearchLibraryFilters } from "./types";

export const PILOT_COUNTY_SLUG = "sacramento";
export const DENSE_MODEL =
  process.env.QDRANT_DENSE_MODEL ??
  "sentence-transformers/all-minilm-l6-v2";
export const SPARSE_MODEL = process.env.QDRANT_BM25_MODEL ?? "qdrant/bm25";

type QueryFilter = {
  must: Array<{
    key: string;
    match?: { value: string };
    range?: { gte?: number; lte?: number };
  }>;
};

export function buildHybridQueryBody(input: {
  text: string;
  limit: number;
  appealId?: string;
  filters?: Omit<ResearchLibraryFilters, "query">;
}): Record<string, unknown> {
  const filter = buildFilter(input.appealId, input.filters);
  const prefetchLimit = Math.max(input.limit * 3, 20);
  return {
    prefetch: [
      {
        query: { text: input.text.slice(0, 12000), model: DENSE_MODEL },
        using: "dense",
        filter,
        limit: prefetchLimit,
      },
      {
        query: { text: input.text.slice(0, 12000), model: SPARSE_MODEL },
        using: "bm25",
        filter,
        limit: prefetchLimit,
      },
    ],
    query: { fusion: "rrf" },
    filter,
    limit: input.limit,
    with_payload: true,
    with_vector: false,
  };
}

function buildFilter(
  appealId?: string,
  filters?: Omit<ResearchLibraryFilters, "query">,
): QueryFilter {
  const must: QueryFilter["must"] = [
    { key: "county_slug", match: { value: PILOT_COUNTY_SLUG } },
  ];
  if (appealId) must.push({ key: "appeal_id", match: { value: appealId } });
  if (filters?.taxYear) {
    must.push({ key: "tax_year", match: { value: filters.taxYear } });
  }
  if (filters?.propertyType) {
    must.push({
      key: "property_type",
      match: { value: filters.propertyType },
    });
  }
  if (filters?.documentType) {
    must.push({
      key: "document_type",
      match: { value: filters.documentType },
    });
  }
  if (filters?.outcome) {
    must.push({ key: "outcome", match: { value: filters.outcome } });
  }
  return { must };
}
