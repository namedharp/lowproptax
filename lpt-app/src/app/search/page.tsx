"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Home,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Building2,
  Ruler,
  Calendar,
  BadgeDollarSign,
} from "lucide-react";
import { mockProperties } from "@/lib/data/properties";

/* ============================================================
   SEARCH PAGE — Client Component
   ============================================================ */

const propertyTypeLabels: Record<string, string> = {
  "single-family": "Single Family",
  "multi-family": "Multi Family",
  condo: "Condo",
  commercial: "Commercial",
  "vacant-land": "Vacant Land",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [valueRange, setValueRange] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredProperties = useMemo(() => {
    return mockProperties.filter((prop) => {
      // Search query
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        prop.address.toLowerCase().includes(q) ||
        prop.city.toLowerCase().includes(q) ||
        prop.state.toLowerCase().includes(q) ||
        prop.county.toLowerCase().includes(q) ||
        prop.zip.includes(q);

      // Property type filter
      const matchesType =
        propertyType === "all" || prop.propertyType === propertyType;

      // Value range filter
      let matchesValue = true;
      if (valueRange === "under-300k") matchesValue = prop.assessedValue < 300000;
      else if (valueRange === "300k-500k")
        matchesValue =
          prop.assessedValue >= 300000 && prop.assessedValue < 500000;
      else if (valueRange === "500k-plus")
        matchesValue = prop.assessedValue >= 500000;

      return matchesQuery && matchesType && matchesValue;
    });
  }, [query, propertyType, valueRange]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function estimateSavings(prop: (typeof mockProperties)[0]) {
    // Simple estimate: difference between market and assessed * tax rate * reduction factor
    const overAssessment = prop.assessedValue - prop.marketValue * 0.85;
    if (overAssessment <= 0) return 0;
    return Math.round(overAssessment * (prop.taxRate / 100));
  }

  return (
    <>
      {/* ——— Page Header ——— */}
      <section className="pt-12 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            Property Search
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Look up your property to see your assessment, estimated savings, and
            start your appeal.
          </p>
        </div>
      </section>

      {/* ——— Search + Filters ——— */}
      <section className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by address, city, state, county, or zip..."
              className="w-full bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] pl-12 pr-4 py-4 text-white text-lg placeholder-white/40 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-white/50" />
            <span className="text-sm text-white/50">Filters:</span>

            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-gray-900">All Types</option>
              <option value="single-family" className="bg-gray-900">Single Family</option>
              <option value="multi-family" className="bg-gray-900">Multi Family</option>
              <option value="condo" className="bg-gray-900">Condo</option>
              <option value="commercial" className="bg-gray-900">Commercial</option>
              <option value="vacant-land" className="bg-gray-900">Vacant Land</option>
            </select>

            <select
              value={valueRange}
              onChange={(e) => setValueRange(e.target.value)}
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-gray-900">All Values</option>
              <option value="under-300k" className="bg-gray-900">Under $300K</option>
              <option value="300k-500k" className="bg-gray-900">$300K - $500K</option>
              <option value="500k-plus" className="bg-gray-900">$500K+</option>
            </select>
          </div>

          {/* Result count */}
          <p className="text-sm text-white/50">
            Showing{" "}
            <span className="text-white font-medium">
              {filteredProperties.length}
            </span>{" "}
            of{" "}
            <span className="text-white font-medium">
              {mockProperties.length}
            </span>{" "}
            properties
          </p>
        </div>
      </section>

      {/* ——— Results Grid ——— */}
      <section className="py-6 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredProperties.length === 0 ? (
            <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.15)] rounded-[16px] p-12 text-center">
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No properties found
              </h3>
              <p className="text-white/50">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => {
                const savings = estimateSavings(prop);
                const isExpanded = expandedId === prop.id;

                return (
                  <div
                    key={prop.id}
                    className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300"
                  >
                    {/* Card header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white leading-tight">
                            {prop.address}
                          </h3>
                          <p className="text-sm text-white/50 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {prop.city}, {prop.state} {prop.zip}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-white/50 bg-white/10 rounded-full px-2.5 py-1">
                          {propertyTypeLabels[prop.propertyType]}
                        </span>
                      </div>

                      {/* Key values */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                          <p className="text-xs text-white/50">Assessed Value</p>
                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(prop.assessedValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50">Market Value</p>
                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(prop.marketValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50">Annual Tax</p>
                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(prop.annualTax)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50">Tax Rate</p>
                          <p className="text-sm font-semibold text-white">
                            {prop.taxRate}%
                          </p>
                        </div>
                      </div>

                      {/* Savings badge */}
                      {savings > 0 && (
                        <div className="mt-4 bg-teal-500/15 border border-teal-400/20 rounded-lg px-3 py-2 flex items-center gap-2">
                          <BadgeDollarSign className="w-4 h-4 text-teal-400 shrink-0" />
                          <span className="text-sm text-teal-400 font-semibold">
                            Potential Savings: {formatCurrency(savings)}/yr
                          </span>
                        </div>
                      )}

                      {/* Expand / Collapse toggle */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : prop.id)
                        }
                        className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-6 bg-[rgba(255,255,255,0.05)] space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {prop.sqft > 0 && (
                            <div className="flex items-center gap-2 text-white/60">
                              <Ruler className="w-4 h-4 text-teal-400/70" />
                              <span>{prop.sqft.toLocaleString()} sqft</span>
                            </div>
                          )}
                          {prop.yearBuilt > 0 && (
                            <div className="flex items-center gap-2 text-white/60">
                              <Calendar className="w-4 h-4 text-teal-400/70" />
                              <span>Built {prop.yearBuilt}</span>
                            </div>
                          )}
                          {prop.bedrooms !== undefined && (
                            <div className="flex items-center gap-2 text-white/60">
                              <Home className="w-4 h-4 text-teal-400/70" />
                              <span>
                                {prop.bedrooms} bed / {prop.bathrooms} bath
                              </span>
                            </div>
                          )}
                          {prop.lotSize !== undefined && (
                            <div className="flex items-center gap-2 text-white/60">
                              <Building2 className="w-4 h-4 text-teal-400/70" />
                              <span>
                                {prop.lotSize.toLocaleString()} sqft lot
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-white/50">
                          <span className="text-white/70 font-medium">
                            County:
                          </span>{" "}
                          {prop.county} |{" "}
                          <span className="text-white/70 font-medium">
                            Last Assessed:
                          </span>{" "}
                          {prop.lastAssessmentDate}
                        </div>
                        <Link
                          href="/register"
                          className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white rounded-xl px-5 py-2.5 font-medium hover:from-teal-500/60 hover:to-emerald-500/60 transition-all duration-300"
                        >
                          Start Appeal
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
