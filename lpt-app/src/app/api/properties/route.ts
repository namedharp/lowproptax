import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const county = searchParams.get("county");

    const isAdmin = session.user.role === "admin";

    const where: Record<string, unknown> = {};

    // Non-admin users can only see their own properties
    if (!isAdmin) {
      where.ownerId = session.user.id;
    }

    if (type) {
      where.propertyType = type;
    }

    if (county) {
      where.county = county;
    }

    if (search) {
      where.OR = [
        { address: { contains: search } },
        { city: { contains: search } },
        { county: { contains: search } },
        { zip: { contains: search } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(isAdmin && {
        include: {
          owner: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Properties list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const isAdmin = session.user.role === "admin";

    // Admin can specify ownerId; clients always own their own properties
    const ownerId = isAdmin && body.ownerId ? body.ownerId : session.user.id;

    const {
      address,
      city,
      state,
      zip,
      county,
      propertyType,
      assessedValue,
      marketValue,
      taxRate,
      annualTax,
      yearBuilt,
      sqft,
      bedrooms,
      bathrooms,
      lotSize,
      lastAssessmentDate,
    } = body;

    if (
      !address ||
      !city ||
      !state ||
      !zip ||
      !county ||
      !propertyType ||
      assessedValue == null ||
      marketValue == null ||
      taxRate == null ||
      annualTax == null ||
      yearBuilt == null ||
      sqft == null ||
      !lastAssessmentDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        address,
        city,
        state,
        zip,
        county,
        propertyType,
        assessedValue,
        marketValue,
        taxRate,
        annualTax,
        yearBuilt,
        sqft,
        bedrooms: bedrooms ?? undefined,
        bathrooms: bathrooms ?? undefined,
        lotSize: lotSize ?? undefined,
        lastAssessmentDate,
        owner: { connect: { id: ownerId } },
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error("Property create error:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
