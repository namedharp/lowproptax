import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { getAppealCase, saveResearchRun } from "@/lib/cases";
import { researchAppeal } from "@/lib/research";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const analyst = await authorizeRequest(request);
  if (!analyst) {
    return NextResponse.json(
      { error: "Analyst access is required." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      appealId?: unknown;
      question?: unknown;
      threadId?: unknown;
    };
    if (
      typeof body.question !== "string" ||
      body.question.trim().length < 5 ||
      body.question.length > 2000
    ) {
      return NextResponse.json(
        { error: "Enter a question between 5 and 2,000 characters." },
        { status: 400 },
      );
    }
    if (typeof body.appealId !== "string" || body.appealId.length > 100) {
      return NextResponse.json(
        { error: "A valid appeal ID is required." },
        { status: 400 },
      );
    }
    const threadId =
      typeof body.threadId === "string" && body.threadId.length <= 200
        ? body.threadId.trim() || undefined
        : undefined;
    const appealCase = await getAppealCase(body.appealId, analyst);
    if (!appealCase) {
      return NextResponse.json({ error: "Appeal not found." }, { status: 404 });
    }

    const result = await researchAppeal(body.question.trim(), appealCase);
    result.runId = await saveResearchRun(
      appealCase.id,
      body.question.trim(),
      result,
      analyst.email,
      threadId,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Research request failed", error);
    return NextResponse.json(
      {
        error:
          "The evidence service could not complete this request. No answer was generated.",
      },
      { status: 502 },
    );
  }
}
