import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface PropertyStats {
  assessedValue: number;
  marketValue: number;
  annualTax: number;
}

interface AppealStats {
  status: string;
  estimatedSavings: number;
  actualSavings: number | null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [properties, appeals] = await Promise.all([
      prisma.property.findMany({
        where: { ownerId: userId },
        select: {
          assessedValue: true,
          marketValue: true,
          annualTax: true,
        },
      }),
      prisma.appeal.findMany({
        where: { userId },
        select: {
          status: true,
          estimatedSavings: true,
          actualSavings: true,
        },
      }),
    ]) as [PropertyStats[], AppealStats[]];

    const totalProperties = properties.length;
    const totalAssessedValue = properties.reduce(
      (sum: number, p: PropertyStats) => sum + p.assessedValue,
      0
    );
    const totalMarketValue = properties.reduce(
      (sum: number, p: PropertyStats) => sum + p.marketValue,
      0
    );
    const totalAnnualTax = properties.reduce(
      (sum: number, p: PropertyStats) => sum + p.annualTax,
      0
    );

    // Potential savings from non-resolved appeals
    const activeStatuses = [
      "draft",
      "evidence-gathering",
      "submitted",
      "under-review",
      "hearing-scheduled",
      "hearing-complete",
    ];
    const appealsInProgress = appeals.filter((a: AppealStats) =>
      activeStatuses.includes(a.status)
    );
    const appealsWon = appeals.filter((a: AppealStats) => a.status === "won");

    const potentialSavings = appealsInProgress.reduce(
      (sum: number, a: AppealStats) => sum + a.estimatedSavings,
      0
    );

    const totalActualSavings = appealsWon.reduce(
      (sum: number, a: AppealStats) => sum + (a.actualSavings ?? 0),
      0
    );

    // ROI: actual savings relative to annual tax
    const roi =
      totalAnnualTax > 0
        ? (totalActualSavings / totalAnnualTax) * 100
        : 0;

    return NextResponse.json({
      totalProperties,
      totalAssessedValue: Math.round(totalAssessedValue * 100) / 100,
      totalMarketValue: Math.round(totalMarketValue * 100) / 100,
      totalAnnualTax: Math.round(totalAnnualTax * 100) / 100,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      appealsInProgress: appealsInProgress.length,
      appealsWon: appealsWon.length,
      roi: Math.round(roi * 100) / 100,
    });
  } catch (error) {
    console.error("Portfolio stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio stats" },
      { status: 500 }
    );
  }
}
