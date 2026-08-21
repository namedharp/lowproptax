import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { listResearchHistory } from "@/lib/cases";

export async function GET(request: Request) {
  if (!(await authorizeRequest(request))) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  const appealId = new URL(request.url).searchParams.get("appealId");
  if (!appealId) {
    return NextResponse.json({ error: "An appeal ID is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ history: await listResearchHistory(appealId) });
  } catch (error) {
    console.error("Research history failed", error);
    return NextResponse.json(
      { error: "Research history could not be loaded." },
      { status: 502 },
    );
  }
}
