import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { demoCitations } from "@/lib/demo-data";
import { liveResearchIsConfigured } from "@/lib/research";
import { searchResearchLibrary } from "@/lib/qdrant";
import type { ResearchLibraryFilters, ResearchLibraryItem } from "@/lib/types";

export async function GET(request: Request) {
  if (!(await authorizeRequest(request))) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  if (query.length < 2 || query.length > 500) {
    return NextResponse.json(
      { error: "Enter a search between 2 and 500 characters." },
      { status: 400 },
    );
  }
  const filters: ResearchLibraryFilters = {
    query,
    taxYear: safeFilter(url.searchParams.get("taxYear")),
    propertyType: safeFilter(url.searchParams.get("propertyType")),
    documentType: safeFilter(url.searchParams.get("documentType")),
    outcome: safeFilter(url.searchParams.get("outcome")),
  };
  try {
    const items = liveResearchIsConfigured()
      ? await searchResearchLibrary(filters)
      : demoLibraryItems();
    return NextResponse.json({
      county: "Sacramento",
      mode: liveResearchIsConfigured() ? "live" : "demo",
      filters,
      items,
    });
  } catch (error) {
    console.error("Research library search failed", error);
    return NextResponse.json(
      { error: "The Sacramento research library could not be searched." },
      { status: 502 },
    );
  }
}

function safeFilter(value: string | null): string | undefined {
  const clean = value?.trim();
  return clean && clean.length <= 100 ? clean : undefined;
}

function demoLibraryItems(): ResearchLibraryItem[] {
  return demoCitations.map((item, index) => ({
    ...item,
    score: 0.92 - index * 0.08,
    taxYear: index === 0 ? "2024" : "2023",
    propertyType: index === 2 ? "All" : "Office",
    outcome: index === 1 ? "Win" : undefined,
  }));
}
