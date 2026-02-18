import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const entityType = searchParams.get("entityType");

    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const where: Record<string, unknown> = {};

    if (entityType) {
      where.entityType = entityType;
    }

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Activity log list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
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

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const { action, entityType, entityId, agentName, details } = body;

    if (!action || !entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing required fields: action, entityType, entityId" },
        { status: 400 }
      );
    }

    const activity = await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        agentName: agentName ?? undefined,
        details: details ?? undefined,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Activity log create error:", error);
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}
