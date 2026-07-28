# LowPropTax Appeal Intelligence

An internal analyst workspace for researching California property-tax appeals.
It combines active case facts with prior appeal outcomes and public-record
evidence, then produces a concise answer with reviewable citations and evidence
gaps.

## What is included

- A responsive case workspace, active-case portfolio, research library, and data
  source inventory.
- A working fictional-data mode for safe evaluation.
- A server-side evidence pipeline that embeds the case question, searches the
  existing `lpt_research` and `appeal_comps` Qdrant collections, and asks
  DeepInfra's `deepseek-ai/DeepSeek-V4-Flash` model for a grounded answer.
- A Supabase migration that extends the existing `appeals`, `properties`, and
  `appeal_documents` schema with private research history, feedback, evidence
  checklists, ingestion tracking, and a private case-document bucket.
- Health and research API routes with input validation, timeouts, and no browser
  exposure of private keys.

## Run locally

1. Use Node.js 22.13 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Leave `DEMO_MODE=true` to evaluate the fictional workflow.
5. Run `npm run dev` and open `http://localhost:3000`.

## Enable live evidence research

Set `DEMO_MODE=false` and provide server-side LLM, embedding, and Qdrant
credentials.
The existing Qdrant collections use 1,536-dimensional vectors, so the default
query model is `text-embedding-3-small`. Changing to a 384-dimensional model
requires a versioned re-index into new collections.

DeepInfra is the configured answer provider. Its OpenAI-compatible endpoint uses
`https://api.deepinfra.com/v1/openai`, the `chat-completions` API style, and
`deepseek-ai/DeepSeek-V4-Flash`. Configure
`LLM_API_BASE_URL`, `LLM_API_STYLE` (`responses` or `chat-completions`),
`LLM_MODEL`, and `LLM_API_KEY`. Chat credentials and embedding credentials are
separate because some providers do not offer a compatible 1,536-dimensional
embedding model.

Never prefix an LLM key, Qdrant key, or Supabase secret key with
`NEXT_PUBLIC_`. Those values must remain server-only.

## Supabase

The migration under `supabase/migrations` extends the private case layer. Review
it against a staging project before applying it:

```sh
npx supabase@2.110.0 db push
```

New research and ingestion tables are available only through authenticated
server routes; browser roles receive no direct grants. Live access also requires
`ANALYST_EMAIL_ALLOWLIST`.

The connected project currently has existing security-advisor findings. Review
`docs/supabase-security-review.sql` before changing those policies—the file is
intentionally outside the automatic migrations folder.

## FOIA ingestion

1. Set `GOOGLE_DRIVE_FOLDER_ID`.
2. Configure `GOOGLE_APPLICATION_CREDENTIALS` to a read-only service-account
   file outside the repository, or use `GOOGLE_DRIVE_API_KEY` for a public
   folder.
3. Run `npm run sync:drive`.
4. Review the generated manifest and skipped/OCR-required files.
5. Run `npm run ingest:preview -- work/foia-drive-manifest.json`.
6. Run `npm run ingest:foia -- work/foia-drive-manifest.json` only after the
   preview is correct and server-side embedding/Qdrant keys are configured.

The indexer refuses to place `private_case` documents in the public FOIA
collection, creates stable point IDs for safe re-runs, and preserves source
hashes, file IDs, county, document type, and chunk position.

## Verify

```sh
npm run lint
npm test
npm run ingest:preview -- examples/foia-manifest.example.json
```

## Important data boundaries

- Qdrant contains public FOIA research and de-identified prior outcomes.
- Supabase contains private current-case data and analyst work product.
- The model receives only the minimum case context needed for the question.
- Generated answers are research aids, not legal conclusions, and must retain
  citations to the underlying record.
- Analyst questions, answers, feedback, evidence status, and private uploads are
  stored separately from the public Qdrant corpus.
