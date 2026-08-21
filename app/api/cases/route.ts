import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import {
  createAppealCase,
  listAppealCases,
  liveCaseDataIsConfigured,
  type NewAppealCase,
} from "@/lib/cases";

export async function GET(request: Request) {
  const analyst = await authorizeRequest(request);
  if (!analyst) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }

  try {
    const cases = await listAppealCases(analyst);
    return NextResponse.json({
      cases,
      mode: liveCaseDataIsConfigured() ? "live" : "demo",
    });
  } catch (error) {
    console.error("Case list failed", error);
    return NextResponse.json(
      { error: "Active cases could not be loaded." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const analyst = await authorizeRequest(request);
  if (!analyst) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  try {
    const input = validateNewCase((await request.json()) as Record<string, unknown>);
    if (!input) {
      return NextResponse.json(
        { error: "Complete all required property and valuation fields." },
        { status: 400 },
      );
    }
    return NextResponse.json({ case: await createAppealCase(input, analyst.email) });
  } catch (error) {
    console.error("Case creation failed", error);
    return NextResponse.json(
      { error: "The appeal case could not be created." },
      { status: 502 },
    );
  }
}

function validateNewCase(body: Record<string, unknown>): NewAppealCase | null {
  const text = (key: string, limit = 500) => {
    const value = body[key];
    return typeof value === "string" && value.trim() && value.length <= limit
      ? value.trim()
      : null;
  };
  const number = (key: string) => {
    const value = body[key];
    return typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : null;
  };
  const address = text("address");
  const city = text("city", 200);
  const county = text("county", 200);
  const parcel = text("parcel", 200);
  const propertyType = text("propertyType", 200);
  const taxYear = number("taxYear");
  const assessedValue = number("assessedValue");
  const requestedValue = number("requestedValue");
  if (
    !address ||
    !city ||
    !county ||
    !parcel ||
    !propertyType ||
    county.toLowerCase().replace(/\s+county$/, "") !== "sacramento" ||
    taxYear === null ||
    assessedValue === null ||
    requestedValue === null ||
    !Number.isInteger(taxYear) ||
    taxYear < 2000 ||
    taxYear > 2100
  ) {
    return null;
  }
  const deadline =
    typeof body.filingDeadline === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.filingDeadline)
      ? body.filingDeadline
      : undefined;
  return {
    address,
    city,
    county,
    parcel,
    propertyType,
    taxYear,
    assessedValue,
    requestedValue,
    filingDeadline: deadline,
  };
}
