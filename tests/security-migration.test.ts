import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("migration keeps internal tables server-only and models pilot operations", async () => {
  const sql = await readFile(
    new URL(
      "../supabase/migrations/20260728191816_appeal_intelligence_core.sql",
      import.meta.url,
    ),
    "utf8",
  );
  for (const table of [
    "county_profiles",
    "apn_qdrant_index",
    "shadow_scoring_log",
    "apartment_targets",
  ]) {
    assert.match(sql, new RegExp(`'${table}'`));
  }
  assert.match(sql, /revoke all on table public\.%I from anon, authenticated/i);
  assert.match(sql, /case_document_vectors/i);
  assert.match(sql, /source_sync_runs/i);
  assert.match(sql, /appeal_audit_events/i);
  assert.match(sql, /assigned_analyst_email/i);
});
