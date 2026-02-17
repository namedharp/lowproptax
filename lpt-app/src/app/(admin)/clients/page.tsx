"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Eye,
  Pencil,
  Home,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassTextarea } from "@/components/ui/GlassTextarea";
import { mockClients, mockAgents, mockAdminAppeals, mockProperties } from "@/lib/data";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Client } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Agent name resolver                                                */
/* ------------------------------------------------------------------ */
function agentName(agentId: string): string {
  return mockAgents.find((a) => a.id === agentId)?.name ?? agentId;
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function AdminClientsPage() {
  /* --- Filters --- */
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  /* --- Expanded row --- */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* --- Add Client Modal --- */
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    type: "homeowner",
    assignedAgent: "agent-001",
    notes: "",
  });

  /* --- Filtered clients --- */
  const filtered = useMemo(() => {
    return mockClients.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || c.type === typeFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchAgent =
        agentFilter === "all" || c.assignedAgent === agentFilter;
      return matchSearch && matchType && matchStatus && matchAgent;
    });
  }, [search, typeFilter, statusFilter, agentFilter]);

  /* --- Get properties and appeals for a client --- */
  function clientProperties(clientName: string) {
    return mockProperties.filter((p) => p.owner === clientName);
  }
  function clientAppeals(clientId: string) {
    return mockAdminAppeals.filter((a) => a.clientId === clientId);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Client Management</h1>
        <GlassButton
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Add Client
        </GlassButton>
      </div>

      {/* Filters */}
      <GlassCard variant="light" padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <GlassInput
            placeholder="Search by name or email..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <GlassSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All Types" },
              { value: "homeowner", label: "Homeowner" },
              { value: "investor", label: "Investor" },
            ]}
          />
          <GlassSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "pending", label: "Pending" },
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
        </div>
      </GlassCard>

      {/* Clients Table */}
      <div className="overflow-hidden rounded-[16px] bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.1)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden md:table-cell">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden lg:table-cell">
                  Properties
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden lg:table-cell">
                  Appeals
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden xl:table-cell">
                  Total Savings
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80 hidden xl:table-cell">
                  Agent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const isExpanded = expandedId === client.id;
                return (
                  <ClientRow
                    key={client.id}
                    client={client}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedId(isExpanded ? null : client.id)
                    }
                    properties={clientProperties(client.name)}
                    appeals={clientAppeals(client.id)}
                  />
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-sm text-white/40"
                  >
                    No clients match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      <GlassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Client"
        size="lg"
      >
        <div className="space-y-4">
          <GlassInput
            label="Full Name"
            placeholder="John Smith"
            value={newClient.name}
            onChange={(e) =>
              setNewClient({ ...newClient, name: e.target.value })
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Email"
              placeholder="john@email.com"
              type="email"
              value={newClient.email}
              onChange={(e) =>
                setNewClient({ ...newClient, email: e.target.value })
              }
            />
            <GlassInput
              label="Phone"
              placeholder="(555) 555-0000"
              type="tel"
              value={newClient.phone}
              onChange={(e) =>
                setNewClient({ ...newClient, phone: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassSelect
              label="Client Type"
              value={newClient.type}
              onChange={(v) => setNewClient({ ...newClient, type: v })}
              options={[
                { value: "homeowner", label: "Homeowner" },
                { value: "investor", label: "Investor" },
              ]}
            />
            <GlassSelect
              label="Assigned Agent"
              value={newClient.assignedAgent}
              onChange={(v) =>
                setNewClient({ ...newClient, assignedAgent: v })
              }
              options={mockAgents.map((a) => ({
                value: a.id,
                label: a.name,
              }))}
            />
          </div>
          <GlassTextarea
            label="Notes"
            placeholder="Any notes about this client..."
            value={newClient.notes}
            onChange={(e) =>
              setNewClient({ ...newClient, notes: e.target.value })
            }
          />
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => {
                setShowAddModal(false);
                setNewClient({
                  name: "",
                  email: "",
                  phone: "",
                  type: "homeowner",
                  assignedAgent: "agent-001",
                  notes: "",
                });
              }}
            >
              Save Client
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

/* ================================================================== */
/*  Client Row Component                                               */
/* ================================================================== */
function ClientRow({
  client,
  isExpanded,
  onToggle,
  properties,
  appeals,
}: {
  client: Client;
  isExpanded: boolean;
  onToggle: () => void;
  properties: typeof mockProperties;
  appeals: typeof mockAdminAppeals;
}) {
  const statusVariant =
    client.status === "active"
      ? "success"
      : client.status === "pending"
        ? "warning"
        : "default";

  const typeVariant = client.type === "homeowner" ? "teal" : "info";

  return (
    <>
      <tr className="border-b border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {client.type === "investor" ? (
              <Building2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Home className="h-4 w-4 text-teal-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-white">
              {client.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-white/70">{client.email}</td>
        <td className="px-4 py-3 text-sm text-white/70 hidden md:table-cell">
          {client.phone}
        </td>
        <td className="px-4 py-3">
          <GlassBadge variant={typeVariant}>{client.type}</GlassBadge>
        </td>
        <td className="px-4 py-3 text-sm text-white/80 hidden lg:table-cell">
          {client.propertiesCount}
        </td>
        <td className="px-4 py-3 text-sm text-white/80 hidden lg:table-cell">
          {client.activeAppeals}
        </td>
        <td className="px-4 py-3 text-sm text-white/80 hidden xl:table-cell">
          {formatCurrency(client.totalSavings)}
        </td>
        <td className="px-4 py-3">
          <GlassBadge variant={statusVariant}>{client.status}</GlassBadge>
        </td>
        <td className="px-4 py-3 text-sm text-white/70 hidden xl:table-cell">
          {agentName(client.assignedAgent)}
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
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Detail */}
      {isExpanded && (
        <tr>
          <td colSpan={10} className="p-0">
            <div className="bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.1)] px-6 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Contact Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/70">
                      <span className="text-white/40">Email: </span>
                      {client.email}
                    </p>
                    <p className="text-white/70">
                      <span className="text-white/40">Phone: </span>
                      {client.phone}
                    </p>
                    <p className="text-white/70">
                      <span className="text-white/40">Agent: </span>
                      {agentName(client.assignedAgent)}
                    </p>
                    <p className="text-white/70">
                      <span className="text-white/40">Since: </span>
                      {client.createdAt}
                    </p>
                    {client.notes && (
                      <p className="text-white/50 italic mt-2">
                        {client.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Properties */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Properties ({properties.length})
                  </h4>
                  {properties.length > 0 ? (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {properties.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-2.5"
                        >
                          <p className="text-xs font-medium text-white/90 truncate">
                            {p.address}
                          </p>
                          <p className="text-[11px] text-white/50">
                            {p.city}, {p.state} &mdash;{" "}
                            {formatCurrency(p.assessedValue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">
                      No properties on file.
                    </p>
                  )}
                </div>

                {/* Appeals */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Appeals ({appeals.length})
                  </h4>
                  {appeals.length > 0 ? (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {appeals.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] p-2.5 flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white/90 truncate">
                              {a.propertyAddress.split(",")[0]}
                            </p>
                            <p className="text-[11px] text-white/50">
                              Est. savings: {formatCurrency(a.estimatedSavings)}
                            </p>
                          </div>
                          <GlassBadge
                            variant={
                              a.status === "won"
                                ? "success"
                                : a.status === "lost"
                                  ? "error"
                                  : "info"
                            }
                          >
                            {a.status}
                          </GlassBadge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">No appeals.</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <GlassButton variant="primary" size="sm" icon={<FileText className="h-3.5 w-3.5" />}>
                  Start Appeal
                </GlassButton>
                <GlassButton variant="secondary" size="sm" icon={<Building2 className="h-3.5 w-3.5" />}>
                  Add Property
                </GlassButton>
                <GlassButton variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />}>
                  Deactivate
                </GlassButton>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
