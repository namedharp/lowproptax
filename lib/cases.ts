import "server-only";

import { demoCases } from "./demo-data";
import { getSupabaseServerClient, supabaseServerIsConfigured } from "./supabase/server";
import type {
  AppealCase,
  EvidenceItem,
  ResearchHistoryItem,
  ResearchResult,
} from "./types";

type AppealRow = {
  id: string;
  property_id: string;
  appeal_number?: string | null;
  tax_year: number;
  status: string;
  enrolled_value?: number | string | null;
  claimed_value?: number | string | null;
  filing_deadline?: string | null;
  updated_at?: string | null;
  case_theory?: string | null;
  confidence?: number | null;
};

type PropertyRow = {
  id: string;
  apn?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  property_type?: string | null;
};

export function liveCaseDataIsConfigured(): boolean {
  return supabaseServerIsConfigured() && process.env.DEMO_MODE === "false";
}

export type NewAppealCase = {
  address: string;
  city: string;
  county: string;
  parcel: string;
  propertyType: string;
  taxYear: number;
  assessedValue: number;
  requestedValue: number;
  filingDeadline?: string;
};

export async function listAppealCases(): Promise<AppealCase[]> {
  if (!liveCaseDataIsConfigured()) return demoCases;

  const supabase = getSupabaseServerClient();
  const { data: appeals, error } = await supabase
    .from("appeals")
    .select(
      "id,property_id,appeal_number,tax_year,status,enrolled_value,claimed_value,filing_deadline,updated_at,case_theory,confidence",
    )
    .order("filing_deadline", { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) throw new Error(`Unable to load appeals: ${error.message}`);
  if (!appeals?.length) return [];

  const propertyIds = [
    ...new Set((appeals as AppealRow[]).map((item) => item.property_id)),
  ];
  const { data: properties, error: propertyError } = await supabase
    .from("properties")
    .select("id,apn,address,city,county,property_type")
    .in("id", propertyIds);
  if (propertyError) {
    throw new Error(`Unable to load appeal properties: ${propertyError.message}`);
  }

  const propertyById = new Map(
    ((properties ?? []) as PropertyRow[]).map((property) => [
      property.id,
      property,
    ]),
  );
  return (appeals as AppealRow[]).map((appeal) =>
    mapAppeal(appeal, propertyById.get(appeal.property_id)),
  );
}

export async function createAppealCase(
  input: NewAppealCase,
): Promise<AppealCase> {
  const id = crypto.randomUUID();
  const appealNumber = `CA-${input.taxYear}-${id.slice(0, 6).toUpperCase()}`;
  const property: PropertyRow = {
    id: crypto.randomUUID(),
    apn: input.parcel,
    address: input.address,
    city: input.city,
    county: input.county,
    property_type: input.propertyType,
  };
  const appeal: AppealRow = {
    id,
    property_id: property.id,
    appeal_number: appealNumber,
    tax_year: input.taxYear,
    status: "researching",
    enrolled_value: input.assessedValue,
    claimed_value: input.requestedValue,
    filing_deadline: input.filingDeadline,
    updated_at: new Date().toISOString(),
    confidence: 35,
  };
  if (!liveCaseDataIsConfigured()) {
    return { ...mapAppeal(appeal, property), source: "demo" };
  }

  const supabase = getSupabaseServerClient();
  const { data: propertyData, error: propertyError } = await supabase
    .from("properties")
    .insert({
      apn: input.parcel,
      address: input.address,
      city: input.city,
      county: input.county,
      state: "CA",
      property_type: input.propertyType,
    })
    .select("id,apn,address,city,county,property_type")
    .single();
  if (propertyError) {
    throw new Error(`Unable to create property: ${propertyError.message}`);
  }

  const { data: appealData, error: appealError } = await supabase
    .from("appeals")
    .insert({
      property_id: propertyData.id,
      appeal_number: appealNumber,
      tax_year: input.taxYear,
      status: "researching",
      enrolled_value: input.assessedValue,
      claimed_value: input.requestedValue,
      filing_deadline: input.filingDeadline ?? null,
      source_system: "appeal_intelligence",
      confidence: 35,
    })
    .select(
      "id,property_id,appeal_number,tax_year,status,enrolled_value,claimed_value,filing_deadline,updated_at,case_theory,confidence",
    )
    .single();
  if (appealError) {
    await supabase.from("properties").delete().eq("id", propertyData.id);
    throw new Error(`Unable to create appeal: ${appealError.message}`);
  }
  return mapAppeal(appealData as AppealRow, propertyData as PropertyRow);
}

export async function updateAppealCase(
  id: string,
  update: {
    status?: string;
    requestedValue?: number;
    filingDeadline?: string;
    caseTheory?: string;
    confidence?: number;
  },
): Promise<void> {
  if (!liveCaseDataIsConfigured()) return;
  if (!isUuid(id)) throw new Error("A valid appeal ID is required.");

  const patch: Record<string, unknown> = {};
  if (update.status) patch.status = update.status;
  if (typeof update.requestedValue === "number") {
    patch.claimed_value = update.requestedValue;
  }
  if (update.filingDeadline) patch.filing_deadline = update.filingDeadline;
  if (update.caseTheory) patch.case_theory = update.caseTheory;
  if (typeof update.confidence === "number") patch.confidence = update.confidence;
  if (!Object.keys(patch).length) return;

  const { error } = await getSupabaseServerClient()
    .from("appeals")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(`Unable to update appeal: ${error.message}`);
}

export async function saveResearchRun(
  appealId: string,
  question: string,
  result: ResearchResult,
  analystEmail: string,
): Promise<string | undefined> {
  if (!liveCaseDataIsConfigured() || !isUuid(appealId)) return undefined;

  const { data, error } = await getSupabaseServerClient()
    .from("case_research_runs")
    .insert({
      appeal_id: appealId,
      question,
      answer: result.answer,
      confidence: result.confidence,
      citations: result.citations,
      similar_appeals: result.similarCases,
      evidence_gaps: result.gaps,
      retrieval_metadata: {
        mode: result.mode,
        generated_at: result.generatedAt,
      },
      model:
        process.env.LLM_MODEL ??
        process.env.OPENAI_MODEL ??
        "gpt-5.6-sol",
      analyst_email: analystEmail,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Unable to save research: ${error.message}`);
  return data.id as string;
}

export async function listResearchHistory(
  appealId: string,
): Promise<ResearchHistoryItem[]> {
  if (!liveCaseDataIsConfigured() || !isUuid(appealId)) return [];

  const { data, error } = await getSupabaseServerClient()
    .from("case_research_runs")
    .select("id,question,answer,confidence,model,analyst_email,created_at")
    .eq("appeal_id", appealId)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw new Error(`Unable to load research history: ${error.message}`);

  return (data ?? []).map((item) => ({
    id: item.id as string,
    question: item.question as string,
    answer: item.answer as string,
    confidence: Number(item.confidence ?? 0),
    model: (item.model as string | null) ?? null,
    analystEmail: item.analyst_email as string,
    createdAt: item.created_at as string,
  }));
}

export async function saveResearchFeedback(
  researchRunId: string,
  rating: -1 | 1,
  note: string | undefined,
  analystEmail: string,
): Promise<void> {
  if (!liveCaseDataIsConfigured()) return;
  if (!isUuid(researchRunId)) throw new Error("A valid research run is required.");

  const { error } = await getSupabaseServerClient()
    .from("research_feedback")
    .upsert(
      {
        research_run_id: researchRunId,
        rating,
        note: note?.trim() || null,
        analyst_email: analystEmail,
      },
      { onConflict: "research_run_id,analyst_email" },
    );
  if (error) throw new Error(`Unable to save feedback: ${error.message}`);
}

export async function listEvidenceItems(
  appealId: string,
): Promise<EvidenceItem[]> {
  if (!liveCaseDataIsConfigured() || !isUuid(appealId)) return [];
  const { data, error } = await getSupabaseServerClient()
    .from("case_evidence_items")
    .select("id,appeal_id,label,status,notes,due_date,sort_order")
    .eq("appeal_id", appealId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Unable to load evidence items: ${error.message}`);

  return (data ?? []).map((item) => ({
    id: item.id as string,
    appealId: item.appeal_id as string,
    label: item.label as string,
    status: item.status as EvidenceItem["status"],
    notes: (item.notes as string | null) ?? null,
    dueDate: (item.due_date as string | null) ?? null,
    sortOrder: Number(item.sort_order ?? 0),
  }));
}

export async function upsertEvidenceItem(
  appealId: string,
  item: Pick<EvidenceItem, "id" | "label" | "status" | "notes" | "dueDate" | "sortOrder">,
  analystEmail: string,
): Promise<void> {
  if (!liveCaseDataIsConfigured()) return;
  if (!isUuid(appealId)) throw new Error("A valid appeal ID is required.");

  const payload = {
    appeal_id: appealId,
    label: item.label,
    status: item.status,
    notes: item.notes,
    due_date: item.dueDate,
    sort_order: item.sortOrder,
    updated_by_email: analystEmail,
  };
  const query = isUuid(item.id)
    ? getSupabaseServerClient().from("case_evidence_items").update(payload).eq("id", item.id)
    : getSupabaseServerClient().from("case_evidence_items").insert(payload);
  const { error } = await query;
  if (error) throw new Error(`Unable to save evidence item: ${error.message}`);
}

function mapAppeal(appeal: AppealRow, property?: PropertyRow): AppealCase {
  const address = [property?.address, property?.city, "CA"].filter(Boolean).join(", ");
  const assessedValue = numberValue(appeal.enrolled_value);
  const requestedValue = numberValue(appeal.claimed_value);
  const propertyType = property?.property_type ?? "Property";
  const county = normalizeCounty(property?.county);

  return {
    id: appeal.id,
    caseNumber:
      appeal.appeal_number ?? `CA-${appeal.tax_year}-${appeal.id.slice(0, 6).toUpperCase()}`,
    county,
    propertyName: property?.address
      ? `${propertyType} · ${property.address}`
      : `${county} ${propertyType} Appeal`,
    address: address || "Address pending",
    parcel: property?.apn ?? "APN pending",
    propertyType,
    taxYear: String(appeal.tax_year),
    status: mapStatus(appeal.status),
    analyst: "Unassigned",
    assessedValue,
    requestedValue,
    deadline: formatDate(appeal.filing_deadline),
    issue:
      appeal.case_theory ??
      "Case theory has not been documented. Review the enrolled value and available valuation evidence.",
    confidence: appeal.confidence ?? 45,
    lastActivity: formatDate(appeal.updated_at),
    source: "supabase",
  };
}

function mapStatus(status: string): AppealCase["status"] {
  const normalized = status.toLowerCase().replaceAll("_", " ");
  if (normalized.includes("ready") || normalized.includes("filed")) {
    return "Ready to file";
  }
  if (normalized.includes("evidence") || normalized.includes("review")) {
    return "Evidence review";
  }
  return "Researching";
}

function normalizeCounty(value?: string | null): string {
  const county = (value ?? "California").trim();
  return county.replace(/\s+county$/i, "");
}

function numberValue(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value?: string | null): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
