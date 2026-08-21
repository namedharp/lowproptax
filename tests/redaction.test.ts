import assert from "node:assert/strict";
import test from "node:test";
import { redactPrivateExcerpt } from "../lib/redaction";

test("redacts private identifiers while preserving valuation evidence", () => {
  const result = redactPrivateExcerpt(
    "Owner name: Jane Taxpayer; jane@example.com; (916) 555-0100; SSN 123-45-6789. Vacancy was 22%.",
  );
  assert.doesNotMatch(result.text, /Jane Taxpayer|jane@example|555-0100|123-45/);
  assert.match(result.text, /Vacancy was 22%/);
  assert.ok(result.replacements >= 4);
  assert.equal(result.version, "pii-v1");
});
