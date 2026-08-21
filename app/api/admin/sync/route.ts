import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { syncSacramentoAppeals } from "@/lib/sync/sacramento";
import { getSupabaseServerClient, supabaseServerIsConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const analyst = await authorizeRequest(request, "admin");
  if (!analyst) {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }
  const body = (await request.json()) as { source?: unknown; retry?: unknown };
  if (body.source === "sacramento_lambda") {
    try {
      return NextResponse.json(
        await syncSacramentoAppeals({
          requestedBy: analyst.email,
          trigger: body.retry === true ? "retry" : "manual",
        }),
      );
    } catch (error) {
      console.error("Manual Sacramento sync failed", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Synchronization failed." },
        { status: 502 },
      );
    }
  }
  if (body.source === "sacramento_drive") {
    if (!supabaseServerIsConfigured()) {
      return NextResponse.json(
        { error: "Supabase staging is not configured." },
        { status: 409 },
      );
    }
    const { data, error } = await getSupabaseServerClient()
      .from("source_sync_runs")
      .insert({
        source_system: "sacramento_drive",
        trigger_type: body.retry === true ? "retry" : "manual",
        status: "queued",
        requested_by_email: analyst.email,
      })
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({
      runId: data.id,
      status: "queued",
      message: "The OCR/ingestion worker will process this request.",
    });
  }
  return NextResponse.json(
    { error: "Choose the Sacramento appeals feed or Drive source." },
    { status: 400 },
  );
}
