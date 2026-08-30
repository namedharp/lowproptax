import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            appeals: {
              where: {
                status: {
                  notIn: ["won", "lost", "withdrawn"],
                },
              },
            },
          },
        },
      },
    });

    // Map to include activeAppeals count at the top level
    const result = agents.map(
      (agent: { _count: { appeals: number }; [key: string]: unknown }) => ({
        ...agent,
        activeAppeals: agent._count.appeals,
        _count: undefined,
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Agents list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
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

    const { name, email, role, avatarUrl } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: name, email" },
        { status: 400 }
      );
    }

    // Check if agent email already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { email },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: "An agent with this email already exists" },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        email,
        role: role || "agent",
        avatarUrl: avatarUrl ?? undefined,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("Agent create error:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
