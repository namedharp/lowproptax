import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { saveResearchFeedback } from "@/lib/cases";

export async function POST(request: Request) {
  const analyst = await authorizeRequest(request);
  if (!analyst) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      runId?: unknown;
      rating?: unknown;
      note?: unknown;
    };
    if (
      typeof body.runId !== "string" ||
      (body.rating !== 1 && body.rating !== -1) ||
      (body.note !== undefined &&
        (typeof body.note !== "string" || body.note.length > 2000))
    ) {
      return NextResponse.json(
        { error: "Valid feedback is required." },
        { status: 400 },
      );
    }
    await saveResearchFeedback(
      body.runId,
      body.rating,
      typeof body.note === "string" ? body.note : undefined,
      analyst.email,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Research feedback failed", error);
    return NextResponse.json(
      { error: "Feedback could not be saved." },
      { status: 502 },
    );
  }
}
