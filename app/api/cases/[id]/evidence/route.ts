import { NextResponse } from "next/server";
import { getRequestAnalyst } from "@/lib/auth";
import { listEvidenceItems, upsertEvidenceItem } from "@/lib/cases";
import type { EvidenceItem } from "@/lib/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!getRequestAnalyst(request)) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    return NextResponse.json({ items: await listEvidenceItems(id) });
  } catch (error) {
    console.error("Evidence list failed", error);
    return NextResponse.json(
      { error: "Evidence items could not be loaded." },
      { status: 502 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const analyst = getRequestAnalyst(request);
  if (!analyst) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Partial<EvidenceItem>;
    if (
      typeof body.id !== "string" ||
      typeof body.label !== "string" ||
      !isEvidenceStatus(body.status) ||
      body.label.trim().length < 2 ||
      body.label.length > 500
    ) {
      return NextResponse.json(
        { error: "A valid evidence item is required." },
        { status: 400 },
      );
    }

    await upsertEvidenceItem(
      id,
      {
        id: body.id,
        label: body.label.trim(),
        status: body.status,
        notes: typeof body.notes === "string" ? body.notes.slice(0, 3000) : null,
        dueDate:
          typeof body.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)
            ? body.dueDate
            : null,
        sortOrder:
          typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder)
            ? body.sortOrder
            : 0,
      },
      analyst.email,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Evidence save failed", error);
    return NextResponse.json(
      { error: "The evidence item could not be saved." },
      { status: 502 },
    );
  }
}

function isEvidenceStatus(value: unknown): value is EvidenceItem["status"] {
  return (
    typeof value === "string" &&
    ["missing", "requested", "received", "reviewed", "not_applicable"].includes(
      value,
    )
  );
}
