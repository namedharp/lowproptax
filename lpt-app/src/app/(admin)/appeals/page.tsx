"use client";

import { useState, useMemo } from "react";
import {
  Search,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  UserCheck,
  RefreshCw,
  Download,
  Clock,
  File,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassTextarea } from "@/components/ui/GlassTextarea";
import { mockAdminAppeals, mockAgents } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AdminAppeal } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Agent name resolver                                                */
/* ------------------------------------------------------------------ */
function agentName(agentId: string): string {
  return mockAgents.find((a) => a.id === agentId)?.name ?? agentId;
}

/* ------------------------------------------------------------------ */
/*  Badge helpers                                                      */
/* ------------------------------------------------------------------ */
type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "teal";

function statusBadgeVariant(status: AdminAppeal["status"]): BadgeVariant {
  switch (status) {
    case "draft":
      return "default";
    case "submitted":
      return "info";
    case "under-review":
      return "warning";
    case "hearing-scheduled":
      return "teal";
    case "won":
      return "success";
    case "lost":
      return "error";
    case "withdrawn":
      return "default";
    default:
      return "default";
  }
}

function priorityBadgeVariant(priority: AdminAppeal["priority"]): BadgeVariant {
  switch (priority) {
    case "urgent":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
      return "teal";
    default:
      return "default";
  }
}

function serviceLabel(st: AdminAppeal["serviceType"]): string {
  switch (st) {
    case "full-service":
      return "Full Service";
    case "diy":
      return "DIY";
    case "investor-portfolio":
      return "Investor";
    default:
      return st;
  }
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "under-review": "Under Review",
  "hearing-scheduled": "Hearing Scheduled",
  won: "Won",
  lost: "Lost",
  withdrawn: "Withdrawn",
};

