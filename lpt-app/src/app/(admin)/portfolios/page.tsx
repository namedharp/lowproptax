"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Briefcase,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------------ */
/*  API Response interfaces                                            */
/* ------------------------------------------------------------------ */
interface ApiClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    properties: number;
    appeals: number;
  };
}

interface ApiAgent {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  activeAppeals: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: string;
  assessedValue: number;
  marketValue: number;
  taxRate: number;
  annualTax: number;
  yearBuilt: number;
  sqft: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSize: number | null;
  lastAssessmentDate: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface ApiAppeal {
  id: string;
  propertyId: string;
  userId: string;
  status: string;
  serviceType: string;
  originalAssessment: number;
  targetAssessment: number;
  finalAssessment: number | null;
  estimatedSavings: number;
  actualSavings: number | null;
  notes: string | null;
  filedDate: string | null;
  hearingDate: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    county: string;
    propertyType: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function AdminPortfoliosPage() {
  /* --- Data state --- */
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [appeals, setAppeals] = useState<ApiAppeal[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- Expanded client --- */
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  /* --- Batch Appeal Wizard --- */
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardClientId, setWizardClientId] = useState<string | null>(null);
  const [wizardClientName, setWizardClientName] = useState("");
  const [wizardProperties, setWizardProperties] = useState<ApiProperty[]>([]);
  const [wizardSelected, setWizardSelected] = useState<Set<string>>(new Set());
  const [wizardAgent, setWizardAgent] = useState("");
  const [wizardPriority, setWizardPriority] = useState("medium");
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  /* --- Fetch data --- */
  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
      fetch("/api/properties").then((r) => r.json()),
      fetch("/api/appeals").then((r) => r.json()),
    ])
      .then(([clientsData, agentsData, propertiesData, appealsData]) => {
        if (Array.isArray(clientsData)) setClients(clientsData);
        if (Array.isArray(agentsData)) {
          setAgents(agentsData);
          if (agentsData.length > 0) setWizardAgent(agentsData[0].id);
        }
        if (Array.isArray(propertiesData)) setProperties(propertiesData);
        if (Array.isArray(appealsData)) setAppeals(appealsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* --- Investor clients (role === "investor") --- */
  const investorClients = useMemo(
    () => clients.filter((c) => c.role === "investor"),
    [clients]
  );

  /* --- Portfolio helpers --- */
  function getInvestorProperties(investorId: string): ApiProperty[] {
    return properties.filter((p) => p.ownerId === investorId);
  }

  function getInvestorAppeals(investorId: string): ApiAppeal[] {
    return appeals.filter((a) => a.userId === investorId);
  }

  /* --- Wizard helpers --- */
  function openWizard(
    client: ApiClient,
    clientProperties: ApiProperty[],
    selectAll: boolean
  ) {
    setWizardClientId(client.id);
    setWizardClientName(client.name ?? "");
    setWizardProperties(clientProperties);
    setWizardSelected(
      selectAll ? new Set(clientProperties.map((p) => p.id)) : new Set()
    );
    setWizardStep(1);
    if (agents.length > 0) setWizardAgent(agents[0].id);
    setWizardPriority("medium");
    setWizardOpen(true);
  }

  function toggleWizardProperty(id: string) {
    setWizardSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedWizardProperties = wizardProperties.filter((p) =>
    wizardSelected.has(p.id)
  );

  /* --- Submit batch appeals --- */
  async function handleWizardSubmit() {
    if (selectedWizardProperties.length === 0) return;
    setWizardSubmitting(true);
    try {
      const promises = selectedWizardProperties.map((prop) =>
        fetch("/api/appeals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: prop.id,
            serviceType: "full-service",
            originalAssessment: prop.assessedValue,
            targetAssessment: prop.marketValue,
            estimatedSavings: prop.assessedValue - prop.marketValue,
            assignedAgent: wizardAgent,
            priority: wizardPriority,
          }),
        })
      );
      await Promise.all(promises);
      setWizardOpen(false);
      fetchData();
    } catch {
      // Silently handle error
    } finally {
      setWizardSubmitting(false);
    }
  }

  /* --- Loading state --- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
          <p className="text-sm text-white/50">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Portfolio Operations</h1>
        <p className="mt-1 text-sm text-white/50">
          {investorClients.length} investor portfolios
        </p>
      </div>

      {/* Investor Cards */}
      <div className="space-y-4">
        {investorClients.map((client) => {
          const clientProps = getInvestorProperties(client.id);
          const clientAppeals = getInvestorAppeals(client.id);
          const activeAppeals = clientAppeals.filter(
            (a) => !["won", "lost", "withdrawn"].includes(a.status)
          );
          const totalAssessed = clientProps.reduce(
            (sum, p) => sum + p.assessedValue,
            0
          );
          const totalTax = clientProps.reduce(
            (sum, p) => sum + p.annualTax,
            0
          );
          const potentialSavings = clientAppeals.reduce(
            (sum, a) => sum + a.estimatedSavings,
            0
          );
          const isExpanded = expandedClient === client.id;

          return (
            <div key={client.id}>
              {/* Investor Summary Card */}
              <GlassCard
                padding="md"
                hover
                className="cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-[rgba(255,255,255,0.15)] text-lg font-bold text-white flex-shrink-0">
                      {(client.name ?? "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {client.name}
                      </h3>
                      <p className="text-sm text-white/50">{client.email}</p>
                    </div>
                  </div>

                  {/* Stats inline */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">
                        {clientProps.length}
                      </p>
                      <p className="text-[11px] text-white/40 uppercase">
                        Properties
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(totalAssessed)}
                      </p>
                      <p className="text-[11px] text-white/40 uppercase">
                        Assessed
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(totalTax)}
                      </p>
                      <p className="text-[11px] text-white/40 uppercase">
                        Annual Tax
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-teal-400">
                        {formatCurrency(potentialSavings)}
                      </p>
                      <p className="text-[11px] text-white/40 uppercase">
                        Potential Savings
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">
                        {activeAppeals.length}
                      </p>
                      <p className="text-[11px] text-white/40 uppercase">
                        Active Appeals
                      </p>
                    </div>
                  </div>

                  <GlassButton
                    variant="secondary"
                    size="sm"
                    icon={
                      isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    }
                    onClick={() =>
                      setExpandedClient(isExpanded ? null : client.id)
                    }
                  >
                    {isExpanded ? "Close" : "Manage"}
                  </GlassButton>
                </div>
              </GlassCard>

              {/* Expanded Portfolio Detail */}
              {isExpanded && (
                <div className="mt-2 rounded-[16px] bg-[rgba(255,255,255,0.06)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)] p-6">
                  {/* Portfolio Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    <div className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
                      <p className="text-lg font-bold text-white">
                        {clientProps.length}
                      </p>
                      <p className="text-[11px] text-white/40">
                        Total Properties
                      </p>
                    </div>
                    <div className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(totalAssessed)}
                      </p>
                      <p className="text-[11px] text-white/40">Total Value</p>
                    </div>
                    <div className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(totalTax)}
                      </p>
                      <p className="text-[11px] text-white/40">Total Tax</p>
                    </div>
                    <div className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
                      <p className="text-lg font-bold text-teal-400">
                        {formatCurrency(potentialSavings)}
                      </p>
                      <p className="text-[11px] text-white/40">
                        Potential Savings
                      </p>
                    </div>
                    <div className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
                      <p className="text-lg font-bold text-emerald-400">
                        {totalTax > 0
                          ? `${((potentialSavings / totalTax) * 100).toFixed(1)}%`
                          : "0%"}
                      </p>
                      <p className="text-[11px] text-white/40">ROI</p>
                    </div>
                  </div>

                  {/* Properties Table */}
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Properties
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-[rgba(255,255,255,0.08)]">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[rgba(255,255,255,0.06)]">
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80">
                            Address
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80 hidden sm:table-cell">
                            Type
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80">
                            Assessed
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80 hidden md:table-cell">
                            Market
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80 hidden md:table-cell">
                            Tax
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80">
                            Appeal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientProps.map((prop) => {
                          const propAppeal = appeals.find(
                            (a) => a.propertyId === prop.id
                          );
                          return (
                            <tr
                              key={prop.id}
                              className="border-t border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.03)]"
                            >
                              <td className="px-3 py-2 text-sm text-white/80 max-w-[200px] truncate">
                                {prop.address}
                              </td>
                              <td className="px-3 py-2 text-sm text-white/60 hidden sm:table-cell capitalize">
                                {prop.propertyType.replace("-", " ")}
                              </td>
                              <td className="px-3 py-2 text-sm text-white/80">
                                {formatCurrency(prop.assessedValue)}
                              </td>
                              <td className="px-3 py-2 text-sm text-white/70 hidden md:table-cell">
                                {formatCurrency(prop.marketValue)}
                              </td>
                              <td className="px-3 py-2 text-sm text-white/70 hidden md:table-cell">
                                {formatCurrency(prop.annualTax)}
                              </td>
                              <td className="px-3 py-2">
                                {propAppeal ? (
                                  <GlassBadge
                                    variant={
                                      propAppeal.status === "won"
                                        ? "success"
                                        : propAppeal.status === "lost"
                                          ? "error"
                                          : "info"
                                    }
                                  >
                                    {propAppeal.status}
                                  </GlassBadge>
                                ) : (
                                  <span className="text-xs text-white/30">
                                    None
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {clientProps.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-3 py-8 text-center text-sm text-white/30"
                            >
                              No properties found for this investor.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Batch Actions */}
                  <div className="flex flex-wrap gap-2 mt-5">
                    <GlassButton
                      variant="primary"
                      size="sm"
                      icon={<FileText className="h-3.5 w-3.5" />}
                      onClick={() => openWizard(client, clientProps, true)}
                    >
                      Appeal All
                    </GlassButton>
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      icon={<FileText className="h-3.5 w-3.5" />}
                      onClick={() => openWizard(client, clientProps, false)}
                    >
                      Appeal Selected
                    </GlassButton>
                    <GlassButton variant="ghost" size="sm" icon={<Briefcase className="h-3.5 w-3.5" />}>
                      Generate Report
                    </GlassButton>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {investorClients.length === 0 && (
          <GlassCard padding="md">
            <p className="text-center text-sm text-white/40 py-8">
              No investor portfolios found.
            </p>
          </GlassCard>
        )}
      </div>

      {/* Batch Appeal Wizard Modal */}
      <GlassModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={`Batch Appeal Wizard - ${wizardClientName}`}
        size="xl"
      >
        <div>
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    wizardStep >= step
                      ? "bg-teal-500/30 text-teal-400 border border-teal-400/30"
                      : "bg-[rgba(255,255,255,0.08)] text-white/40 border border-[rgba(255,255,255,0.1)]"
                  )}
                >
                  {wizardStep > step ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "w-12 h-px",
                      wizardStep > step
                        ? "bg-teal-400/40"
                        : "bg-[rgba(255,255,255,0.1)]"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Properties */}
          {wizardStep === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Step 1: Select Properties
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {wizardProperties.map((prop) => (
                  <label
                    key={prop.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      wizardSelected.has(prop.id)
                        ? "bg-teal-500/10 border-teal-400/30"
                        : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)]"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={wizardSelected.has(prop.id)}
                      onChange={() => toggleWizardProperty(prop.id)}
                      className="h-4 w-4 rounded accent-teal-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/90 truncate">
                        {prop.address}
                      </p>
                      <p className="text-xs text-white/50">
                        {prop.city}, {prop.state} &mdash;{" "}
                        {formatCurrency(prop.assessedValue)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-2">
                {wizardSelected.size} of {wizardProperties.length} selected
              </p>
            </div>
          )}

          {/* Step 2: Review Assessments */}
          {wizardStep === 2 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Step 2: Review Assessments
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[rgba(255,255,255,0.08)]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[rgba(255,255,255,0.06)]">
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80">
                        Property
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80">
                        Assessed
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80">
                        Market
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-teal-200/80">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWizardProperties.map((prop) => (
                      <tr
                        key={prop.id}
                        className="border-t border-[rgba(255,255,255,0.06)]"
                      >
                        <td className="px-3 py-2 text-sm text-white/80 max-w-[160px] truncate">
                          {prop.address}
                        </td>
                        <td className="px-3 py-2 text-sm text-white/80">
                          {formatCurrency(prop.assessedValue)}
                        </td>
                        <td className="px-3 py-2 text-sm text-white/70">
                          {formatCurrency(prop.marketValue)}
                        </td>
                        <td className="px-3 py-2 text-sm text-red-400">
                          +{formatCurrency(prop.marketValue - prop.assessedValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)]">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Total Assessed:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(
                      selectedWizardProperties.reduce(
                        (sum, p) => sum + p.assessedValue,
                        0
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-white/60">Total Market:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(
                      selectedWizardProperties.reduce(
                        (sum, p) => sum + p.marketValue,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm & Assign */}
          {wizardStep === 3 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Step 3: Confirm & Assign
              </h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)]">
                  <p className="text-sm text-white/70">
                    Filing appeals for{" "}
                    <span className="text-white font-medium">
                      {selectedWizardProperties.length}
                    </span>{" "}
                    properties belonging to{" "}
                    <span className="text-white font-medium">
                      {wizardClientName}
                    </span>
                  </p>
                </div>
                <GlassSelect
                  label="Assign Agent"
                  value={wizardAgent}
                  onChange={setWizardAgent}
                  options={agents.map((a) => ({
                    value: a.id,
                    label: a.name,
                  }))}
                />
                <GlassSelect
                  label="Priority"
                  value={wizardPriority}
                  onChange={setWizardPriority}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent" },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            <GlassButton
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
              disabled={wizardStep === 1}
              onClick={() => setWizardStep((s) => s - 1)}
            >
              Back
            </GlassButton>

            {wizardStep < 3 ? (
              <GlassButton
                variant="primary"
                size="sm"
                icon={<ArrowRight className="h-4 w-4" />}
                disabled={wizardStep === 1 && wizardSelected.size === 0}
                onClick={() => setWizardStep((s) => s + 1)}
              >
                Next
              </GlassButton>
            ) : (
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Check className="h-4 w-4" />}
                disabled={wizardSubmitting}
                onClick={handleWizardSubmit}
              >
                {wizardSubmitting ? "Filing..." : "Confirm & File Appeals"}
              </GlassButton>
            )}
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
