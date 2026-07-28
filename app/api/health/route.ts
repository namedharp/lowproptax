import { NextResponse } from "next/server";
import { analystAccessIsConfigured } from "@/lib/auth";
import { liveCaseDataIsConfigured } from "@/lib/cases";
import { getLlmConfiguration, llmIsConfigured } from "@/lib/llm-config";
import {
  liveResearchIsConfigured,
} from "@/lib/research";
import { getQdrantHealth, qdrantIsConfigured } from "@/lib/qdrant";
import { millageIsConfigured } from "@/lib/sync/millage";

export async function GET() {
  const llm = getLlmConfiguration();
  const qdrant = await getQdrantHealth();

  return NextResponse.json({
    status: "ok",
    mode: liveResearchIsConfigured() ? "live" : "demo",
    integrations: {
      qdrant: qdrantIsConfigured(),
      qdrantCollections: qdrant.collections,
      llm: llmIsConfigured(),
      llmProvider: llm.provider,
      llmModel: llm.model,
      qdrantCloudInference: qdrantIsConfigured(),
      supabase: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.SUPABASE_SECRET_KEY,
      ),
      caseData: liveCaseDataIsConfigured(),
      analystAccess: analystAccessIsConfigured(),
      millage: millageIsConfigured(),
    },
  });
}
