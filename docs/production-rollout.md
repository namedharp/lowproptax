# Sacramento pilot rollout

## 1. Rotate exposed credentials

Rotate every credential previously pasted into chat. Put replacements only in
the hosting runtime, GitHub Actions secrets, Supabase staging, or the worker
secret store. Do not reuse the old Qdrant, model, or server credentials.

## 2. Validate Supabase staging

Apply the migration in staging. Create at least one admin and the pilot analyst
accounts, then confirm:

- team members can view Sacramento cases;
- only the assigned analyst or an admin can edit;
- anon and authenticated browser roles have no direct grants on internal
  tables;
- the same Lambda or Drive sync can run twice without duplicates;
- private case uploads create only `case_private_live` queue mappings;
- all edits and access-management changes create audit events.

Run `supabase/validation/sacramento_pilot.sql`. Keep the separate
`docs/supabase-security-review.sql` review for pre-existing functions and other
tables outside this pilot migration.

## 3. Build versioned indexes

Run the Python worker with `--bootstrap`, ingest Sacramento public FOIA records,
prior appeal metadata, and redacted private test documents. Do not activate the
aliases yet. Confirm all payloads include a document ID, content hash, source
URL where public, document type, page range, tax year/property type/outcome when
known, `county_slug=sacramento`, and the correct visibility.

## 4. Configure live services

Required server values are documented in `.env.example`. DeepInfra answers use
`deepseek-ai/DeepSeek-V4-Flash`. Qdrant generates MiniLM dense vectors and BM25
sparse vectors directly. Millage remains waiting until a read-only HTTPS API is
available.

Configure the nightly GitHub workflow with read-only Drive credentials,
Supabase service credentials, and rotated Qdrant credentials. Run it manually
once before relying on the schedule.

## 5. Pass the evaluation gate

Use 30 or more analyst-written questions from 20–30 Sacramento appeals. Run the
automated retrieval/privacy/latency evaluation and manually review every answer
for unsupported factual claims. Required:

- top-five relevant evidence rate at least 85%;
- working page references at least 95%;
- zero unsupported factual claims;
- zero private points in public collections;
- zero anonymous internal-table access;
- zero duplicates after repeated synchronization;
- full research-response P95 below 20 seconds.

## 6. Activate gradually

After the gate passes, switch the three stable Qdrant aliases with
`--activate-aliases`. Enable live mode for admins first, review telemetry and
OCR failures, then add analysts. Retain the old collections for at least 30
days. Filing packets, notifications, CMA write-back, and other counties remain
out of scope for this pilot.
