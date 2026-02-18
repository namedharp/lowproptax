"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Pencil,
  Bell,
  Settings,
  Plus,
  Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------------ */
/*  API Response interfaces                                            */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Toggle Switch component                                            */
/* ------------------------------------------------------------------ */
function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0",
        enabled
          ? "bg-teal-500/50 border border-teal-400/40"
          : "bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.15)]"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full transition-transform duration-200",
          enabled
            ? "translate-x-6 bg-teal-400"
            : "translate-x-1 bg-white/50"
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Checkbox component                                                 */
/* ------------------------------------------------------------------ */
function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-[rgba(255,255,255,0.3)] bg-transparent accent-teal-500"
      />
      <span className="text-sm text-white/80 group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function AdminSettingsPage() {
  /* --- Agent data state --- */
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  /* --- Add Agent Modal --- */
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [addingAgent, setAddingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    email: "",
    role: "agent",
  });

  /* --- Workflow toggles --- */
  const [autoAssign, setAutoAssign] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [requireNotes, setRequireNotes] = useState(true);
  const [reminderDays, setReminderDays] = useState("7");

  /* --- Notification checkboxes --- */
  const [notifNewClient, setNotifNewClient] = useState(true);
  const [notifStatusChange, setNotifStatusChange] = useState(true);
  const [notifHearingApproach, setNotifHearingApproach] = useState(true);
  const [notifResolved, setNotifResolved] = useState(true);

  /* --- Fetch agents --- */
  const fetchAgents = useCallback(() => {
    setAgentsLoading(true);
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
        setAgentsLoading(false);
      })
      .catch(() => setAgentsLoading(false));
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  /* --- Add Agent handler --- */
  async function handleAddAgent() {
    if (!newAgent.name || !newAgent.email) return;
    setAddingAgent(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgent.name,
          email: newAgent.email,
          role: newAgent.role,
        }),
      });
      if (res.ok) {
        setShowAddAgent(false);
        setNewAgent({ name: "", email: "", role: "agent" });
        fetchAgents();
      }
    } catch {
      // Silently handle error
    } finally {
      setAddingAgent(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your team, workflows, and notifications
        </p>
      </div>

      {/* ---- Team Management ---- */}
      <GlassCard padding="md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20">
              <Users className="h-5 w-5 text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Team Management</h2>
          </div>
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddAgent(true)}
          >
            Add Agent
          </GlassButton>
        </div>

        {agentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
              <p className="text-sm text-white/50">Loading agents...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.06)]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Role
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden md:table-cell">
                    Active Appeals
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden md:table-cell">
                    Total Wins
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Success Rate
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const roleVariant =
                    agent.role === "admin"
                      ? "error"
                      : agent.role === "manager"
                        ? "warning"
                        : "teal";

                  return (
                    <tr
                      key={agent.id}
                      className="border-t border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/30 border border-[rgba(255,255,255,0.15)] text-xs font-semibold text-white flex-shrink-0">
                            {(agent.name ?? "")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {agent.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60 hidden sm:table-cell">
                        {agent.email}
                      </td>
                      <td className="px-4 py-3">
                        <GlassBadge variant={roleVariant}>
                          {agent.role}
                        </GlassBadge>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80 hidden md:table-cell">
                        {agent.activeAppeals}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80 hidden md:table-cell">
                        {"\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <span className="text-xs text-white/60">
                            {"\u2014"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {agents.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-white/40"
                    >
                      No agents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* ---- Workflow Settings ---- */}
      <GlassCard padding="md">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20">
            <Settings className="h-5 w-5 text-teal-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Workflow Settings
          </h2>
        </div>

        <div className="space-y-5">
          {/* Auto-assign */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                Auto-assign appeals
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                Automatically assign new appeals to agents based on workload
              </p>
            </div>
            <Toggle
              enabled={autoAssign}
              onToggle={() => setAutoAssign(!autoAssign)}
            />
          </div>

          <div className="border-t border-[rgba(255,255,255,0.06)]" />

          {/* Email notifications */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                Email notifications for status changes
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                Send email to clients when appeal status changes
              </p>
            </div>
            <Toggle
              enabled={emailNotifications}
              onToggle={() => setEmailNotifications(!emailNotifications)}
            />
          </div>

          <div className="border-t border-[rgba(255,255,255,0.06)]" />

          {/* Require notes */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                Require notes on status updates
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                Agents must provide notes when changing appeal status
              </p>
            </div>
            <Toggle
              enabled={requireNotes}
              onToggle={() => setRequireNotes(!requireNotes)}
            />
          </div>

          <div className="border-t border-[rgba(255,255,255,0.06)]" />

          {/* Auto-deadline reminders */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                Auto-deadline reminders
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                Send reminder notifications before appeal deadlines
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="w-16 bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
              />
              <span className="text-sm text-white/50">days before</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ---- Notification Preferences ---- */}
      <GlassCard padding="md">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20">
            <Bell className="h-5 w-5 text-teal-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Notification Preferences
          </h2>
        </div>

        <p className="text-sm text-white/50 mb-4">
          Choose which events trigger admin notifications.
        </p>

        <div className="space-y-4">
          <Checkbox
            checked={notifNewClient}
            onChange={() => setNotifNewClient(!notifNewClient)}
            label="New client registration"
          />
          <Checkbox
            checked={notifStatusChange}
            onChange={() => setNotifStatusChange(!notifStatusChange)}
            label="Appeal status changes"
          />
          <Checkbox
            checked={notifHearingApproach}
            onChange={() => setNotifHearingApproach(!notifHearingApproach)}
            label="Hearing date approaching"
          />
          <Checkbox
            checked={notifResolved}
            onChange={() => setNotifResolved(!notifResolved)}
            label="Appeal resolved (won/lost)"
          />
        </div>
      </GlassCard>

      {/* Add Agent Modal */}
      <GlassModal
        isOpen={showAddAgent}
        onClose={() => setShowAddAgent(false)}
        title="Add New Agent"
        size="md"
      >
        <div className="space-y-4">
          <GlassInput
            label="Full Name"
            placeholder="Jane Doe"
            value={newAgent.name}
            onChange={(e) =>
              setNewAgent({ ...newAgent, name: e.target.value })
            }
          />
          <GlassInput
            label="Email"
            placeholder="jane.doe@lowproptax.com"
            type="email"
            value={newAgent.email}
            onChange={(e) =>
              setNewAgent({ ...newAgent, email: e.target.value })
            }
          />
          <GlassSelect
            label="Role"
            value={newAgent.role}
            onChange={(v) => setNewAgent({ ...newAgent, role: v })}
            options={[
              { value: "agent", label: "Agent" },
              { value: "manager", label: "Manager" },
              { value: "admin", label: "Admin" },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setShowAddAgent(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              disabled={addingAgent || !newAgent.name || !newAgent.email}
              onClick={handleAddAgent}
            >
              {addingAgent ? "Saving..." : "Save Agent"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
