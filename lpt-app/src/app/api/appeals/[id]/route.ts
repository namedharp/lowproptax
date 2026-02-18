import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const isAdmin = session.user.role === "admin";

    const appeal = await prisma.appeal.findUnique({
      where: { id },
      include: {
        property: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        agent: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        documents: true,
      },
    });

    if (!appeal) {
      return NextResponse.json(
        { error: "Appeal not found" },
        { status: 404 }
      );
    }

    if (!isAdmin && appeal.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(appeal);
  } catch (error) {
    console.error("Appeal get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appeal" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const isAdmin = session.user.role === "admin";

    const existing = await prisma.appeal.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Appeal not found" },
        { status: 404 }
      );
    }

    if (!isAdmin && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    let updateData: Record<string, unknown>;

    if (isAdmin) {
      // Admin can update all fields
      const {
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        property: _property,
        user: _user,
        agent: _agent,
        statusHistory: _statusHistory,
        documents: _documents,
        propertyId: _propertyId,
        userId: _userId,
        assignedAgent,
        ...rest
      } = body;

      updateData = { ...rest };

      // Handle agent relation update
      if (assignedAgent !== undefined) {
        if (assignedAgent === null) {
          updateData.agent = { disconnect: true };
        } else {
          updateData.agent = { connect: { id: assignedAgent } };
        }
      }
    } else {
      // Clients can only update notes
      updateData = {};
      if (body.notes !== undefined) {
        updateData.notes = body.notes;
      }
    }

    // When status changes, auto-create an AppealStatusHistory record
    const statusChanged = body.status && body.status !== existing.status;

    const appeal = await prisma.appeal.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, address: true, city: true, state: true },
        },
      },
    });

    if (statusChanged) {
      await prisma.appealStatusHistory.create({
        data: {
          appealId: id,
          fromStatus: existing.status,
          toStatus: body.status,
          notes: body.statusNote ?? `Status changed from ${existing.status} to ${body.status}`,
          changedBy: session.user.id,
        },
      });
    }

    return NextResponse.json(appeal);
  } catch (error) {
    console.error("Appeal update error:", error);
    return NextResponse.json(
      { error: "Failed to update appeal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.appeal.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Appeal not found" },
        { status: 404 }
      );
    }

    await prisma.appeal.delete({ where: { id } });

    return NextResponse.json({ message: "Appeal deleted" });
  } catch (error) {
    console.error("Appeal delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete appeal" },
      { status: 500 }
    );
  }
}
