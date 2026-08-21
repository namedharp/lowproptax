import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { getSupabaseServerClient, supabaseServerIsConfigured } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const admin = await authorizeRequest(request, "admin");
  if (!admin) {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }
  if (!supabaseServerIsConfigured()) {
    return NextResponse.json(
      { error: "Supabase staging is not configured." },
      { status: 409 },
    );
  }
  const body = (await request.json()) as Record<string, unknown>;
  const appealId = typeof body.appealId === "string" ? body.appealId : "";
  const analystEmail =
    typeof body.analystEmail === "string"
      ? body.analystEmail.trim().toLowerCase()
      : "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      appealId,
    ) ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(analystEmail)
  ) {
    return NextResponse.json(
      { error: "Choose a valid case and analyst." },
      { status: 400 },
    );
  }
  const supabase = getSupabaseServerClient();
  const { data: analyst, error: analystError } = await supabase
    .from("analyst_accounts")
    .select("email,active")
    .eq("email", analystEmail)
    .maybeSingle();
  if (analystError || !analyst?.active) {
    return NextResponse.json(
      { error: "The selected analyst is not active." },
      { status: 400 },
    );
  }
  const { data: appeal, error: appealError } = await supabase
    .from("appeals")
    .update({ assigned_analyst_email: analystEmail })
    .eq("id", appealId)
    .select("id")
    .maybeSingle();
  if (appealError || !appeal) {
    return NextResponse.json(
      { error: "The case assignment could not be saved." },
      { status: 502 },
    );
  }
  await supabase.from("appeal_audit_events").insert({
    appeal_id: appealId,
    actor_email: admin.email,
    action: "case.assigned",
    entity_type: "appeal",
    entity_id: appealId,
    after_state: { assigned_analyst_email: analystEmail },
  });
  return NextResponse.json({ ok: true });
}
