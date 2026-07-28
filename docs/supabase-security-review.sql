-- REVIEW REQUIRED — do not apply without confirming which roles and services
-- still require access. These statements address current Supabase advisors.

-- Four exposed public tables currently have RLS disabled.
alter table public.county_profiles enable row level security;
alter table public.apn_qdrant_index enable row level security;
alter table public.shadow_scoring_log enable row level security;
alter table public.apartment_targets enable row level security;

-- Internal appeal and targeting data should not be discoverable anonymously.
revoke all on public.appeal_clients from anon;
revoke all on public.appeal_documents from anon;
revoke all on public.appeals from anon;
revoke all on public.case_events from anon;
revoke all on public.comparables from anon;
revoke all on public.correspondences from anon;
revoke all on public.hearing_notes from anon;
revoke all on public.invoices from anon;
revoke all on public.properties from anon;
revoke all on public.saved_searches from anon;
revoke all on public.apartment_targets from anon;
revoke all on public.apn_qdrant_index from anon;
revoke all on public.shadow_scoring_log from anon;

-- SECURITY DEFINER helpers should not be directly callable through the public API.
revoke execute on function public.can_access_case(uuid) from anon;
revoke execute on function public.is_tenant_member(uuid) from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- Before applying, add explicit SELECT/WRITE policies for the authenticated
-- roles or server-side jobs that legitimately use the four newly protected
-- tables. service_role continues to bypass RLS.
