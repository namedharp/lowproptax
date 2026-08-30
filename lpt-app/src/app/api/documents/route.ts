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
    const propertyId = searchParams.get("propertyId");
    const appealId = searchParams.get("appealId");
    const docType = searchParams.get("docType");

    const isAdmin = session.user.role === "admin";

    const where: Record<string, unknown> = {};

    // Non-admin users can only see their own documents
    if (!isAdmin) {
      where.userId = session.user.id;
    }

    if (propertyId) where.propertyId = propertyId;
    if (appealId) where.appealId = appealId;
    if (docType) where.docType = docType;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Documents list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
