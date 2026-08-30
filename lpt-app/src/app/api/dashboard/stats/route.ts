import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";

    if (isAdmin) {
      return getAdminStats();
    }

    return getClientStats(session.user.id);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

async function getClientStats(userId: string) {
  const [
    totalProperties,
    activeAppeals,
    wonAppeals,
    lostAppeals,
    pendingHearings,
  ] = await Promise.all([
    prisma.property.count({
      where: { ownerId: userId },
    }),
    prisma.appeal.count({
      where: {
        userId,
        status: { notIn: ["won", "lost", "withdrawn"] },
      },
    }),
    prisma.appeal.findMany({
      where: { userId, status: "won" },
      select: { actualSavings: true },
    }),
    prisma.appeal.count({
      where: { userId, status: "lost" },
    }),
    prisma.appeal.count({
      where: { userId, status: "hearing-scheduled" },
    }),
  ]);

  const totalSavings = (wonAppeals as { actualSavings: number | null }[]).reduce(
    (sum: number, a: { actualSavings: number | null }) =>
      sum + (a.actualSavings ?? 0),
    0
  );

  const wonCount = wonAppeals.length;
  const decidedCount = wonCount + lostAppeals;
  const successRate = decidedCount > 0 ? (wonCount / decidedCount) * 100 : 0;
  const avgSavingsPerProperty =
    totalProperties > 0 ? totalSavings / totalProperties : 0;

  return NextResponse.json({
    totalProperties,
    activeAppeals,
    totalSavings,
    successRate: Math.round(successRate * 100) / 100,
    pendingHearings,
    avgSavingsPerProperty: Math.round(avgSavingsPerProperty * 100) / 100,
  });
}

async function getAdminStats() {
  const [
    totalClients,
    totalActiveAppeals,
    wonAppeals,
    lostAppeals,
    appealsByStatusRaw,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: { not: "admin" } },
    }),
    prisma.appeal.count({
      where: {
        status: { notIn: ["won", "lost", "withdrawn"] },
      },
    }),
    prisma.appeal.findMany({
      where: { status: "won" },
      select: { actualSavings: true },
    }),
    prisma.appeal.count({
      where: { status: "lost" },
    }),
    prisma.appeal.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const totalActualSavings = (wonAppeals as { actualSavings: number | null }[]).reduce(
    (sum: number, a: { actualSavings: number | null }) =>
      sum + (a.actualSavings ?? 0),
    0
  );

  // Revenue is 25% fee on actual savings
  const totalRevenue = totalActualSavings * 0.25;

  const wonCount = wonAppeals.length;
  const decidedCount = wonCount + lostAppeals;
  const successRate = decidedCount > 0 ? (wonCount / decidedCount) * 100 : 0;
  const avgSavingsPerAppeal =
    wonCount > 0 ? totalActualSavings / wonCount : 0;

  const appealsByStatus: Record<string, number> = {};
  for (const row of appealsByStatusRaw as { status: string; _count: { id: number } }[]) {
    appealsByStatus[row.status] = row._count.id;
  }

  return NextResponse.json({
    totalClients,
    totalActiveAppeals,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    avgSavingsPerAppeal: Math.round(avgSavingsPerAppeal * 100) / 100,
    appealsByStatus,
    successRate: Math.round(successRate * 100) / 100,
  });
}
