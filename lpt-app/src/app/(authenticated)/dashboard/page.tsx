"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  Plus,
  Search,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import type { Appeal, Property, DashboardStats } from "@/lib/types";

interface AppealWithProperty extends Omit<Appeal, "propertyId"> {
  propertyId: string;
  property?: {
    id: string;
    address: string;
    city: string;
    state: string;
    county: string;
    propertyType: string;
  };
  user?: unknown;
  priority?: string;
  deadline?: string;
  agentId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  agentName: string;
  details: string;
  createdAt: string;
}

const statusBadgeVariant: Record<Appeal["status"], "default" | "success" | "warning" | "error" | "info" | "teal"> = {
  draft: "default",
  submitted: "info",
  "under-review": "warning",
  "hearing-scheduled": "warning",
  won: "success",
  lost: "error",
  withdrawn: "default",
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

function getActivityColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("won") || lower.includes("saved") || lower.includes("success")) return "bg-green-400";
  if (lower.includes("hearing") || lower.includes("scheduled")) return "bg-orange-400";
  if (lower.includes("review") || lower.includes("updated")) return "bg-yellow-400";
  if (lower.includes("added") || lower.includes("created") || lower.includes("new")) return "bg-teal-400";
  if (lower.includes("report") || lower.includes("generated")) return "bg-blue-400";
  if (lower.includes("milestone") || lower.includes("roi")) return "bg-emerald-400";
  return "bg-white/40";
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getPropertyAddress(appeal: AppealWithProperty, properties: Property[]): string {
  if (appeal.property) {
    return `${appeal.property.address}, ${appeal.property.city} ${appeal.property.state}`;
  }
  const prop = properties.find((p) => p.id === appeal.propertyId);
  if (!prop) return "Unknown Property";
  return `${prop.address}, ${prop.city} ${prop.state}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [appeals, setAppeals] = useState<AppealWithProperty[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()),
      fetch("/api/properties").then((r) => r.json()),
      fetch("/api/appeals").then((r) => r.json()),
      fetch("/api/activity?limit=10").then((r) => r.json()),
    ])
      .then(([statsData, propertiesData, appealsData, activitiesData]) => {
        setStats(statsData);
        setProperties(Array.isArray(propertiesData) ? propertiesData : []);
        setAppeals(Array.isArray(appealsData) ? appealsData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const statsCards = [
    {
      label: "Total Properties",
      value: stats ? String(stats.totalProperties) : "--",
      icon: Building2,
      color: "text-teal-400",
      bgColor: "bg-teal-500/20",
      trend: "",
    },
    {
      label: "Active Appeals",
      value: stats ? String(stats.activeAppeals) : "--",
      icon: FileText,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      trend: "",
    },
    {
      label: "Total Savings",
      value: stats ? formatCurrency(stats.totalSavings) : "--",
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      trend: "",
    },
    {
      label: "Success Rate",
      value: stats ? `${stats.successRate}%` : "--",
      icon: TrendingUp,
      color: "text-teal-400",
      bgColor: "bg-teal-500/20",
      trend: "",
    },
    {
      label: "Pending Hearings",
      value: stats ? String(stats.pendingHearings) : "--",
      icon: Calendar,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      trend: "",
    },
    {
      label: "Avg Savings/Property",
      value: stats ? formatCurrency(stats.avgSavingsPerProperty) : "--",
      icon: BarChart3,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      trend: "",
    },
  ];

  const activeAppeals = appeals.slice(0, 6);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl pt-10 lg:pt-0 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
          <p className="mt-4 text-white/60 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pt-10 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-white/60 text-sm">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/60">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                  {stat.trend && (
                    <p className="mt-1 text-xs text-white/40">{stat.trend}</p>
                  )}
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

      {/* Active Appeals Table */}
      <GlassCard padding="none">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)]">
          <h2 className="text-lg font-semibold text-white">Active Appeals</h2>
          <p className="text-sm text-white/50">
            Tracking your property tax appeals
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Filed Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Est. Savings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {activeAppeals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-white/40">
                    No active appeals found.
                  </td>
                </tr>
              ) : (
                activeAppeals.map((appeal) => (
                  <tr
                    key={appeal.id}
                    className="hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white whitespace-nowrap">
                      {getPropertyAddress(appeal, properties)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <GlassBadge variant={statusBadgeVariant[appeal.status]}>
                        {statusLabel[appeal.status]}
                      </GlassBadge>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70 capitalize whitespace-nowrap">
                      {appeal.serviceType.replace("-", " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70 whitespace-nowrap">
                      {appeal.filedDate ? formatDate(appeal.filedDate) : "--"}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-400 font-medium whitespace-nowrap">
                      {formatCurrency(appeal.estimatedSavings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <GlassButton variant="ghost" size="sm">
                        View
                      </GlassButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GlassButton
            variant="primary"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            href="#"
            className="w-full justify-center"
          >
            Start New Appeal
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="md"
            icon={<Search className="h-4 w-4" />}
            href="/search"
            className="w-full justify-center"
          >
            Search Properties
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="md"
            icon={<MessageSquare className="h-4 w-4" />}
            href="/ai-assistant"
            className="w-full justify-center"
          >
            AI Assistant
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="md"
            icon={<Briefcase className="h-4 w-4" />}
            href="/portfolio"
            className="w-full justify-center"
          >
            View Portfolio
          </GlassButton>
        </div>
      </div>

      {/* Recent Activity */}
      <GlassCard padding="none">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)]">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>
        <ul className="divide-y divide-[rgba(255,255,255,0.05)]">
          {activities.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-white/40">
              No recent activity.
            </li>
          ) : (
            activities.map((activity) => (
              <li
                key={activity.id}
                className="flex items-start gap-3 px-6 py-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
              >
                <span
                  className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${getActivityColor(activity.action)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/90">
                    {activity.details || activity.action}
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {activity.createdAt ? formatTimeAgo(activity.createdAt) : ""}
                    {activity.agentName ? ` \u00b7 ${activity.agentName}` : ""}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    </div>
  );
}
