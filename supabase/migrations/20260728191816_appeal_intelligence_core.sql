-- LowPropTax Sacramento research pilot.
-- This migration extends the existing FOIA REQUESTS project. All analyst
-- operations are performed by trusted server routes using service_role.

create table if not exists public.analyst_accounts (
  email text primary key check (email = lower(email)),
  display_name text not null,
  role text not null default 'analyst'
    check (role in ('admin', 'analyst')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appeals
  add column if not exists appeal_number text,
  add column if not exists external_id text,
  add column if not exists source_system text not null default 'supabase',
  add column if not exists source_status text,
  add column if not exists assigned_analyst_email text
    references public.analyst_accounts(email) on update cascade on delete set null,
  add column if not exists source_updated_at timestamptz,
  add column if not exists source_content_hash text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists case_theory text,
  add column if not exists confidence smallint
    check (confidence between 0 and 100);

create unique index if not exists appeals_appeal_number_unique_idx
  on public.appeals (appeal_number)
  where appeal_number is not null;
create unique index if not exists appeals_source_external_unique_idx
  on public.appeals (source_system, external_id)
  where external_id is not null;
create index if not exists appeals_deadline_status_idx
  on public.appeals (filing_deadline, status);
create index if not exists appeals_assigned_analyst_idx
  on public.appeals (assigned_analyst_email, status);

create table if not exists public.case_research_runs (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.appeals(id) on delete cascade,
  thread_id text,
  question text not null check (char_length(question) between 5 and 2000),
  answer text not null,
  confidence smallint check (confidence between 0 and 100),
  citations jsonb not null default '[]'::jsonb,
  similar_appeals jsonb not null default '[]'::jsonb,
  evidence_gaps jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  retrieval_metadata jsonb not null default '{}'::jsonb,
  retrieved_point_ids text[] not null default '{}',
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  provider text,
  model text,
  analyst_email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.research_feedback (
  id uuid primary key default gen_random_uuid(),
  research_run_id uuid not null
    references public.case_research_runs(id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),
  note text check (note is null or char_length(note) <= 2000),
  analyst_email text not null,
  created_at timestamptz not null default now(),
  unique (research_run_id, analyst_email)
);

create table if not exists public.case_evidence_items (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.appeals(id) on delete cascade,
  label text not null,
  status text not null default 'missing'
    check (status in ('missing', 'requested', 'received', 'reviewed', 'not_applicable')),
  document_id uuid references public.appeal_documents(id) on delete set null,
  notes text,
  due_date date,
  sort_order integer not null default 0,
  updated_by_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.foia_ingestion_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null
    check (source_type in ('google_drive', 'lambda', 'millage', 'local_sync', 'url', 'manual')),
  external_id text not null,
  title text not null,
  county text,
  county_slug text,
  document_type text,
  source_url text,
  visibility text not null default 'public_foia'
    check (visibility in ('public_foia', 'prior_appeal', 'private_case')),
  content_hash text,
  source_modified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, external_id),
  check (county_slug is null or county_slug = 'sacramento')
);

create table if not exists public.foia_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null
    references public.foia_ingestion_sources(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'extracting', 'ocr', 'embedding', 'indexed', 'skipped', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  qdrant_collection text,
  page_count integer,
  chunk_count integer,
  qdrant_point_ids text[] not null default '{}',
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.external_record_mappings (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  external_id text not null,
  entity_type text not null
    check (entity_type in ('appeal', 'property', 'document', 'source')),
  local_id uuid not null,
  source_updated_at timestamptz,
  source_content_hash text,
  last_synced_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (source_system, external_id, entity_type)
);

create table if not exists public.source_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_system text not null
    check (source_system in ('sacramento_lambda', 'sacramento_drive', 'millage')),
  trigger_type text not null
    check (trigger_type in ('scheduled', 'manual', 'retry')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'partial', 'failed')),
  cursor jsonb not null default '{}'::jsonb,
  records_seen integer not null default 0,
  records_upserted integer not null default 0,
  records_skipped integer not null default 0,
  records_failed integer not null default 0,
  error_summary text,
  requested_by_email text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.case_document_vectors (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.appeals(id) on delete cascade,
  document_id uuid not null references public.appeal_documents(id) on delete cascade,
  qdrant_collection text not null default 'case_private_live',
  point_ids text[] not null default '{}',
  content_hash text not null,
  redaction_version text not null default 'pii-v1',
  status text not null default 'queued'
    check (status in ('queued', 'extracting', 'ocr', 'indexed', 'failed')),
  error_message text,
  indexed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, content_hash)
);

create table if not exists public.appeal_audit_events (
  id bigint generated always as identity primary key,
  appeal_id uuid references public.appeals(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists case_research_runs_appeal_created_idx
  on public.case_research_runs (appeal_id, created_at desc);
create index if not exists case_research_runs_thread_idx
  on public.case_research_runs (thread_id, created_at)
  where thread_id is not null;
create index if not exists case_evidence_items_appeal_sort_idx
  on public.case_evidence_items (appeal_id, sort_order, created_at);
create index if not exists foia_sources_county_type_idx
  on public.foia_ingestion_sources (county_slug, document_type);
create index if not exists foia_jobs_source_created_idx
  on public.foia_ingestion_jobs (source_id, created_at desc);
create index if not exists source_sync_runs_source_created_idx
  on public.source_sync_runs (source_system, created_at desc);
create index if not exists case_document_vectors_appeal_idx
  on public.case_document_vectors (appeal_id, status);
create index if not exists appeal_audit_events_appeal_created_idx
  on public.appeal_audit_events (appeal_id, created_at desc);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'case-documents',
  'case-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/csv',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- A restrictive policy prevents browser roles from reading or writing this
-- bucket even if another storage policy is broadly permissive.
drop policy if exists lpt_case_documents_server_only
  on storage.objects;
create policy lpt_case_documents_server_only
on storage.objects
as restrictive
for all
to anon, authenticated
using (bucket_id <> 'case-documents')
with check (bucket_id <> 'case-documents');

-- Browser roles never receive direct access to internal analyst data. Team read,
-- assigned edit, and admin management are enforced by authenticated server routes.
do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'analyst_accounts',
    'case_research_runs',
    'research_feedback',
    'case_evidence_items',
    'foia_ingestion_sources',
    'foia_ingestion_jobs',
    'external_record_mappings',
    'source_sync_runs',
    'case_document_vectors',
    'appeal_audit_events',
    'county_profiles',
    'apn_qdrant_index',
    'shadow_scoring_log',
    'apartment_targets'
  ]
  loop
    if to_regclass('public.' || relation_name) is not null then
      execute format('alter table public.%I enable row level security', relation_name);
      execute format('revoke all on table public.%I from anon, authenticated', relation_name);
      execute format('grant all on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

grant usage, select on sequence public.appeal_audit_events_id_seq to service_role;

create or replace function public.lpt_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists analyst_accounts_set_updated_at
  on public.analyst_accounts;
create trigger analyst_accounts_set_updated_at
before update on public.analyst_accounts
for each row execute function public.lpt_set_updated_at();

drop trigger if exists case_evidence_items_set_updated_at
  on public.case_evidence_items;
create trigger case_evidence_items_set_updated_at
before update on public.case_evidence_items
for each row execute function public.lpt_set_updated_at();

drop trigger if exists foia_ingestion_sources_set_updated_at
  on public.foia_ingestion_sources;
create trigger foia_ingestion_sources_set_updated_at
before update on public.foia_ingestion_sources
for each row execute function public.lpt_set_updated_at();

drop trigger if exists case_document_vectors_set_updated_at
  on public.case_document_vectors;
create trigger case_document_vectors_set_updated_at
before update on public.case_document_vectors
for each row execute function public.lpt_set_updated_at();

revoke all on function public.lpt_set_updated_at() from public, anon, authenticated;
grant execute on function public.lpt_set_updated_at() to service_role;
