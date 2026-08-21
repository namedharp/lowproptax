import "server-only";

import { createHash } from "node:crypto";
import { getSupabaseServerClient, supabaseServerIsConfigured } from "../supabase/server";
import {
  getMillageProperty,
  millageIsConfigured,
  type MillageProperty,
} from "./millage";

const DEFAULT_LAMBDA_URL =
  "https://hti7263ie3vj7m2pihbcz5cg5m0limca.lambda-url.us-east-1.on.aws/";

type LambdaAppeal = {
  _id?: unknown;
  propertyId?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  submittedAt?: unknown;
  deletedAt?: unknown;
  statusHistory?: unknown;
};

type LambdaResponse = {
  success?: boolean;
  data?: LambdaAppeal[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
  };
};

export type SyncResult = {
  runId?: string;
  seen: number;
  upserted: number;
  skipped: number;
  failed: number;
  nextPage?: number;
};

export async function syncSacramentoAppeals(input: {
  requestedBy?: string;
  page?: number;
  limit?: number;
  trigger?: "scheduled" | "manual" | "retry";
}): Promise<SyncResult> {
  if (!supabaseServerIsConfigured()) {
    throw new Error("Supabase server credentials are not configured.");
  }
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 100));
  const { data: run, error: runError } = await supabase
    .from("source_sync_runs")
    .insert({
      source_system: "sacramento_lambda",
      trigger_type: input.trigger ?? "manual",
      status: "running",
      requested_by_email: input.requestedBy ?? null,
      started_at: new Date().toISOString(),
      cursor: { page, limit },
    })
    .select("id")
    .single();
  if (runError) throw new Error(`Unable to start synchronization: ${runError.message}`);

  const result: SyncResult = {
    runId: run.id as string,
    seen: 0,
    upserted: 0,
    skipped: 0,
    failed: 0,
  };
  try {
    const endpoint = new URL(
      process.env.SACRAMENTO_LAMBDA_URL ?? DEFAULT_LAMBDA_URL,
    );
    endpoint.searchParams.set("collection", "appeals");
    endpoint.searchParams.set("page", String(page));
    endpoint.searchParams.set("limit", String(limit));
    const response = await fetch(endpoint, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      throw new Error(`Sacramento Lambda returned ${response.status}.`);
    }
    const payload = (await response.json()) as LambdaResponse;
    if (payload.success !== true || !Array.isArray(payload.data)) {
      throw new Error("Sacramento Lambda returned an unexpected response.");
    }
    result.seen = payload.data.length;
    for (const record of payload.data) {
      try {
        const action = await upsertLambdaAppeal(record);
        result[action] += 1;
      } catch (error) {
        result.failed += 1;
        console.error("Sacramento appeal record failed", error);
      }
    }
    const hasNext =
      payload.pagination?.hasNext ??
      (typeof payload.pagination?.total === "number"
        ? page * limit < payload.pagination.total
        : payload.data.length === limit);
    if (hasNext) result.nextPage = page + 1;
    await finishRun(result, result.failed ? "partial" : "succeeded");
    return result;
  } catch (error) {
    await finishRun(
      result,
      "failed",
      error instanceof Error ? error.message : "Unknown synchronization failure.",
    );
    throw error;
  }
}

