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

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const client = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        properties: {
          orderBy: { createdAt: "desc" },
          include: {
            appeals: {
              select: {
                id: true,
                status: true,
                serviceType: true,
                estimatedSavings: true,
                actualSavings: true,
              },
            },
          },
        },
        appeals: {
          orderBy: { createdAt: "desc" },
          include: {
            property: {
              select: { id: true, address: true, city: true, state: true },
            },
            agent: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Verify this is not an admin user
    if (client.role === "admin") {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Client get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
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

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (existing.role === "admin") {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Only allow updating specific fields
    const updateData: { name?: string; phone?: string; role?: string } = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone;
    }

    if (body.role !== undefined) {
      // Only allow setting to homeowner or investor, not admin
      if (body.role !== "homeowner" && body.role !== "investor") {
        return NextResponse.json(
          { error: "Invalid role. Must be 'homeowner' or 'investor'" },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }

    const client = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Client update error:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}
