import { NextResponse } from "next/server";
import { analystAccessIsConfigured } from "@/lib/auth";
import { liveCaseDataIsConfigured } from "@/lib/cases";
import { getLlmConfiguration, llmIsConfigured } from "@/lib/llm-config";
import {
  embeddingIsConfigured,
  liveResearchIsConfigured,
} from "@/lib/research";

export function GET() {
  const llm = getLlmConfiguration();

  return NextResponse.json({
    status: "ok",
    mode: liveResearchIsConfigured() ? "live" : "demo",
    integrations: {
      qdrant: Boolean(process.env.QDRANT_URL && process.env.QDRANT_API_KEY),
      llm: llmIsConfigured(),
      llmProvider: llm.provider,
      llmModel: llm.model,
      embeddings: embeddingIsConfigured(),
      supabase: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.SUPABASE_SECRET_KEY,
      ),
      caseData: liveCaseDataIsConfigured(),
      analystAccess: analystAccessIsConfigured(),
    },
  });
}
