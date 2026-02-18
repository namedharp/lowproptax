"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import {
  Building2,
  DollarSign,
  Receipt,
  PiggyBank,
  FileText,
  TrendingUp,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import type { Property, Appeal, PortfolioSummary } from "@/lib/types";

const propertyTypeLabels: Record<Property["propertyType"], string> = {
  "single-family": "Single Family",
  "multi-family": "Multi Family",
  condo: "Condo",
  commercial: "Commercial",
  "vacant-land": "Vacant Land",
};

const statusLabel: Record<Appeal["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  "under-review": "Under Review",
  "hearing-scheduled": "Hearing Scheduled",
  won: "Won",
  lost: "Lost",
  withdrawn: "Withdrawn",
};

const statusBadgeVariant: Record<Appeal["status"], "default" | "success" | "warning" | "error" | "info" | "teal"> = {
  draft: "default",
  submitted: "info",
  "under-review": "warning",
  "hearing-scheduled": "warning",
  won: "success",
  lost: "error",
  withdrawn: "default",
};

export default function PortfolioPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<PortfolioSummary | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/portfolio/stats").then((r) => r.json()),
      fetch("/api/properties").then((r) => r.json()),
      fetch("/api/appeals").then((r) => r.json()),
    ])
      .then(([statsData, propertiesData, appealsData]) => {
        setStats(statsData);
        setProperties(Array.isArray(propertiesData) ? propertiesData : []);
        setAppeals(Array.isArray(appealsData) ? appealsData : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function getAppealForProperty(propertyId: string): Appeal | undefined {
    return appeals.find(
      (a) =>
        a.propertyId === propertyId &&
        !["won", "lost", "withdrawn"].includes(a.status)
    );
  }

  const allSelected = properties.length > 0 && selectedIds.size === properties.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(properties.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const portfolioStats = [
    {
      label: "Total Properties",
      value: stats ? String(stats.totalProperties) : "--",
      icon: Building2,
      color: "text-teal-400",
      bgColor: "bg-teal-500/20",
    },
    {
      label: "Total Assessed Value",
      value: stats ? formatCurrency(stats.totalAssessedValue) : "--",
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
    },
    {
      label: "Total Annual Tax",
      value: stats ? formatCurrency(stats.totalAnnualTax) : "--",
      icon: Receipt,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
    {
      label: "Potential Savings",
      value: stats ? formatCurrency(stats.potentialSavings) : "--",
      icon: PiggyBank,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      label: "Appeals In Progress",
      value: stats ? String(stats.appealsInProgress) : "--",
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      label: "Portfolio ROI",
      value: stats ? `${stats.roi}%` : "--",
      icon: TrendingUp,
      color: "text-teal-400",
      bgColor: "bg-teal-500/20",
    },
  ];

  const roiPercent = stats?.roi ?? 0;
  const roiCapped = Math.min(roiPercent, 400);
  const roiBarWidth = `${Math.min((roiCapped / 400) * 100, 100)}%`;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl pt-10 lg:pt-0 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
          <p className="mt-4 text-white/60 text-sm">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pt-10 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Portfolio Manager
        </h1>
        <p className="mt-1 text-white/60 text-sm">
          Manage your investment properties and track appeal performance
        </p>
      </div>

      {/* Portfolio Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {portfolioStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/60">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Batch Actions Bar */}
      <GlassCard padding="sm" variant="light">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-400" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Select All
          </button>
          <span className="text-sm text-white/50">
            {selectedIds.size > 0
              ? `${selectedIds.size} of ${properties.length} selected`
              : `${properties.length} properties`}
          </span>
          <div className="flex-1" />
          <GlassButton
            variant="primary"
            size="sm"
            disabled={selectedIds.size === 0}
            icon={<FileText className="h-4 w-4" />}
          >
            Batch Appeal
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="sm"
            icon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </GlassButton>
        </div>
      </GlassCard>

      {/* Properties Table */}
      <GlassCard padding="none">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)]">
          <h2 className="text-lg font-semibold text-white">Properties</h2>
          <p className="text-sm text-white/50">
            All properties in your portfolio
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <th className="px-6 py-3 text-left w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-teal-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  City / State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Assessed Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Market Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Annual Tax
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Appeal Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-white/40">
                    No properties found.
                  </td>
                </tr>
              ) : (
                properties.map((property) => {
                  const appeal = getAppealForProperty(property.id);
                  const isSelected = selectedIds.has(property.id);
                  return (
                    <tr
                      key={property.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-teal-500/5"
                          : "hover:bg-[rgba(255,255,255,0.05)]"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleSelect(property.id)}
                          className="text-white/50 hover:text-white transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-teal-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium whitespace-nowrap">
                        {property.address}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70 whitespace-nowrap">
                        {property.city}, {property.state}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70 whitespace-nowrap">
                        {propertyTypeLabels[property.propertyType]}
                      </td>
                      <td className="px-6 py-4 text-sm text-white whitespace-nowrap">
                        {formatCurrency(property.assessedValue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70 whitespace-nowrap">
                        {formatCurrency(property.marketValue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-white whitespace-nowrap">
                        {formatCurrency(property.annualTax)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appeal ? (
                          <GlassBadge variant={statusBadgeVariant[appeal.status]}>
                            {statusLabel[appeal.status]}
                          </GlassBadge>
                        ) : (
                          <span className="text-xs text-white/40">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appeal ? (
                          <GlassButton variant="ghost" size="sm">
                            View
                          </GlassButton>
                        ) : (
                          <GlassButton variant="primary" size="sm">
                            Appeal
                          </GlassButton>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ROI Summary Panel */}
      <GlassCard padding="lg">
        <h2 className="text-lg font-semibold text-white mb-6">
          Investment vs. Savings
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-white/50">Total Cost of Appeals</p>
            <p className="mt-1 text-xl font-bold text-white">
              {stats ? formatCurrency(
                stats.roi > 0 && stats.potentialSavings > 0
                  ? Math.round(stats.potentialSavings / (stats.roi / 100))
                  : 0
              ) : "--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/50">Total Savings Achieved</p>
            <p className="mt-1 text-xl font-bold text-emerald-400">
              {stats ? formatCurrency(stats.potentialSavings) : "--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/50">Net Benefit</p>
            <p className="mt-1 text-xl font-bold text-green-400">
              {stats ? formatCurrency(
                stats.roi > 0 && stats.potentialSavings > 0
                  ? stats.potentialSavings - Math.round(stats.potentialSavings / (stats.roi / 100))
                  : 0
              ) : "--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/50">Return on Investment</p>
            <p className="mt-1 text-xl font-bold text-teal-400">
              {stats ? formatPercent(stats.roi) : "--"}
            </p>
          </div>
        </div>

        {/* ROI Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/60">ROI Progress</span>
            <span className="text-teal-400 font-medium">
              {stats ? formatPercent(stats.roi) : "--"}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
              style={{ width: roiBarWidth }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>0%</span>
            <span>100%</span>
            <span>200%</span>
            <span>300%</span>
            <span>400%</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
