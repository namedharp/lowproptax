# LowPropTax Sacramento Appeal Intelligence

An internal analyst workspace for Sacramento County property-tax research. It
uses Supabase as the case master, Qdrant Cloud Inference for dense + BM25
retrieval, and DeepInfra `deepseek-ai/DeepSeek-V4-Flash` for structured,
evidence-grounded answers.

## Included

- Team-wide case viewing with assigned-analyst editing and full admin access.
- Server-loaded research requests shaped as `{ appealId, question, threadId? }`.
- Separate searches for Sacramento public records, prior appeals, and
  case-filtered private documents.
- Redacted private excerpts, page-level citations, evidence gaps, limitations,
  inference labels, confidence, latency, and token telemetry.
- A live Research Library with year, property type, document type, and outcome
  filters; county is locked to Sacramento.
- Dynamic portfolio metrics, source health, and an admin view for analysts,
  synchronization, OCR failures, aliases, and index health.
- Idempotent Sacramento Lambda synchronization that preserves Supabase-owned
  analyst fields.
- Nightly Drive extraction plus an OCRmyPDF/Tesseract Python worker.
- Versioned 384-dimensional Qdrant collections with named `dense` and `bm25`
  vectors and reciprocal-rank fusion.

## Run locally

1. Use Node.js 22.13 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Leave `DEMO_MODE=true` for the fictional Sacramento workspace.
5. Run `npm run dev`.

No LLM, Qdrant, Supabase, or Millage secret may use a `NEXT_PUBLIC_` prefix.

## Supabase staging

The unapplied migration in `supabase/migrations` extends the existing
`appeals`, `properties`, and `appeal_documents` tables. It adds:

- analyst/admin accounts and assignments;
- research telemetry and feedback;
- source and external-record mappings;
- synchronization and OCR/ingestion jobs;
- case-document vector mappings;
- audit events;
- a private `case-documents` bucket.

It also enables RLS and revokes browser access for the four exposed internal
tables named in the pilot plan. Apply and validate this migration in a Supabase
staging project before production. Run
`supabase/validation/sacramento_pilot.sql` after two identical sync passes.

## Qdrant bootstrap and ingestion

Install the worker dependencies and the OCRmyPDF/Tesseract system packages.
With rotated server-side Qdrant secrets:

```sh
python worker/sacramento_ingest.py --bootstrap
npm run sync:drive -- --out=work/foia-drive-manifest.json
python worker/sacramento_ingest.py --manifest work/foia-drive-manifest.json
```

Bootstrap creates, but does not activate:

- `lpt_research_v2_384`
- `appeal_comps_v2_384`
- `case_private_v1_384`

The old collections remain untouched. Only after the evaluation gate passes:

```sh
python worker/sacramento_ingest.py --activate-aliases
```

This switches `lpt_research_live`, `appeal_comps_live`, and
`case_private_live` atomically. Keep the old collections for at least 30 days.

## Synchronization

- `npm run sync:sacramento` imports the Lambda `appeals` collection.
- `npm run sync:drive` creates a Sacramento manifest and saves scanned PDFs for
  OCR.
- `.github/workflows/sacramento-sync.yml` runs both nightly when its repository
  secrets are configured.
- The admin workspace can run the Lambda sync and queue a Drive/OCR run.
- Millage is intentionally disabled until a read-only HTTPS API URL and server
  key are supplied; the HTTP web login is not used.

## Pilot evaluation

Prepare JSON with at least 30 analyst-written questions from 20–30 Sacramento
appeals:

```json
{
  "questions": [
    {
      "id": "Q-001",
      "appealId": "review-case-001",
      "question": "Which lien-date vacancy records changed similar outcomes?",
      "expectedDocumentIds": ["known-relevant-document-id"],
      "unsupportedFactualClaims": 0,
      "responseDurationMs": 8240,
      "taxYear": "2025",
      "propertyType": "Office"
    }
  ]
}
```

Run `npm run evaluate:pilot -- evaluation.json`. It fails unless top-five
relevance is at least 85%, page coverage is at least 95%, reviewed answers have
zero unsupported factual claims, public collections contain zero private
points, and retrieval P95 is under 20 seconds.

## Verify

```sh
npm run lint
npx tsc --noEmit
npm test
npm audit --omit=dev
```

Generated output is an internal research aid, not a legal or valuation
conclusion. Analysts must verify cited pages against the original records.
