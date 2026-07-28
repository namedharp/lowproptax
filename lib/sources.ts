import "server-only";

import { getQdrantHealth } from "./qdrant";
import { millageIsConfigured } from "./sync/millage";
import { getSupabaseServerClient, supabaseServerIsConfigured } from "./supabase/server";
import type { AdminOverview, SourceHealth } from "./types";

export async function getSourceHealth(): Promise<SourceHealth[]> {
  const qdrant = await getQdrantHealth();
  if (!supabaseServerIsConfigured() || process.env.DEMO_MODE !== "false") {
    return [
      {
        id: "sacramento_lambda",
        label: "Sacramento appeals feed",
        status: "waiting",
        detail: "Live synchronization starts after the staging migration is applied.",
      },
      {
        id: "sacramento_drive",
        label: "Sacramento FOIA Drive",
        status: process.env.GOOGLE_DRIVE_FOLDER_ID ? "waiting" : "unconfigured",
        detail: process.env.GOOGLE_DRIVE_FOLDER_ID
          ? "Nightly worker is configured but has not completed a run."
          : "Drive folder and worker credentials are required.",
      },
      {
        id: "millage",
        label: "Millage property data",
        status: millageIsConfigured() ? "waiting" : "unconfigured",
        detail: millageIsConfigured()
          ? "Secure HTTPS adapter is configured and awaiting validation."
          : "A read-only HTTPS API URL and server key are required.",
      },
      qdrant.source,
    ];
  }

  const { data: runs, error } = await getSupabaseServerClient()
    .from("source_sync_runs")
    .select("source_system,status,records_upserted,finished_at,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Unable to load source health: ${error.message}`);
  const latest = new Map<string, (typeof runs)[number]>();
  for (const run of runs ?? []) {
    if (!latest.has(run.source_system as string)) {
      latest.set(run.source_system as string, run);
    }
  }
  return [
    sourceFromRun(
      "sacramento_lambda",
      "Sacramento appeals feed",
      latest.get("sacramento_lambda"),
    ),
    sourceFromRun(
      "sacramento_drive",
      "Sacramento FOIA Drive",
      latest.get("sacramento_drive"),
    ),
    {
      id: "millage",
      label: "Millage property data",
      status: millageIsConfigured()
        ? latest.get("millage")?.status === "succeeded"
          ? "healthy"
          : "waiting"
        : "unconfigured",
      detail: millageIsConfigured()
        ? "Secure read-only HTTPS adapter is available."
        : "A secure read-only HTTPS API is still required.",
      lastSyncedAt: latest.get("millage")?.finished_at as string | undefined,
    },
    qdrant.source,
  ];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const qdrant = await getQdrantHealth();
  const sources = await getSourceHealth();
  if (!supabaseServerIsConfigured() || process.env.DEMO_MODE !== "false") {
    return {
      analysts: [],
      sources,
      failedOcrJobs: 0,
      collections: qdrant.collections,
    };
  }
  const supabase = getSupabaseServerClient();
  const [{ data: analysts, error: analystError }, { count, error: jobError }] =
    await Promise.all([
      supabase
        .from("analyst_accounts")
        .select("email,display_name,role,active")
        .order("display_name"),
      supabase
        .from("foia_ingestion_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .eq("error_code", "ocr_failed"),
    ]);
  if (analystError) throw new Error(`Unable to load analysts: ${analystError.message}`);
  if (jobError) throw new Error(`Unable to load OCR failures: ${jobError.message}`);
  return {
    analysts: (analysts ?? []).map((item) => ({
      email: item.email as string,
      displayName: item.display_name as string,
      role: item.role === "admin" ? "admin" : "analyst",
      active: Boolean(item.active),
    })),
    sources,
    failedOcrJobs: count ?? 0,
    collections: qdrant.collections,
  };
}

function sourceFromRun(
  id: "sacramento_lambda" | "sacramento_drive",
  label: string,
  run?: Record<string, unknown>,
): SourceHealth {
  if (!run) {
    return {
      id,
      label,
      status: "waiting",
      detail: "No completed synchronization run is recorded.",
    };
  }
  const status =
    run.status === "succeeded"
      ? "healthy"
      : run.status === "failed" || run.status === "partial"
        ? "degraded"
        : "waiting";
  return {
    id,
    label,
    status,
    detail: `${Number(run.records_upserted ?? 0).toLocaleString()} records updated in the latest run.`,
    recordCount: Number(run.records_upserted ?? 0),
    lastSyncedAt: (run.finished_at ?? run.created_at) as string | undefined,
  };
}
