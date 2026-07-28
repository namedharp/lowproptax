-- Private analyst case data. Public FOIA evidence remains in Qdrant.
create extension if not exists pgcrypto;

create table public.appeal_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  county text not null,
  parcel_number text not null,
  property_name text not null,
  property_address text,
  property_type text,
  tax_year text not null,
  status text not null default 'researching'
    check (status in ('researching', 'evidence_review', 'ready_to_file', 'filed', 'closed')),
  enrolled_value numeric(14, 2),
  requested_value numeric(14, 2),
  filing_deadline date,
  case_theory text,
  assigned_to uuid references auth.users(id),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_research_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.appeal_cases(id) on delete cascade,
  question text not null check (char_length(question) between 5 and 2000),
  answer text,
  confidence smallint check (confidence between 0 and 100),
  citations jsonb not null default '[]'::jsonb,
  similar_appeals jsonb not null default '[]'::jsonb,
  evidence_gaps jsonb not null default '[]'::jsonb,
  model text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.appeal_cases(id) on delete cascade,
  storage_path text not null,
  display_name text not null,
  document_type text,
  visibility text not null default 'private'
    check (visibility in ('private', 'public_foia')),
  uploaded_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create index appeal_cases_county_status_idx
  on public.appeal_cases (county, status);
create index appeal_cases_deadline_idx
  on public.appeal_cases (filing_deadline);
create index case_research_runs_case_created_idx
  on public.case_research_runs (case_id, created_at desc);
create index case_documents_case_idx
  on public.case_documents (case_id);

alter table public.appeal_cases enable row level security;
alter table public.case_research_runs enable row level security;
alter table public.case_documents enable row level security;

revoke all on public.appeal_cases from anon;
revoke all on public.case_research_runs from anon;
revoke all on public.case_documents from anon;

grant select, insert, update on public.appeal_cases to authenticated;
grant select, insert on public.case_research_runs to authenticated;
grant select, insert, update, delete on public.case_documents to authenticated;

-- Roles belong in app_metadata because users cannot edit it themselves.
create policy "analysts can read cases"
  on public.appeal_cases for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('analyst', 'admin'));

create policy "analysts can create cases"
  on public.appeal_cases for insert
  to authenticated
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('analyst', 'admin')
    and created_by = auth.uid()
  );

create policy "assigned analysts and admins can update cases"
  on public.appeal_cases for update
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or assigned_to = auth.uid()
  )
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or assigned_to = auth.uid()
  );

create policy "analysts can read research"
  on public.case_research_runs for select
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('analyst', 'admin')
    and exists (
      select 1 from public.appeal_cases c where c.id = case_id
    )
  );

create policy "analysts can create research"
  on public.case_research_runs for insert
  to authenticated
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('analyst', 'admin')
    and created_by = auth.uid()
    and exists (
      select 1 from public.appeal_cases c where c.id = case_id
    )
  );

create policy "analysts can read case documents"
  on public.case_documents for select
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('analyst', 'admin')
    and exists (
      select 1 from public.appeal_cases c where c.id = case_id
    )
  );

create policy "analysts can manage their uploads"
  on public.case_documents for all
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or uploaded_by = auth.uid()
  )
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('analyst', 'admin')
    and uploaded_by = auth.uid()
  );

create or replace function public.set_updated_at()
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

create trigger appeal_cases_set_updated_at
before update on public.appeal_cases
for each row execute function public.set_updated_at();
