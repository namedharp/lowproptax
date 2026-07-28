import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { getSupabaseServerClient, supabaseServerIsConfigured } from "@/lib/supabase/server";

export async function PUT(request: Request) {
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
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const role = body.role === "admin" ? "admin" : "analyst";
  const active = body.active !== false;
  if (email === admin.email && !active) {
    return NextResponse.json(
      { error: "Administrators cannot deactivate their own account." },
      { status: 400 },
    );
  }
  if (
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    displayName.length < 2 ||
    displayName.length > 200
  ) {
    return NextResponse.json(
      { error: "A valid analyst email and display name are required." },
      { status: 400 },
    );
  }
  const { error } = await getSupabaseServerClient()
    .from("analyst_accounts")
    .upsert(
      { email, display_name: displayName, role, active },
      { onConflict: "email" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  await getSupabaseServerClient().from("appeal_audit_events").insert({
    actor_email: admin.email,
    action: "analyst.upserted",
    entity_type: "analyst_account",
    entity_id: email,
    after_state: { display_name: displayName, role, active },
  });
  return NextResponse.json({ ok: true });
}
