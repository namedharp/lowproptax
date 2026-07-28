import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHybridQueryBody,
  DENSE_MODEL,
  PILOT_COUNTY_SLUG,
  SPARSE_MODEL,
} from "../lib/qdrant-query";

test("builds Sacramento-only dense plus BM25 reciprocal-rank fusion", () => {
  const body = buildHybridQueryBody({
    text: "office vacancy near the lien date",
    limit: 5,
    appealId: "appeal-123",
    filters: {
      taxYear: "2025",
      propertyType: "Office",
      documentType: "findings",
      outcome: "Win",
    },
  }) as {
    prefetch: Array<Record<string, unknown>>;
    query: { fusion: string };
    filter: { must: Array<{ key: string; match: { value: string } }> };
  };
  assert.equal(body.prefetch.length, 2);
  assert.deepEqual(body.prefetch.map((item) => item.using), ["dense", "bm25"]);
  assert.deepEqual(
    body.prefetch.map((item) => (item.query as { model: string }).model),
    [DENSE_MODEL, SPARSE_MODEL],
  );
  assert.equal(body.query.fusion, "rrf");
  assert.ok(
    body.filter.must.some(
      (item) =>
        item.key === "county_slug" &&
        item.match.value === PILOT_COUNTY_SLUG,
    ),
  );
  assert.ok(
    body.filter.must.some(
      (item) => item.key === "appeal_id" && item.match.value === "appeal-123",
    ),
  );
});
