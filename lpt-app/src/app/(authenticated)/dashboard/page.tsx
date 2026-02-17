"use client";

import { mockProperties } from "@/lib/data/properties";
import { mockAppeals } from "@/lib/data/appeals";
import { mockUser } from "@/lib/data/user";
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
import type { Appeal } from "@/lib/types";

const stats = [
  {
    label: "Total Properties",
    value: "12",
    icon: Building2,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    trend: "+2 this quarter",
  },
  {
    label: "Active Appeals",
    value: "5",
    icon: FileText,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    trend: "3 under review",
  },
  {
    label: "Total Savings",
    value: "$28,500",
    icon: DollarSign,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    trend: "+$3,100 this year",
  },
  {
    label: "Success Rate",
    value: "92%",
    icon: TrendingUp,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    trend: "Above avg",
  },
  {
    label: "Pending Hearings",
    value: "3",
    icon: Calendar,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    trend: "Next: Sep 20",
  },
  {
    label: "Avg Savings/Property",
    value: "$2,375",
    icon: BarChart3,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    trend: "+12% YoY",
  },
];

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

const recentActivities = [
  {
    id: 1,
    text: "Appeal #APL-001 status updated to Under Review",
    time: "2 hours ago",
    color: "bg-yellow-400",
  },
  {
    id: 2,
    text: "New property added: 123 Oak St, Houston TX",
    time: "5 hours ago",
    color: "bg-teal-400",
  },
  {
    id: 3,
    text: "Hearing scheduled for 456 Elm Ave",
    time: "1 day ago",
    color: "bg-orange-400",
  },
  {
    id: 4,
    text: "Appeal #APL-006 won — saved $1,210/year",
    time: "2 days ago",
    color: "bg-green-400",
  },
  {
    id: 5,
    text: "Comparable sales report generated for 9032 Preston Rd",
    time: "3 days ago",
    color: "bg-blue-400",
  },
  {
    id: 6,
    text: "Portfolio ROI milestone reached: 340%",
    time: "5 days ago",
    color: "bg-emerald-400",
  },
];

function getPropertyAddress(propertyId: string): string {
  const prop = mockProperties.find((p) => p.id === propertyId);
  if (!prop) return "Unknown Property";
  return `${prop.address}, ${prop.city} ${prop.state}`;
}

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const activeAppeals = mockAppeals.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pt-10 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Welcome back, {mockUser.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-white/60 text-sm">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/60">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-white/40">{stat.trend}</p>
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
              {activeAppeals.map((appeal) => (
                <tr
                  key={appeal.id}
                  className="hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-white whitespace-nowrap">
                    {getPropertyAddress(appeal.propertyId)}
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
              ))}
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
          {recentActivities.map((activity) => (
            <li
              key={activity.id}
              className="flex items-start gap-3 px-6 py-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
            >
              <span
                className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${activity.color}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/90">{activity.text}</p>
                <p className="mt-0.5 text-xs text-white/40">{activity.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
