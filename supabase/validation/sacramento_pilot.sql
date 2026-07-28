-- Run in Supabase staging after the migration and two identical sync passes.

-- Must return zero rows: duplicate source-owned appeals.
select source_system, external_id, count(*) as duplicate_count
from public.appeals
where external_id is not null
group by source_system, external_id
having count(*) > 1;

-- Must return zero rows: duplicate source mappings.
select source_system, external_id, entity_type, count(*) as duplicate_count
from public.external_record_mappings
group by source_system, external_id, entity_type
having count(*) > 1;

-- Must return zero: private documents incorrectly mapped to public aliases.
select count(*) as private_documents_in_public_collection
from public.case_document_vectors
where qdrant_collection in ('lpt_research_live', 'appeal_comps_live');

-- Must return zero rows: direct browser privileges on internal tables.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
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
  );

-- Must return one restrictive server-only storage policy.
select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'lpt_case_documents_server_only';

-- Inspect response latency after reviewed live questions exist.
select
  percentile_cont(0.95) within group (order by duration_ms) as response_p95_ms,
  count(*) as reviewed_runs
from public.case_research_runs
where duration_ms is not null;
