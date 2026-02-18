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
    const status = searchParams.get("status");
    const serviceType = searchParams.get("serviceType");
    const priority = searchParams.get("priority");

    const isAdmin = session.user.role === "admin";

    const where: Record<string, unknown> = {};

    // Non-admin users can only see their own appeals
    if (!isAdmin) {
      where.userId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (priority) {
      where.priority = priority;
    }

    const appeals = await prisma.appeal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            county: true,
            propertyType: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        agent: isAdmin
          ? { select: { id: true, name: true, email: true } }
          : false,
      },
    });

    return NextResponse.json(appeals);
  } catch (error) {
    console.error("Appeals list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appeals" },
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

    const {
      propertyId,
      serviceType,
      originalAssessment,
      targetAssessment,
      estimatedSavings,
      notes,
      assignedAgent,
      priority,
      filedDate,
      hearingDate,
      deadline,
    } = body;

    if (
      !propertyId ||
      !serviceType ||
      originalAssessment == null ||
      targetAssessment == null ||
      estimatedSavings == null
    ) {
      return NextResponse.json(
        { error: "Missing required fields: propertyId, serviceType, originalAssessment, targetAssessment, estimatedSavings" },
        { status: 400 }
      );
    }

    // Verify property exists and user has access
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (!isAdmin && property.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const appeal = await prisma.appeal.create({
      data: {
        serviceType,
        originalAssessment,
        targetAssessment,
        estimatedSavings,
        notes: notes ?? undefined,
        filedDate: filedDate ?? undefined,
        hearingDate: hearingDate ?? undefined,
        deadline: deadline ?? undefined,
        property: { connect: { id: propertyId } },
        user: { connect: { id: session.user.id } },
        ...(isAdmin && assignedAgent
          ? { agent: { connect: { id: assignedAgent } } }
          : {}),
        ...(isAdmin && priority ? { priority } : {}),
      },
      include: {
        property: {
          select: { id: true, address: true, city: true, state: true },
        },
      },
    });

    return NextResponse.json(appeal, { status: 201 });
  } catch (error) {
    console.error("Appeal create error:", error);
    return NextResponse.json(
      { error: "Failed to create appeal" },
      { status: 500 }
    );
  }
}
