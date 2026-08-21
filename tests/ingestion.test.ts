import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCounty,
  normalizeDocumentType,
  previewFoiaDocument,
} from "../lib/ingestion/normalize";

test("normalizes county aliases and document classifications", () => {
  assert.equal(normalizeCounty("Eldorado County"), "El Dorado");
  assert.equal(
    normalizeDocumentType(undefined, "Assessment Appeals Board Findings of Fact"),
    "findings",
  );
  assert.equal(
    normalizeDocumentType(undefined, "July Hearing Agenda and Minutes"),
    "hearing_agenda",
  );
});

test("prepares stable, bounded FOIA chunks with source metadata", async () => {
  const text = Array.from(
    { length: 35 },
    (_, index) =>
      `Paragraph ${index + 1}. The Sacramento County board reviewed valuation evidence, lien-date conditions, and the documented income approach.`,
  ).join("\n\n");
  const first = await previewFoiaDocument({
    sourceId: "drive-example-1",
    title: "Sacramento Findings of Fact",
    text,
    visibility: "public_foia",
  });
  const second = await previewFoiaDocument({
    sourceId: "drive-example-1",
    title: "Sacramento Findings of Fact",
    text,
    visibility: "public_foia",
  });

  assert.equal(first.source.county, "Sacramento");
  assert.equal(first.source.documentType, "findings");
  assert.ok(first.chunks.length > 1);
  assert.equal(first.chunks[0].id, second.chunks[0].id);
  assert.ok(first.chunks.every((chunk) => chunk.tokenEstimate < 600));
  assert.deepEqual(first.warnings, []);
});

test("warns when OCR or source classification is likely needed", async () => {
  const preview = await previewFoiaDocument({
    sourceId: "unknown-1",
    title: "Scanned packet",
    text: "A very short scan.",
  });
  assert.deepEqual(preview.warnings, [
    "County could not be identified.",
    "Document type could not be classified.",
    "Very little text was extracted; the source may require OCR.",
  ]);
});
