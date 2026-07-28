import { NextResponse } from "next/server";
import { getRequestAnalyst } from "@/lib/auth";
import { previewFoiaDocument } from "@/lib/ingestion/normalize";
import type { FoiaSourceDocument } from "@/lib/ingestion/types";

export async function POST(request: Request) {
  if (!getRequestAnalyst(request)) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Partial<FoiaSourceDocument>;
    if (
      typeof body.sourceId !== "string" ||
      typeof body.title !== "string" ||
      typeof body.text !== "string"
    ) {
      return NextResponse.json(
        { error: "Source ID, title, and extracted text are required." },
        { status: 400 },
      );
    }
    const preview = await previewFoiaDocument(body as FoiaSourceDocument);
    return NextResponse.json(preview);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The source could not be normalized.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
