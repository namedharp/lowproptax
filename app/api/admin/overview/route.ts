import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { getAdminOverview } from "@/lib/sources";

export async function GET(request: Request) {
  if (!(await authorizeRequest(request, "admin"))) {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }
  try {
    return NextResponse.json(await getAdminOverview());
  } catch (error) {
    console.error("Admin overview failed", error);
    return NextResponse.json(
      { error: "The administration overview could not be loaded." },
      { status: 502 },
    );
  }
}