/* ------------------------------------------------------------------ */
/*  Mock timeline for detail view                                      */
/* ------------------------------------------------------------------ */
function mockTimeline(appeal: AdminAppeal) {
  const items: { date: string; label: string; detail: string }[] = [];
  items.push({
    date: appeal.lastUpdated,
    label: "Last Updated",
    detail: `Status: ${statusLabels[appeal.status] || appeal.status}`,
  });
  if (appeal.hearingDate) {
    items.push({
      date: appeal.hearingDate,
      label: "Hearing Date",
      detail: `Hearing scheduled`,
    });
  }
  if (appeal.filedDate) {
    items.push({
      date: appeal.filedDate,
      label: "Appeal Filed",
      detail: `Filed with ${appeal.serviceType} service`,
    });
  }
  items.push({
    date: appeal.filedDate || appeal.lastUpdated,
    label: "Appeal Created",
    detail: `Original assessment: ${formatCurrency(appeal.originalAssessment)}`,
  });
  return items;
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function AdminAppealsPage() {
  /* --- Filters --- */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  /* --- Selection --- */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /* --- Expanded detail --- */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* --- Modals --- */
  const [statusModal, setStatusModal] = useState<AdminAppeal | null>(null);
  const [reassignModal, setReassignModal] = useState<AdminAppeal | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [reassignAgent, setReassignAgent] = useState("");

  /* --- Filtered data --- */
  const filtered = useMemo(() => {
    return mockAdminAppeals.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.propertyAddress.toLowerCase().includes(q) ||
        a.clientName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchPriority =
        priorityFilter === "all" || a.priority === priorityFilter;
      const matchService =
        serviceFilter === "all" || a.serviceType === serviceFilter;
      const matchAgent =
        agentFilter === "all" || a.assignedAgent === agentFilter;
      return (
        matchSearch && matchStatus && matchPriority && matchService && matchAgent
      );
    });
  }, [search, statusFilter, priorityFilter, serviceFilter, agentFilter]);

  /* --- Select helpers --- */
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  }

  /* --- Stats line --- */
  const activeCount = mockAdminAppeals.filter(
    (a) => !["won", "lost", "withdrawn"].includes(a.status)
  ).length;
  const hearingCount = mockAdminAppeals.filter(
    (a) => a.status === "hearing-scheduled"
  ).length;
  const wonCount = mockAdminAppeals.filter((a) => a.status === "won").length;
  const totalResolved = mockAdminAppeals.filter((a) =>
    ["won", "lost"].includes(a.status)
  ).length;
  const successRate =
    totalResolved > 0 ? Math.round((wonCount / totalResolved) * 100) : 0;

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setServiceFilter("all");
    setAgentFilter("all");
  }

  /* --- Appeal ID formatter --- */
  function formatAppealId(id: string): string {
    const num = id.replace(/\D/g, "");
    return `APL-${num.padStart(3, "0")}`;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Appeal Operations</h1>
        <p className="mt-1 text-sm text-white/50">
          {activeCount} Active &middot; {hearingCount} Pending Hearings
          &middot; {successRate}% Success Rate
        </p>
      </div>

      {/* Filters */}
      <GlassCard variant="light" padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <GlassInput
            placeholder="Search address or client..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <GlassSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Status" },
              { value: "draft", label: "Draft" },
              { value: "submitted", label: "Submitted" },
              { value: "under-review", label: "Under Review" },
              { value: "hearing-scheduled", label: "Hearing Scheduled" },
              { value: "won", label: "Won" },
              { value: "lost", label: "Lost" },
              { value: "withdrawn", label: "Withdrawn" },
            ]}
          />
          <GlassSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: "all", label: "All Priority" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "urgent", label: "Urgent" },
            ]}
          />
          <GlassSelect
            value={serviceFilter}
            onChange={setServiceFilter}
            options={[
              { value: "all", label: "All Services" },
              { value: "full-service", label: "Full Service" },
              { value: "diy", label: "DIY" },
              { value: "investor-portfolio", label: "Investor Portfolio" },
            ]}
          />
          <GlassSelect
            value={agentFilter}
            onChange={setAgentFilter}
            options={[
              { value: "all", label: "All Agents" },
              ...mockAgents.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <GlassButton variant="ghost" size="sm" onClick={clearFilters} icon={<Filter className="h-4 w-4" />}>
            Clear
          </GlassButton>
        </div>
      </GlassCard>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <GlassCard variant="heavy" padding="sm">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-white">
              {selected.size} selected
            </span>
            <GlassButton variant="secondary" size="sm" icon={<UserCheck className="h-4 w-4" />}>
              Bulk Reassign
            </GlassButton>
            <GlassButton variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />}>
              Bulk Status Update
            </GlassButton>
            <GlassButton variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
              Export Selected
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Appeals Table */}
      <div className="overflow-hidden rounded-[16px] bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.1)]">
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      selected.size === filtered.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[rgba(255,255,255,0.3)] bg-transparent accent-teal-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Property
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden md:table-cell">
                  Client
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden lg:table-cell">
                  Service
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden lg:table-cell">
                  Priority
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden xl:table-cell">
                  Agent
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden xl:table-cell">
                  Filed
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden xl:table-cell">
                  Hearing
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden lg:table-cell">
                  Est. Savings
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((appeal) => {
                const isExpanded = expandedId === appeal.id;
                return (
                  <AppealRow
                    key={appeal.id}
                    appeal={appeal}
                    isSelected={selected.has(appeal.id)}
                    onToggleSelect={() => toggleSelect(appeal.id)}
                    isExpanded={isExpanded}
                    onToggleExpand={() =>
                      setExpandedId(isExpanded ? null : appeal.id)
                    }
                    onUpdateStatus={() => {
                      setStatusModal(appeal);
                      setNewStatus(appeal.status);
                      setModalNotes("");
                    }}
                    onReassign={() => {
                      setReassignModal(appeal);
                      setReassignAgent(appeal.assignedAgent);
                      setModalNotes("");
                    }}
                    formatAppealId={formatAppealId}
                  />
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-12 text-center text-sm text-white/40"
                  >
                    No appeals match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      <GlassModal
        isOpen={statusModal !== null}
        onClose={() => setStatusModal(null)}
        title="Update Appeal Status"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            {statusModal?.propertyAddress}
          </p>
          <GlassSelect
            label="New Status"
            value={newStatus}
            onChange={setNewStatus}
            options={[
              { value: "draft", label: "Draft" },
              { value: "submitted", label: "Submitted" },
              { value: "under-review", label: "Under Review" },
              { value: "hearing-scheduled", label: "Hearing Scheduled" },
              { value: "won", label: "Won" },
              { value: "lost", label: "Lost" },
              { value: "withdrawn", label: "Withdrawn" },
            ]}
          />
          <GlassTextarea
            label="Notes (required)"
            placeholder="Reason for status change..."
            value={modalNotes}
            onChange={(e) => setModalNotes(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setStatusModal(null)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => setStatusModal(null)}
            >
              Save
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Reassign Agent Modal */}
      <GlassModal
        isOpen={reassignModal !== null}
        onClose={() => setReassignModal(null)}
        title="Reassign Agent"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            {reassignModal?.propertyAddress} &mdash;{" "}
            {reassignModal?.clientName}
          </p>
          <GlassSelect
            label="Assign to Agent"
            value={reassignAgent}
            onChange={setReassignAgent}
            options={mockAgents.map((a) => ({
              value: a.id,
              label: a.name,
            }))}
          />
          <GlassTextarea
            label="Notes"
            placeholder="Reason for reassignment..."
            value={modalNotes}
            onChange={(e) => setModalNotes(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setReassignModal(null)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => setReassignModal(null)}
            >
              Save
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

/* ================================================================== */
/*  Appeal Row Component                                               */
/* ================================================================== */
function AppealRow({
  appeal,
  isSelected,
  onToggleSelect,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
  onReassign,
  formatAppealId,
}: {
  appeal: AdminAppeal;
  isSelected: boolean;
  onToggleSelect: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateStatus: () => void;
  onReassign: () => void;
  formatAppealId: (id: string) => string;
}) {
  const timeline = mockTimeline(appeal);

  return (
    <>
      <tr
        className={cn(
          "border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] transition-colors",
          isSelected && "bg-teal-500/5"
        )}
      >
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-[rgba(255,255,255,0.3)] bg-transparent accent-teal-500"
          />
        </td>
        <td className="px-3 py-3 text-sm font-mono text-teal-400">
          {formatAppealId(appeal.id)}
        </td>
        <td className="px-3 py-3 text-sm text-white/90 max-w-[200px] truncate">
          {appeal.propertyAddress.split(",")[0]}
        </td>
        <td className="px-3 py-3 text-sm text-white/70 hidden md:table-cell">
          {appeal.clientName}
        </td>
        <td className="px-3 py-3 hidden lg:table-cell">
          <GlassBadge variant="default">{serviceLabel(appeal.serviceType)}</GlassBadge>
        </td>
        <td className="px-3 py-3">
          <GlassBadge variant={statusBadgeVariant(appeal.status)}>
            {statusLabels[appeal.status] || appeal.status}
          </GlassBadge>
        </td>
        <td className="px-3 py-3 hidden lg:table-cell">
          <GlassBadge variant={priorityBadgeVariant(appeal.priority)}>
            {appeal.priority}
          </GlassBadge>
        </td>
        <td className="px-3 py-3 text-sm text-white/70 hidden xl:table-cell">
          {agentName(appeal.assignedAgent)}
        </td>
        <td className="px-3 py-3 text-sm text-white/60 hidden xl:table-cell">
          {appeal.filedDate ? formatDate(appeal.filedDate) : "\u2014"}
        </td>
        <td className="px-3 py-3 text-sm text-white/60 hidden xl:table-cell">
          {appeal.hearingDate ? formatDate(appeal.hearingDate) : "\u2014"}
        </td>
        <td className="px-3 py-3 text-sm text-white/80 hidden lg:table-cell">
          {formatCurrency(appeal.estimatedSavings)}
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-teal-400 hover:bg-teal-500/10 transition-colors"
              title="View Details"
            >
              <Eye className="h-3.5 w-3.5" />
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              onClick={onUpdateStatus}
              className="inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-medium text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white transition-colors"
              title="Update Status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onReassign}
              className="inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-medium text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white transition-colors"
              title="Reassign"
            >
              <UserCheck className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <tr>
          <td colSpan={12} className="p-0">
            <div className="bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.1)] px-6 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Property Info */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Property Info
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-white/80">{appeal.propertyAddress}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-[11px] text-white/40 uppercase">
                          Assessed
                        </span>
                        <p className="text-white/80">
                          {formatCurrency(appeal.originalAssessment)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-white/40 uppercase">
                          Target
                        </span>
                        <p className="text-white/80">
                          {formatCurrency(appeal.targetAssessment)}
                        </p>
                      </div>
                      {appeal.finalAssessment && (
                        <div>
                          <span className="text-[11px] text-white/40 uppercase">
                            Final
                          </span>
                          <p className="text-green-400">
                            {formatCurrency(appeal.finalAssessment)}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-[11px] text-white/40 uppercase">
                          Est. Savings
                        </span>
                        <p className="text-teal-400">
                          {formatCurrency(appeal.estimatedSavings)}
                        </p>
                      </div>
                      {appeal.actualSavings !== undefined && (
                        <div>
                          <span className="text-[11px] text-white/40 uppercase">
                            Actual Savings
                          </span>
                          <p
                            className={
                              appeal.actualSavings > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {formatCurrency(appeal.actualSavings)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client info */}
                  <h4 className="text-sm font-semibold text-white mt-5 mb-2">
                    Client
                  </h4>
                  <p className="text-sm text-white/80">{appeal.clientName}</p>
                  <p className="text-xs text-white/50">
                    {serviceLabel(appeal.serviceType)}
                  </p>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Timeline
                  </h4>
                  <div className="space-y-3">
                    {timeline.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-teal-400 mt-1.5" />
                          {idx < timeline.length - 1 && (
                            <div className="w-px flex-1 bg-[rgba(255,255,255,0.1)] mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-xs font-medium text-white/80">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-white/50">
                            {item.detail}
                          </p>
                          <p className="text-[11px] text-white/30 mt-0.5">
                            {formatDate(item.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Internal Notes */}
                  <h4 className="text-sm font-semibold text-white mt-5 mb-2">
                    Internal Notes
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {appeal.internalNotes || "No notes."}
                  </p>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Documents
                  </h4>
                  {appeal.documents.length > 0 ? (
                    <div className="space-y-2">
                      {appeal.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-2.5 hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
                        >
                          <File className="h-4 w-4 text-teal-400 flex-shrink-0" />
                          <span className="text-xs text-white/80 truncate">
                            {doc}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">
                      No documents uploaded.
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-6">
                    <GlassButton variant="primary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={onUpdateStatus}>
                      Update Status
                    </GlassButton>
                    <GlassButton variant="secondary" size="sm" icon={<UserCheck className="h-3.5 w-3.5" />} onClick={onReassign}>
                      Reassign
                    </GlassButton>
                    <GlassButton variant="ghost" size="sm" icon={<Calendar className="h-3.5 w-3.5" />}>
                      Set Hearing
                    </GlassButton>
                    <GlassButton variant="ghost" size="sm" icon={<MessageSquare className="h-3.5 w-3.5" />}>
                      Add Note
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
