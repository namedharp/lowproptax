# Production rollout

## 1. Replace exposed credentials

Rotate every credential previously pasted into chat, including the Qdrant key,
LLM key, and private-server password. Store replacements only in the hosting
runtime or the server's secret manager.

The LLM credential cannot be activated until these values are known:

- provider name
- API base URL
- API style: `responses` or `chat-completions`
- model name
- whether the provider also offers 1,536-dimensional embeddings

## 2. Review Supabase security

The connected `FOIA REQUESTS` project currently reports:

- RLS disabled on `county_profiles`, `apn_qdrant_index`,
  `shadow_scoring_log`, and `apartment_targets`
- anonymous GraphQL discovery grants on internal appeal/property tables
- public execution grants on security-definer helper functions
- mutable search paths on several database functions

Review `docs/supabase-security-review.sql` with the owners of existing services.
Do not apply it until the replacement policies and service dependencies are
confirmed.

## 3. Apply the application migration to staging

The migration intentionally reuses existing `appeals`, `properties`,
`appeal_documents`, and tenant/auth structures. It adds:

- appeal workspace metadata
- research history and analyst feedback
- evidence checklists
- FOIA ingestion sources and job history
- a private `case-documents` storage bucket

Run the full analyst workflow against staging before production:

1. Create an appeal.
2. Edit requested value and case theory.
3. Upload a private document.
4. Run a cited research question.
5. Save useful/not-useful feedback.
6. Verify all records are absent from anonymous API responses.

## 4. Configure private runtime values

Required for live mode:

- `DEMO_MODE=false`
- `ANALYST_EMAIL_ALLOWLIST`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `QDRANT_URL`
- `QDRANT_API_KEY`
- `QDRANT_RESEARCH_COLLECTION`
- `QDRANT_APPEAL_COLLECTION`
- `LLM_API_BASE_URL`
- `LLM_API_STYLE`
- `LLM_MODEL`
- `LLM_API_KEY`
- compatible embedding provider settings

## 5. Start incremental FOIA synchronization

Use a read-only Google service account and schedule:

1. `npm run sync:drive`
2. manifest validation
3. `npm run ingest:foia`

Start with one county. Review skipped files, OCR quality, county normalization,
document classification, citations, and Qdrant point counts before expanding.

## 6. Pilot gate

Use 20–30 known appeals and require analyst review of:

- correct county and property-type filtering
- exact source and page traceability
- correct interpretation of wins, losses, withdrawals, and stipulations
- zero unsupported factual claims
- zero leakage of private documents into public search
- useful evidence gaps and defensible case summaries

Do not automate filing or client-facing advice until the pilot passes.
