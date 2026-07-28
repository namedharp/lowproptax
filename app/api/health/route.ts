import { NextResponse } from "next/server";
import { liveResearchIsConfigured } from "@/lib/research";

export function GET() {
  return NextResponse.json({
    status: "ok",
    mode: liveResearchIsConfigured() ? "live" : "demo",
    integrations: {
      qdrant: Boolean(process.env.QDRANT_URL && process.env.QDRANT_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      supabase: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      ),
    },
  });
}
