export type AppealCase = {
  id: string;
  caseNumber: string;
  county: string;
  propertyName: string;
  address: string;
  parcel: string;
  propertyType: string;
  taxYear: string;
  status: "Researching" | "Evidence review" | "Ready to file";
  analyst: string;
  assignedAnalystEmail?: string | null;
  canEdit?: boolean;
  assessedValue: number;
  requestedValue: number;
  deadline: string;
  issue: string;
  confidence: number;
  lastActivity: string;
  source?: "demo" | "supabase";
};

export type SimilarCase = {
  id: string;
  county: string;
  year: string;
  propertyType: string;
  match: number;
  outcome: "Win" | "Loss" | "Withdrawn" | "Pending";
  reduction: number | null;
  reason: string;
};

export type EvidenceCitation = {
  id: string;
  title: string;
  county: string;
  documentType: string;
  excerpt: string;
  sourceUrl?: string;
  sourceType: "public" | "prior_appeal" | "private_case";
  documentId?: string;
  pageStart?: number;
  pageEnd?: number;
  sourceNumber?: number;
};

export type ResearchResult = {
  mode: "demo" | "live";
  answer: string;
  confidence: number;
  similarCases: SimilarCase[];
  citations: EvidenceCitation[];
  gaps: string[];
  limitations: string[];
  inferences: string[];
  generatedAt: string;
  runId?: string;
  telemetry?: {
    durationMs: number;
    provider: string;
    model: string;
    retrievedPointIds: string[];
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export type ResearchLibraryFilters = {
  query: string;
  taxYear?: string;
  propertyType?: string;
  documentType?: string;
  outcome?: string;
};

export type ResearchLibraryItem = EvidenceCitation & {
  score: number;
  taxYear?: string;
  propertyType?: string;
  outcome?: string;
};

export type SourceHealth = {
  id: "sacramento_lambda" | "sacramento_drive" | "millage" | "qdrant";
  label: string;
  status: "healthy" | "degraded" | "waiting" | "unconfigured";
  detail: string;
  recordCount?: number;
  lastSyncedAt?: string;
};

export type AdminOverview = {
  analysts: Array<{
    email: string;
    displayName: string;
    role: "admin" | "analyst";
    active: boolean;
  }>;
  sources: SourceHealth[];
  failedOcrJobs: number;
  collections: Array<{
    alias: string;
    target?: string;
    status: "ready" | "missing" | "unconfigured";
    pointCount?: number;
  }>;
};

export type ResearchHistoryItem = {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  model: string | null;
  analystEmail: string;
  createdAt: string;
};

export type EvidenceItem = {
  id: string;
  appealId: string;
  label: string;
  status: "missing" | "requested" | "received" | "reviewed" | "not_applicable";
  notes: string | null;
  dueDate: string | null;
  sortOrder: number;
};

export type CaseDocument = {
  id: string;
  appealId: string;
  documentType: string;
  title: string;
  fileName: string | null;
  createdAt: string;
};
