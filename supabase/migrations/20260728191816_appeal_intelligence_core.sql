-- Extends the existing FOIA REQUESTS project without duplicating its appeals,
-- properties, documents, tenants, or user tables.

alter table public.appeals
  add column if not exists appeal_number text,
  add column if not exists external_id text,
  add column if not exists source_system text not null default 'supabase',
  add column if not exists assigned_to uuid references auth.users(id),
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

create table if not exists public.case_research_runs (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.appeals(id) on delete cascade,
  question text not null check (char_length(question) between 5 and 2000),
  answer text not null,
  confidence smallint check (confidence between 0 and 100),
  citations jsonb not null default '[]'::jsonb,
  similar_appeals jsonb not null default '[]'::jsonb,
  evidence_gaps jsonb not null default '[]'::jsonb,
  retrieval_metadata jsonb not null default '{}'::jsonb,
  model text,
  analyst_email text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.research_feedback (
  id uuid primary key default gen_random_uuid(),
  research_run_id uuid not null
    references public.case_research_runs(id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),
  note text check (note is null or char_length(note) <= 2000),
  analyst_email text not null,
  created_by uuid references auth.users(id),
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
    check (source_type in ('google_drive', 'local_sync', 'url', 'manual')),
  external_id text not null,
  title text not null,
  county text,
  document_type text,
  source_url text,
  visibility text not null default 'public_foia'
    check (visibility in ('public_foia', 'private_case')),
  content_hash text,
  source_modified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, external_id)
);

create table if not exists public.foia_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null
    references public.foia_ingestion_sources(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'extracting', 'embedding', 'indexed', 'skipped', 'failed')),
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

create index if not exists case_research_runs_appeal_created_idx
  on public.case_research_runs (appeal_id, created_at desc);
create index if not exists case_evidence_items_appeal_sort_idx
  on public.case_evidence_items (appeal_id, sort_order, created_at);
create index if not exists foia_sources_county_type_idx
  on public.foia_ingestion_sources (county, document_type);
create index if not exists foia_jobs_source_created_idx
  on public.foia_ingestion_jobs (source_id, created_at desc);

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

alter table public.case_research_runs enable row level security;
alter table public.research_feedback enable row level security;
alter table public.case_evidence_items enable row level security;
alter table public.foia_ingestion_sources enable row level security;
alter table public.foia_ingestion_jobs enable row level security;

-- The application uses these tables only through authenticated server routes.
-- service_role bypasses RLS; browser roles receive no direct table privileges.
revoke all on public.case_research_runs from anon, authenticated;
revoke all on public.research_feedback from anon, authenticated;
revoke all on public.case_evidence_items from anon, authenticated;
revoke all on public.foia_ingestion_sources from anon, authenticated;
revoke all on public.foia_ingestion_jobs from anon, authenticated;

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
