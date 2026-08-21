import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { canEditAppeal, updateAppealCase } from "@/lib/cases";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const analyst = await authorizeRequest(request);
  if (!analyst) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!(await canEditAppeal(id, analyst))) {
      return NextResponse.json(
        { error: "This case is assigned to another analyst." },
        { status: 403 },
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    const update = validateUpdate(body);
    if (!update) {
      return NextResponse.json(
        { error: "No valid case changes were provided." },
        { status: 400 },
      );
    }
    await updateAppealCase(id, update, analyst.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Case update failed", error);
    return NextResponse.json(
      { error: "The case could not be updated." },
      { status: 502 },
    );
  }
}

function validateUpdate(body: Record<string, unknown>) {
  const update: {
    status?: string;
    requestedValue?: number;
    filingDeadline?: string;
    caseTheory?: string;
    confidence?: number;
  } = {};

  if (typeof body.status === "string" && body.status.length <= 50) {
    update.status = body.status;
  }
  if (
    typeof body.requestedValue === "number" &&
    Number.isFinite(body.requestedValue) &&
    body.requestedValue >= 0
  ) {
    update.requestedValue = body.requestedValue;
  }
  if (
    typeof body.filingDeadline === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.filingDeadline)
  ) {
    update.filingDeadline = body.filingDeadline;
  }
  if (
    typeof body.caseTheory === "string" &&
    body.caseTheory.trim().length <= 5000
  ) {
    update.caseTheory = body.caseTheory.trim();
  }
  if (
    typeof body.confidence === "number" &&
    Number.isInteger(body.confidence) &&
    body.confidence >= 0 &&
    body.confidence <= 100
  ) {
    update.confidence = body.confidence;
  }
  return Object.keys(update).length ? update : null;
}