async function upsertLambdaAppeal(
  record: LambdaAppeal,
): Promise<"upserted" | "skipped"> {
  const externalId = stringValue(record._id);
  const propertyExternalId = stringValue(record.propertyId);
  if (!externalId || !propertyExternalId || record.deletedAt) return "skipped";
  const sourceHash = hashRecord(record);
  const supabase = getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("appeals")
    .select("id,source_content_hash")
    .eq("source_system", "sacramento_lambda")
    .eq("external_id", externalId)
    .maybeSingle();
  if (existingError) {
    throw new Error(`Unable to inspect appeal ${externalId}: ${existingError.message}`);
  }
  if (existing?.source_content_hash === sourceHash) return "skipped";

  const property = await ensureLambdaProperty(propertyExternalId);
  const sourceUpdatedAt =
    isoValue(record.updatedAt) ??
    isoValue(record.createdAt) ??
    new Date().toISOString();
  const sourceFields = {
    property_id: property.id,
    source_status: stringValue(record.status) ?? "unknown",
    source_updated_at: sourceUpdatedAt,
    source_content_hash: sourceHash,
    last_synced_at: new Date().toISOString(),
    ...(property.millage?.assessedValue !== undefined
      ? { enrolled_value: property.millage.assessedValue }
      : {}),
  };
  let appealId = existing?.id as string | undefined;
  if (appealId) {
    const { error } = await supabase
      .from("appeals")
      .update(sourceFields)
      .eq("id", appealId);
    if (error) throw new Error(`Unable to update appeal ${externalId}: ${error.message}`);
  } else {
    const taxYear =
      property.millage?.taxYear ?? new Date(sourceUpdatedAt).getUTCFullYear();
    const { data, error } = await supabase
      .from("appeals")
      .insert({
        ...sourceFields,
        status: "researching",
        appeal_number: `SAC-${externalId}`,
        source_system: "sacramento_lambda",
        external_id: externalId,
        tax_year: taxYear,
        filed_at: isoValue(record.submittedAt),
      })
      .select("id")
      .single();
    if (error) throw new Error(`Unable to create appeal ${externalId}: ${error.message}`);
    appealId = data.id as string;
  }
  await supabase.from("external_record_mappings").upsert(
    {
      source_system: "sacramento_lambda",
      external_id: externalId,
      entity_type: "appeal",
      local_id: appealId,
      source_updated_at: sourceUpdatedAt,
      source_content_hash: sourceHash,
      last_synced_at: new Date().toISOString(),
      metadata: { collection: "appeals" },
    },
    { onConflict: "source_system,external_id,entity_type" },
  );
  return "upserted";
}

async function ensureLambdaProperty(
  externalId: string,
): Promise<{ id: string; millage?: MillageProperty }> {
  const supabase = getSupabaseServerClient();
  let millage: MillageProperty | null = null;
  if (millageIsConfigured()) {
    try {
      millage = await getMillageProperty(externalId);
    } catch (error) {
      console.error(`Millage enrichment failed for ${externalId}`, error);
    }
  }
  const { data: mapping, error: mappingError } = await supabase
    .from("external_record_mappings")
    .select("local_id")
    .eq("source_system", "sacramento_lambda")
    .eq("external_id", externalId)
    .eq("entity_type", "property")
    .maybeSingle();
  if (mappingError) {
    throw new Error(`Unable to inspect property ${externalId}: ${mappingError.message}`);
  }
  if (mapping?.local_id) {
    if (millage) {
      const { error } = await supabase
        .from("properties")
        .update(propertyFields(millage))
        .eq("id", mapping.local_id);
      if (error) {
        throw new Error(`Unable to enrich property ${externalId}: ${error.message}`);
      }
    }
    return { id: mapping.local_id as string, millage: millage ?? undefined };
  }

  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      ...(millage
        ? propertyFields(millage)
        : {
            apn: `pending-${externalId}`,
            address: "Address pending secure Millage enrichment",
            city: "Sacramento",
            property_type: "Pending enrichment",
          }),
      county: "Sacramento",
      state: "CA",
      notes: `Imported from Sacramento Lambda property ${externalId}.`,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Unable to create property ${externalId}: ${error.message}`);
  await supabase.from("external_record_mappings").upsert(
    {
      source_system: "sacramento_lambda",
      external_id: externalId,
      entity_type: "property",
      local_id: property.id,
      last_synced_at: new Date().toISOString(),
      metadata: { county_slug: "sacramento" },
    },
    { onConflict: "source_system,external_id,entity_type" },
  );
  return { id: property.id as string, millage: millage ?? undefined };
}

function propertyFields(property: MillageProperty): Record<string, unknown> {
  return {
    apn: property.apn,
    address: property.address,
    city: property.city,
    property_type: property.propertyType,
    land_use: property.landUse ?? null,
    year_built: property.yearBuilt ?? null,
    sqft_building: property.buildingSqft ?? null,
    sqft_lot: property.lotSqft ?? null,
  };
}

async function finishRun(
  result: SyncResult,
  status: "succeeded" | "partial" | "failed",
  errorSummary?: string,
): Promise<void> {
  if (!result.runId) return;
  const { error } = await getSupabaseServerClient()
    .from("source_sync_runs")
    .update({
      status,
      records_seen: result.seen,
      records_upserted: result.upserted,
      records_skipped: result.skipped,
      records_failed: result.failed,
      cursor: result.nextPage ? { next_page: result.nextPage } : {},
      error_summary: errorSummary ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", result.runId);
  if (error) console.error("Unable to finish synchronization run", error.message);
}

function hashRecord(record: LambdaAppeal): string {
  return createHash("sha256")
    .update(JSON.stringify(sortObject(record)))
    .digest("hex");
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortObject(item)]),
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isoValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
