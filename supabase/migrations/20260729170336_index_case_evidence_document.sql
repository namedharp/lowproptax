-- Cover the case evidence document foreign key used by document cleanup and
-- evidence-library joins.
create index if not exists case_evidence_items_document_idx
  on public.case_evidence_items (document_id)
  where document_id is not null;
