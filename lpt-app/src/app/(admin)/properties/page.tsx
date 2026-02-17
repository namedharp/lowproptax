"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Building2,
  Home,
  Warehouse,
  LandPlot,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingDown,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { mockProperties, mockAdminAppeals } from "@/lib/data";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Property, AdminAppeal } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Property type label / icon                                         */
/* ------------------------------------------------------------------ */
const propertyTypeLabels: Record<string, string> = {
  "single-family": "Single Family",
  "multi-family": "Multi Family",
  condo: "Condo",
  commercial: "Commercial",
  "vacant-land": "Vacant Land",
};

function PropertyTypeIcon({ type }: { type: Property["propertyType"] }) {
  const cls = "h-4 w-4 flex-shrink-0";
  switch (type) {
    case "single-family":
      return <Home className={cn(cls, "text-teal-400")} />;
    case "multi-family":
      return <Building2 className={cn(cls, "text-emerald-400")} />;
    case "condo":
      return <Building2 className={cn(cls, "text-blue-400")} />;
    case "commercial":
      return <Warehouse className={cn(cls, "text-purple-400")} />;
    case "vacant-land":
      return <LandPlot className={cn(cls, "text-yellow-400")} />;
    default:
      return <Home className={cn(cls, "text-white/50")} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Appeal status for a property                                       */
/* ------------------------------------------------------------------ */
function getPropertyAppeal(propertyId: string): AdminAppeal | undefined {
  return mockAdminAppeals.find((a) => a.propertyId === propertyId);
}

type AppealStatusLabel = "No Appeal" | "Active Appeal" | "Appeal Won" | "Appeal Lost";

function getAppealStatusLabel(propertyId: string): AppealStatusLabel {
  const appeal = getPropertyAppeal(propertyId);
  if (!appeal) return "No Appeal";
  if (appeal.status === "won") return "Appeal Won";
  if (appeal.status === "lost") return "Appeal Lost";
  return "Active Appeal";
}

function appealStatusVariant(label: AppealStatusLabel) {
  switch (label) {
    case "Appeal Won":
      return "success";
    case "Appeal Lost":
      return "error";
    case "Active Appeal":
      return "info";
    default:
      return "default";
  }
}

/* ------------------------------------------------------------------ */
/*  Mock assessment history (3 years)                                  */
/* ------------------------------------------------------------------ */
function mockAssessmentHistory(prop: Property) {
  const current = prop.assessedValue;
  const prev1 = Math.round(current * 0.93);
  const prev2 = Math.round(current * 0.87);
  return [
    { year: 2025, assessed: current, market: prop.marketValue },
    {
      year: 2024,
      assessed: prev1,
      market: Math.round(prop.marketValue * 0.94),
    },
    {
      year: 2023,
      assessed: prev2,
      market: Math.round(prop.marketValue * 0.88),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Mock comparable properties                                         */
/* ------------------------------------------------------------------ */
function mockComparables(prop: Property) {
  return [
    {
      address: `${parseInt(prop.address) + 100} ${prop.address.split(" ").slice(1).join(" ")}`,
      assessed: Math.round(prop.assessedValue * 0.95),
      market: Math.round(prop.marketValue * 0.96),
      sqft: prop.sqft ? prop.sqft - 150 : 0,
    },
    {
      address: `${parseInt(prop.address) - 200} ${prop.address.split(" ").slice(1).join(" ")}`,
      assessed: Math.round(prop.assessedValue * 1.03),
      market: Math.round(prop.marketValue * 1.01),
      sqft: prop.sqft ? prop.sqft + 200 : 0,
    },
    {
      address: `${parseInt(prop.address) + 500} ${prop.address.split(" ").slice(1).join(" ")}`,
      assessed: Math.round(prop.assessedValue * 0.98),
      market: Math.round(prop.marketValue * 0.99),
      sqft: prop.sqft ? prop.sqft + 50 : 0,
    },
  ];
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function AdminPropertiesPage() {
  /* --- Filters --- */
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [appealStatusFilter, setAppealStatusFilter] = useState("all");

  /* --- Expanded row --- */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* --- Filtered data --- */
  const filtered = useMemo(() => {
    return mockProperties.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q);
      const matchType =
        typeFilter === "all" || p.propertyType === typeFilter;
      const matchAppeal =
        appealStatusFilter === "all" ||
        getAppealStatusLabel(p.id) === appealStatusFilter;
      return matchSearch && matchType && matchAppeal;
    });
  }, [search, typeFilter, appealStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Property Management</h1>
        <p className="mt-1 text-sm text-white/50">
          {mockProperties.length} total properties
        </p>
      </div>

      {/* Filters */}
      <GlassCard variant="light" padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <GlassInput
            placeholder="Search by address..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <GlassSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All Types" },
              { value: "single-family", label: "Single Family" },
              { value: "multi-family", label: "Multi Family" },
              { value: "condo", label: "Condo" },
              { value: "commercial", label: "Commercial" },
              { value: "vacant-land", label: "Vacant Land" },
            ]}
          />
          <GlassSelect
            value={appealStatusFilter}
            onChange={setAppealStatusFilter}
            options={[
              { value: "all", label: "All Appeal Status" },
              { value: "No Appeal", label: "No Appeal" },
              { value: "Active Appeal", label: "Active Appeal" },
              { value: "Appeal Won", label: "Appeal Won" },
              { value: "Appeal Lost", label: "Appeal Lost" },
            ]}
          />
        </div>
      </GlassCard>

      {/* Properties Table */}
      <div className="overflow-hidden rounded-[16px] bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.1)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden md:table-cell">
                  City / State
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden lg:table-cell">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden lg:table-cell">
                  Assessed
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden xl:table-cell">
                  Market
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden xl:table-cell">
                  Annual Tax
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden xl:table-cell">
                  Tax Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Appeal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prop) => {
                const isExpanded = expandedId === prop.id;
                const appealLabel = getAppealStatusLabel(prop.id);
                const appeal = getPropertyAppeal(prop.id);

                return (
                  <PropertyRow
                    key={prop.id}
                    property={prop}
                    appealLabel={appealLabel}
                    appeal={appeal}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedId(isExpanded ? null : prop.id)
                    }
                  />
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-sm text-white/40"
                  >
                    No properties match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Property Row Component                                             */
/* ================================================================== */
function PropertyRow({
  property,
  appealLabel,
  appeal,
  isExpanded,
  onToggle,
}: {
  property: Property;
  appealLabel: AppealStatusLabel;
  appeal: AdminAppeal | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const history = mockAssessmentHistory(property);
  const comparables = mockComparables(property);

  return (
    <>
      <tr className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <PropertyTypeIcon type={property.propertyType} />
            <span className="text-sm font-medium text-white truncate max-w-[200px]">
              {property.address}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-white/70 hidden md:table-cell">
          {property.city}, {property.state}
        </td>
        <td className="px-4 py-3 text-sm text-white/70 hidden lg:table-cell">
          {property.owner || "\u2014"}
        </td>
        <td className="px-4 py-3">
          <GlassBadge variant="default">
            {propertyTypeLabels[property.propertyType] || property.propertyType}
          </GlassBadge>
        </td>
        <td className="px-4 py-3 text-sm text-white/80 hidden lg:table-cell">
          {formatCurrency(property.assessedValue)}
        </td>
        <td className="px-4 py-3 text-sm text-white/80 hidden xl:table-cell">
          {formatCurrency(property.marketValue)}
        </td>
        <td className="px-4 py-3 text-sm text-white/80 hidden xl:table-cell">
          {formatCurrency(property.annualTax)}
        </td>
        <td className="px-4 py-3 text-sm text-white/60 hidden xl:table-cell">
          {property.taxRate}%
        </td>
        <td className="px-4 py-3">
          <GlassBadge variant={appealStatusVariant(appealLabel)}>
            {appealLabel}
          </GlassBadge>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-teal-400 hover:bg-teal-500/10 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {appealLabel === "No Appeal" && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Appeal</span>
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr>
          <td colSpan={10} className="p-0">
            <div className="bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.1)] px-6 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Full property details */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Property Details
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-white/80">{property.address}</p>
                    <p className="text-white/60">
                      {property.city}, {property.state} {property.zip}
                    </p>
                    <p className="text-white/60">{property.county} County</p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <span className="text-[11px] text-white/40 uppercase">
                          Year Built
                        </span>
                        <p className="text-white/80">
                          {property.yearBuilt || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-white/40 uppercase">
                          Sqft
                        </span>
                        <p className="text-white/80">
                          {property.sqft
                            ? property.sqft.toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      {property.bedrooms !== undefined && (
                        <div>
                          <span className="text-[11px] text-white/40 uppercase">
                            Bed / Bath
                          </span>
                          <p className="text-white/80">
                            {property.bedrooms} / {property.bathrooms}
                          </p>
                        </div>
                      )}
                      {property.lotSize !== undefined && (
                        <div>
                          <span className="text-[11px] text-white/40 uppercase">
                            Lot Size
                          </span>
                          <p className="text-white/80">
                            {property.lotSize.toLocaleString()} sqft
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Owner / Client */}
                    <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                      <span className="text-[11px] text-white/40 uppercase">
                        Owner
                      </span>
                      <p className="text-white/80">
                        {property.owner || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assessment History */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Assessment History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left text-[11px] text-white/40 uppercase pb-2">
                            Year
                          </th>
                          <th className="text-left text-[11px] text-white/40 uppercase pb-2">
                            Assessed
                          </th>
                          <th className="text-left text-[11px] text-white/40 uppercase pb-2">
                            Market
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr
                            key={h.year}
                            className="border-t border-[rgba(255,255,255,0.06)]"
                          >
                            <td className="py-1.5 text-sm text-white/80">
                              {h.year}
                            </td>
                            <td className="py-1.5 text-sm text-white/70">
                              {formatCurrency(h.assessed)}
                            </td>
                            <td className="py-1.5 text-sm text-white/70">
                              {formatCurrency(h.market)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Appeal History */}
                  {appeal && (
                    <div className="mt-5">
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Appeal History
                      </h4>
                      <div className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white/80">
                            {appeal.id}
                          </span>
                          <GlassBadge
                            variant={
                              appeal.status === "won"
                                ? "success"
                                : appeal.status === "lost"
                                  ? "error"
                                  : "info"
                            }
                          >
                            {appeal.status}
                          </GlassBadge>
                        </div>
                        <p className="text-[11px] text-white/50">
                          Est. savings:{" "}
                          {formatCurrency(appeal.estimatedSavings)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comparable Properties */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Comparable Properties
                  </h4>
                  <div className="space-y-2">
                    {comparables.map((comp, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-2.5"
                      >
                        <p className="text-xs font-medium text-white/80 truncate">
                          {comp.address}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-[11px] text-white/50">
                            Assessed: {formatCurrency(comp.assessed)}
                          </span>
                          <span className="text-[11px] text-white/50">
                            {comp.sqft > 0
                              ? `${comp.sqft.toLocaleString()} sqft`
                              : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mt-5">
                    <GlassButton variant="primary" size="sm" icon={<FileText className="h-3.5 w-3.5" />}>
                      Start Appeal
                    </GlassButton>
                    <GlassButton variant="ghost" size="sm" icon={<TrendingDown className="h-3.5 w-3.5" />}>
                      Run Analysis
                    </GlassButton>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
