import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, address: true, city: true, state: true } },
        appeal: { select: { id: true, status: true, serviceType: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    if (!isAdmin && document.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Document get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    if (!isAdmin && document.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), "public", document.filePath);
      await unlink(filePath);
    } catch {
      // File may already be deleted, continue with DB cleanup
    }

    // Delete database record
    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
