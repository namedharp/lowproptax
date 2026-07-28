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
  existing `lpt_research` and `appeal_comps` Qdrant collections, and asks the
  OpenAI Responses API for a grounded answer.
- A Supabase migration for private cases, research history, and case documents,
  including row-level policies restricted to `analyst` and `admin` roles stored
  in trusted auth metadata.
- Health and research API routes with input validation, timeouts, and no browser
  exposure of private keys.

## Run locally

1. Use Node.js 22.13 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Leave `DEMO_MODE=true` to evaluate the fictional workflow.
5. Run `npm run dev` and open `http://localhost:3000`.

## Enable live evidence research

Set `DEMO_MODE=false` and provide server-side OpenAI and Qdrant credentials.
The existing Qdrant collections use 1,536-dimensional vectors, so the default
query model is `text-embedding-3-small`. Changing to a 384-dimensional model
requires a versioned re-index into new collections.

Never prefix the OpenAI key, Qdrant key, or Supabase secret key with
`NEXT_PUBLIC_`. Those values must remain server-only.

## Supabase

The migration under `supabase/migrations` creates the private case layer. Review
it against a staging project before applying it:

```sh
npx supabase@2.110.0 db push
```

Analyst authorization uses `app_metadata.role`, not editable user metadata.
Assign either `analyst` or `admin` to authorized staff accounts. The anonymous
role has no grants on the new tables.

## Verify

```sh
npm run lint
npm test
```

## Important data boundaries

- Qdrant contains public FOIA research and de-identified prior outcomes.
- Supabase contains private current-case data and analyst work product.
- The model receives only the minimum case context needed for the question.
- Generated answers are research aids, not legal conclusions, and must retain
  citations to the underlying record.
