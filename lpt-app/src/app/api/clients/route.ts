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
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      role: { not: "admin" },
    };

    if (type) {
      where.role = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
      // If type filter was also set, combine with AND
      if (type) {
        where.AND = [{ role: type }];
        delete where.role;
      }
    }

    // Filter by appeal status if provided
    if (status) {
      where.appeals = { some: { status } };
    }

    const clients = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            properties: true,
            appeals: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Clients list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
