import { NextResponse } from "next/server";
import { researchAppeal } from "@/lib/research";
import type { AppealCase } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: unknown;
      appealCase?: unknown;
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

    if (!isAppealCase(body.appealCase)) {
      return NextResponse.json(
        { error: "A valid case context is required." },
        { status: 400 },
      );
    }

    const result = await researchAppeal(
      body.question.trim(),
      body.appealCase,
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

function isAppealCase(value: unknown): value is AppealCase {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AppealCase>;
  return [
    item.id,
    item.caseNumber,
    item.county,
    item.propertyType,
    item.taxYear,
    item.issue,
  ].every((field) => typeof field === "string" && field.length > 0);
}
