-- REVIEW REQUIRED — do not apply without confirming which legacy services
-- still require access. The Sacramento pilot migration already protects
-- county_profiles, apn_qdrant_index, shadow_scoring_log, and apartment_targets.

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

-- SECURITY DEFINER helpers should not be directly callable through the public API.
revoke execute on function public.can_access_case(uuid) from anon;
revoke execute on function public.is_tenant_member(uuid) from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- Before applying, confirm legacy browser and function dependencies.
