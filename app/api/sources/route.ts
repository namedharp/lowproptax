import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { getSourceHealth } from "@/lib/sources";

export async function GET(request: Request) {
  if (!(await authorizeRequest(request))) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  try {
    return NextResponse.json({
      county: "Sacramento",
      sources: await getSourceHealth(),
    });
  } catch (error) {
    console.error("Source health failed", error);
    return NextResponse.json(
      { error: "Source health could not be loaded." },
      { status: 502 },
    );
  }
}
