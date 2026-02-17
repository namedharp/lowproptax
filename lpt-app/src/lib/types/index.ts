export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType:
    | "single-family"
    | "multi-family"
    | "condo"
    | "commercial"
    | "vacant-land";
  assessedValue: number;
  marketValue: number;
  taxRate: number;
  annualTax: number;
  yearBuilt: number;
  sqft: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  lastAssessmentDate: string;
  owner?: string;
}

export interface Appeal {
  id: string;
  propertyId: string;
  status:
    | "draft"
    | "submitted"
    | "under-review"
    | "hearing-scheduled"
    | "won"
    | "lost"
    | "withdrawn";
  serviceType: "full-service" | "diy" | "investor-portfolio";
  filedDate?: string;
  hearingDate?: string;
  originalAssessment: number;
  targetAssessment: number;
  finalAssessment?: number;
  estimatedSavings: number;
  actualSavings?: number;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "homeowner" | "investor";
  avatarUrl?: string;
  propertiesCount: number;
  totalSavings: number;
  memberSince: string;
}

export interface PricingTier {
  id: string;
  name: string;
  slug: "diy" | "full-service" | "investor";
  tagline: string;
  price: string;
  pricePeriod?: string;
  features: string[];
  highlighted: boolean;
  ctaLabel: string;
  ctaHref: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  savings: string;
  avatarUrl?: string;
  rating: number;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  features: string[];
  idealFor: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface DashboardStats {
  totalProperties: number;
  activeAppeals: number;
  totalSavings: number;
  successRate: number;
  pendingHearings: number;
  avgSavingsPerProperty: number;
}

export interface PortfolioSummary {
  totalProperties: number;
  totalAssessedValue: number;
  totalMarketValue: number;
  totalAnnualTax: number;
  potentialSavings: number;
  appealsInProgress: number;
  appealsWon: number;
  roi: number;
}

// Admin types

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "homeowner" | "investor";
  status: "active" | "inactive" | "pending";
  propertiesCount: number;
  activeAppeals: number;
  totalSavings: number;
  notes?: string;
  assignedAgent: string;
  createdAt: string;
}

export interface AdminAppeal {
  id: string;
  propertyId: string;
  propertyAddress: string;
  clientId: string;
  clientName: string;
  status:
    | "draft"
    | "submitted"
    | "under-review"
    | "hearing-scheduled"
    | "won"
    | "lost"
    | "withdrawn";
  serviceType: "full-service" | "diy" | "investor-portfolio";
  priority: "low" | "medium" | "high" | "urgent";
  assignedAgent: string;
  filedDate?: string;
  hearingDate?: string;
  deadline?: string;
  originalAssessment: number;
  targetAssessment: number;
  finalAssessment?: number;
  estimatedSavings: number;
  actualSavings?: number;
  internalNotes?: string;
  documents: string[];
  lastUpdated: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: "agent" | "manager" | "admin";
  activeAppeals: number;
  totalWins: number;
  successRate: number;
  avatarUrl?: string;
}

export interface AdminStats {
  totalClients: number;
  totalActiveAppeals: number;
  totalRevenue: number;
  avgSavingsPerAppeal: number;
  appealsByStatus: Record<string, number>;
  monthlyAppeals: number;
  successRate: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: "appeal" | "client" | "property" | "portfolio";
  entityId: string;
  agentName: string;
  timestamp: string;
  details: string;
}
