"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  Building2,
  Briefcase,
  Clock,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassStat } from "@/components/ui/GlassStat";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------------ */
/*  API response interfaces                                            */
/* ------------------------------------------------------------------ */
interface AdminStatsResponse {
  totalClients: number;
  totalActiveAppeals: number;
  totalRevenue: number;
  avgSavingsPerAppeal: number;
  appealsByStatus: Record<string, number>;
  successRate: number;
}

interface ApiProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  county: string;
  propertyType: string;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ApiAgent {
  id: string;
  name: string;
  email: string;
}

interface ApiAppeal {
  id: string;
  status: string;
  serviceType: string;
  filedDate: string | null;
  hearingDate: string | null;
  originalAssessment: number;
  targetAssessment: number;
  finalAssessment: number | null;
  estimatedSavings: number;
  actualSavings: number | null;
  notes: string | null;
  priority: string | null;
  deadline: string | null;
  propertyId: string;
  userId: string;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
  property: ApiProperty;
  user: ApiUser;
  agent: ApiAgent | null;
}

type ActivityEntityType = "appeal" | "client" | "property" | "portfolio";

interface ApiActivity {
  id: string;
  action: string;
  entityType: ActivityEntityType;
  entityId: string;
  agentName: string | null;
  details: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: relative time                                              */
/* ------------------------------------------------------------------ */
function relativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  return `${diffMo}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Helper: days between two dates                                     */
/* ------------------------------------------------------------------ */
function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/* ------------------------------------------------------------------ */
/*  Activity icon by entity type                                       */
/* ------------------------------------------------------------------ */
function ActivityIcon({ entityType }: { entityType: ActivityEntityType }) {
  const iconClass = "h-4 w-4";
  switch (entityType) {
    case "appeal":
      return <FileText className={cn(iconClass, "text-blue-400")} />;
    case "client":
      return <Users className={cn(iconClass, "text-teal-400")} />;
    case "property":
      return <Building2 className={cn(iconClass, "text-emerald-400")} />;
    case "portfolio":
      return <Briefcase className={cn(iconClass, "text-purple-400")} />;
    default:
      return <Clock className={cn(iconClass, "text-white/60")} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Status color map                                                   */
/* ------------------------------------------------------------------ */
const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "under-review": "Under Review",
  "hearing-scheduled": "Hearing Scheduled",
  won: "Won",
  lost: "Lost",
  withdrawn: "Withdrawn",
};

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function AdminOverviewPage() {
  /* --- State --- */
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [appeals, setAppeals] = useState<ApiAppeal[]>([]);
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- Fetch data --- */
  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()),
      fetch("/api/appeals").then((r) => r.json()),
      fetch("/api/activity?limit=15").then((r) => r.json()),
    ])
      .then(([statsData, appealsData, activityData]) => {
        setStats(statsData);
        setAppeals(Array.isArray(appealsData) ? appealsData : []);
        setActivities(Array.isArray(activityData) ? activityData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* --- Group appeals by status --- */
  const pipeline = useMemo(() => {
    const groups: Record<string, ApiAppeal[]> = {
      draft: [],
      submitted: [],
      "under-review": [],
      "hearing-scheduled": [],
      won: [],
      lost: [],
    };
    for (const a of appeals) {
      if (groups[a.status]) groups[a.status].push(a);
    }
    return groups;
  }, [appeals]);

  /* --- Deadline appeals --- */
  const deadlineAppeals = useMemo(() => {
    return appeals
      .filter((a) => a.deadline)
      .sort(
        (a, b) =>
          new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
      );
  }, [appeals]);

  /* --- Derived KPI values --- */
  const pendingHearings = useMemo(
    () => appeals.filter((a) => a.status === "hearing-scheduled").length,
    [appeals]
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /* --- Loading --- */
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
          <p className="mt-1 text-sm text-white/50">{today}</p>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full" />
          <span className="ml-3 text-white/60">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
        <p className="mt-1 text-sm text-white/50">{today}</p>
      </div>

      {/* ---- KPI Stats Grid ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassStat
          label="Total Clients"
          value={stats?.totalClients?.toLocaleString() ?? "0"}
          icon={<Users className="h-6 w-6" />}
        />
        <GlassStat
          label="Active Appeals"
          value={stats?.totalActiveAppeals?.toLocaleString() ?? "0"}
          icon={<FileText className="h-6 w-6" />}
        />
        <GlassStat
          label="Total Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <GlassStat
          label="Success Rate"
          value={`${stats?.successRate ?? 0}%`}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <GlassStat
          label="Pending Hearings"
          value={pendingHearings.toString()}
          icon={<Calendar className="h-6 w-6" />}
        />
        <GlassStat
          label="Avg Savings / Appeal"
          value={`$${(stats?.avgSavingsPerAppeal ?? 0).toLocaleString()}`}
          icon={<BarChart3 className="h-6 w-6" />}
        />
      </div>

      {/* ---- Appeals Pipeline ---- */}
      <GlassCard padding="md">
        <h2 className="text-lg font-semibold text-white mb-4">
          Appeals Pipeline
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {(
            [
              "draft",
              "submitted",
              "under-review",
              "hearing-scheduled",
              "won",
              "lost",
            ] as const
          ).map((status) => {
            const items = pipeline[status] || [];
            return (
              <div
                key={status}
                className="min-w-[220px] flex-shrink-0 bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)] rounded-[16px] p-3"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/80">
                    {statusLabels[status]}
                  </span>
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-[rgba(255,255,255,0.15)] px-1.5 text-[11px] font-semibold text-white/70">
                    {items.length}
                  </span>
                </div>

                {/* Mini cards */}
                <div className="space-y-2">
                  {items.map((appeal) => (
                    <div
                      key={appeal.id}
                      className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-2.5 hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    >
                      <p className="text-xs font-medium text-white/90 truncate">
                        {appeal.property?.address ?? "Unknown"}
                      </p>
                      <p className="text-[11px] text-white/50 mt-0.5 truncate">
                        {appeal.user?.name ?? "Unknown"}
                      </p>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-white/30 text-center py-4">
                      No appeals
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* ---- Two-column: Activity + Deadlines ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <GlassCard padding="md">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {activities.length === 0 && (
              <p className="text-sm text-white/40 text-center py-8">
                No recent activity.
              </p>
            )}
            {activities.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-3 p-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)]">
                  <ActivityIcon entityType={entry.entityType} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/90">
                    {entry.action}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                    {entry.details}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-teal-400/70">
                      {entry.agentName ?? "System"}
                    </span>
                    <span className="text-[11px] text-white/30">
                      {relativeTime(entry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Upcoming Deadlines */}
        <GlassCard padding="none">
          <div className="p-6 pb-0">
            <h2 className="text-lg font-semibold text-white mb-4">
              Upcoming Deadlines
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.06)]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Property
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Client
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Deadline
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Days Left
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {deadlineAppeals.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-white/40"
                    >
                      No upcoming deadlines.
                    </td>
                  </tr>
                )}
                {deadlineAppeals.map((appeal) => {
                  const days = daysUntil(appeal.deadline!);
                  const dayColor =
                    days < 3
                      ? "text-red-400"
                      : days < 7
                        ? "text-yellow-400"
                        : "text-green-400";
                  const priorityVariant =
                    appeal.priority === "urgent"
                      ? "error"
                      : appeal.priority === "high"
                        ? "warning"
                        : appeal.priority === "medium"
                          ? "info"
                          : "teal";

                  return (
                    <tr
                      key={appeal.id}
                      className="border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-white/90 max-w-[180px] truncate">
                        {appeal.property?.address ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {appeal.user?.name ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {formatDate(appeal.deadline!)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn("text-sm font-semibold", dayColor)}
                        >
                          {days <= 0 ? "Overdue" : `${days}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <GlassBadge
                          variant={
                            priorityVariant as
                              | "error"
                              | "warning"
                              | "info"
                              | "teal"
                          }
                        >
                          {appeal.priority ?? "normal"}
                        </GlassBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
