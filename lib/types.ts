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
  assessedValue: number;
  requestedValue: number;
  deadline: string;
  issue: string;
  confidence: number;
  lastActivity: string;
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
};

export type ResearchResult = {
  mode: "demo" | "live";
  answer: string;
  confidence: number;
  similarCases: SimilarCase[];
  citations: EvidenceCitation[];
  gaps: string[];
  generatedAt: string;
};
