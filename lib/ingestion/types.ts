export type FoiaSourceDocument = {
  sourceId: string;
  title: string;
  text: string;
  county?: string;
  documentType?: string;
  sourceUrl?: string;
  modifiedAt?: string;
  visibility?: "public_foia" | "private_case";
  metadata?: Record<string, unknown>;
};

export type NormalizedFoiaDocument = {
  sourceId: string;
  title: string;
  text: string;
  county: string;
  documentType: string;
  sourceUrl?: string;
  modifiedAt?: string;
  visibility: "public_foia" | "private_case";
  metadata: Record<string, unknown>;
  contentHash: string;
};

export type FoiaChunk = {
  id: string;
  sourceId: string;
  index: number;
  total: number;
  text: string;
  tokenEstimate: number;
};

export type IngestionPreview = {
  source: Omit<NormalizedFoiaDocument, "text"> & {
    characterCount: number;
  };
  chunks: FoiaChunk[];
  warnings: string[];
};
