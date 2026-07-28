import type {
  AppealCase,
  EvidenceCitation,
  ResearchResult,
  SimilarCase,
} from "./types";

export const demoCases: AppealCase[] = [
  {
    id: "case-1842",
    caseNumber: "CA-24-01842",
    county: "Sacramento",
    propertyName: "Capitol Ridge Office Park",
    address: "2450 Capitol Avenue, Sacramento, CA",
    parcel: "418-220-19",
    propertyType: "Office",
    taxYear: "2024–25",
    status: "Evidence review",
    analyst: "Demo Analyst",
    assessedValue: 8420000,
    requestedValue: 6740000,
    deadline: "Aug 18, 2026",
    issue:
      "The roll value appears to reflect stabilized occupancy despite sustained vacancy and above-market operating costs.",
    confidence: 82,
    lastActivity: "12 minutes ago",
  },
  {
    id: "case-2197",
    caseNumber: "CA-24-02197",
    county: "Sacramento",
    propertyName: "Riverstone Retail Center",
    address: "810 Riverstone Way, Sacramento, CA",
    parcel: "274-0310-044",
    propertyType: "Retail",
    taxYear: "2024–25",
    status: "Researching",
    analyst: "Demo Analyst",
    assessedValue: 11950000,
    requestedValue: 9630000,
    deadline: "Sep 3, 2026",
    issue:
      "Comparable sales include superior tenancy and materially newer improvements.",
    confidence: 67,
    lastActivity: "Yesterday",
  },
  {
    id: "case-2310",
    caseNumber: "CA-24-02310",
    county: "Sacramento",
    propertyName: "River District Logistics Annex",
    address: "3700 Commerce Loop, Sacramento, CA",
    parcel: "017-420-006",
    propertyType: "Industrial",
    taxYear: "2024–25",
    status: "Ready to file",
    analyst: "Demo Analyst",
    assessedValue: 7150000,
    requestedValue: 6220000,
    deadline: "Aug 29, 2026",
    issue:
      "Functional obsolescence and deferred capital work are not reflected in the enrolled value.",
    confidence: 89,
    lastActivity: "Jul 26",
  },
];

export const demoSimilarCases: SimilarCase[] = [
  {
    id: "SAC-2023-441",
    county: "Sacramento",
    year: "2023",
    propertyType: "Office",
    match: 94,
    outcome: "Win",
    reduction: 18.4,
    reason: "Board accepted lease-up risk and stabilized vacancy evidence.",
  },
  {
    id: "SAC-2022-188",
    county: "Sacramento",
    year: "2022",
    propertyType: "Office",
    match: 89,
    outcome: "Win",
    reduction: 13.1,
    reason: "Income approach prevailed after unsupported assessor rent assumptions.",
  },
  {
    id: "SAC-2023-902",
    county: "Sacramento",
    year: "2023",
    propertyType: "Office",
    match: 81,
    outcome: "Loss",
    reduction: 0,
    reason: "Applicant did not document the duration of claimed vacancy.",
  },
  {
    id: "SAC-2022-317",
    county: "Sacramento",
    year: "2022",
    propertyType: "Office",
    match: 76,
    outcome: "Withdrawn",
    reduction: null,
    reason: "Case resolved before a written finding was issued.",
  },
];

export const demoCitations: EvidenceCitation[] = [
  {
    id: "source-1",
    title: "Findings of Fact — Commercial Office Vacancy",
    county: "Sacramento",
    documentType: "Findings",
    excerpt:
      "The board gave greater weight to actual rent rolls and contemporaneous vacancy records than to generalized market assumptions.",
    sourceType: "public",
  },
  {
    id: "source-2",
    title: "2023 Assessment Appeals Board Decision Digest",
    county: "Sacramento",
    documentType: "Decision digest",
    excerpt:
      "Office appeals supported by trailing operating statements and dated leasing evidence received the most consistent adjustments.",
    sourceType: "prior_appeal",
  },
  {
    id: "source-3",
    title: "Commercial Income Evidence Checklist",
    county: "Sacramento",
    documentType: "Guidance",
    excerpt:
      "Applicants should reconcile contract rent, market rent, vacancy, concessions, and non-recoverable expenses for the valuation date.",
    sourceType: "public",
  },
];

export function createDemoResearch(
  question: string,
  appealCase: AppealCase,
): ResearchResult {
  const topic = question.trim() || "this valuation issue";

  return {
    mode: "demo",
    answer: `The strongest pattern for ${appealCase.propertyName} is not vacancy by itself; it is proof that the vacancy existed at the lien date, lasted long enough to affect market value, and was reflected consistently in actual income. In the closest successful Sacramento office appeals, analysts paired dated rent rolls with trailing operating statements and leasing evidence. For “${topic},” lead with an income approach that reconciles actual and market assumptions, then use sales only as a reasonableness check. Avoid relying on a single current occupancy snapshot—the closest unsuccessful case failed because the applicant could not document duration.`,
    confidence: 84,
    similarCases: demoSimilarCases,
    citations: demoCitations,
    gaps: [
      "A dated rent roll covering the lien date and the following six months",
      "Trailing 24-month operating statements with one-time costs separated",
      "Broker or leasing records showing marketing period and concessions",
    ],
    limitations: [
      "Demo mode uses fictional Sacramento examples and is not legal or valuation advice.",
      "Confirm every cited page against the original record before filing.",
    ],
    inferences: [
      "Inference: contemporaneous vacancy duration is likely more persuasive than a single occupancy snapshot.",
    ],
    generatedAt: new Date().toISOString(),
  };
}
