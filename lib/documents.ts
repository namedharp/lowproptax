import "server-only";

import { getSupabaseServerClient } from "./supabase/server";
import { liveCaseDataIsConfigured } from "./cases";
import type { CaseDocument } from "./types";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/csv",
  "text/plain",
]);

export async function listCaseDocuments(
  appealId: string,
): Promise<CaseDocument[]> {
  if (!liveCaseDataIsConfigured()) return [];
  assertUuid(appealId);
  const { data, error } = await getSupabaseServerClient()
    .from("appeal_documents")
    .select("id,appeal_id,doc_type,title,file_path,created_at")
    .eq("appeal_id", appealId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load documents: ${error.message}`);

  return (data ?? []).map((item) => ({
    id: item.id as string,
    appealId: item.appeal_id as string,
    documentType: item.doc_type as string,
    title: item.title as string,
    fileName:
      typeof item.file_path === "string"
        ? item.file_path.split("/").at(-1) ?? null
        : null,
    createdAt: item.created_at as string,
  }));
}

export async function uploadCaseDocument(
  appealId: string,
  file: File,
  documentType: string,
  title: string,
): Promise<CaseDocument | undefined> {
  if (!liveCaseDataIsConfigured()) return undefined;
  assertUuid(appealId);
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("This file type is not allowed.");
  }
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("Documents must be between 1 byte and 10 MB.");
  }
  const safeName = file.name
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(-150);
  const storagePath = `${appealId}/${crypto.randomUUID()}-${safeName}`;
  const supabase = getSupabaseServerClient();
  const { error: uploadError } = await supabase.storage
    .from("case-documents")
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    throw new Error(`Document upload failed: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from("appeal_documents")
    .insert({
      appeal_id: appealId,
      doc_type: documentType,
      title,
      direction: "internal",
      source: "analyst_upload",
      file_path: storagePath,
      storage_url: storagePath,
      notes: `Uploaded as ${file.name}`,
    })
    .select("id,appeal_id,doc_type,title,file_path,created_at")
    .single();
  if (error) {
    await supabase.storage.from("case-documents").remove([storagePath]);
    throw new Error(`Document metadata failed: ${error.message}`);
  }
  return {
    id: data.id as string,
    appealId: data.appeal_id as string,
    documentType: data.doc_type as string,
    title: data.title as string,
    fileName: file.name,
    createdAt: data.created_at as string,
  };
}

function assertUuid(value: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new Error("A valid appeal ID is required.");
  }
}
