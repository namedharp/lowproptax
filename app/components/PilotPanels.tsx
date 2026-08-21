"use client";

import { FormEvent, useState } from "react";
import type {
  AdminOverview,
  AppealCase,
  ResearchLibraryItem,
  SourceHealth,
} from "@/lib/types";

export function PilotResearchLibrary({
  openWorkspace,
}: {
  openWorkspace: () => void;
}) {
  const [query, setQuery] = useState("economic obsolescence evidence");
  const [taxYear, setTaxYear] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [outcome, setOutcome] = useState("");
  const [items, setItems] = useState<ResearchLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ query: query.trim() });
      if (taxYear) params.set("taxYear", taxYear);
      if (propertyType) params.set("propertyType", propertyType);
      if (documentType) params.set("documentType", documentType);
      if (outcome) params.set("outcome", outcome);
      const response = await fetch(`/api/research/library?${params}`);
      const data = (await response.json()) as {
        items?: ResearchLibraryItem[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Search failed.");
      setItems(data.items ?? []);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "The library could not be searched.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page standard-page">
      <div className="eyebrow">Sacramento public-record intelligence</div>
      <div className="page-heading">
        <div>
          <h1>Research library</h1>
          <p>
            Search findings, decisions, guidance, and prior outcomes without a
            case attached.
          </p>
        </div>
      </div>
      <section className="library-hero">
        <span>County locked to Sacramento</span>
        <form onSubmit={search} className="library-search-form">
          <input
            aria-label="Search Sacramento evidence"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search evidence, findings, issues, or outcomes"
          />
          <div className="library-filters">
            <input
              aria-label="Tax year"
              value={taxYear}
              onChange={(event) => setTaxYear(event.target.value)}
              placeholder="Tax year"
            />
            <select
              aria-label="Property type"
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value)}
            >
              <option value="">All property types</option>
              <option>Office</option>
              <option>Retail</option>
              <option>Industrial</option>
              <option>Multifamily</option>
              <option>Hospitality</option>
            </select>
            <select
              aria-label="Document type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
            >
              <option value="">All document types</option>
              <option value="findings">Findings</option>
              <option value="decision">Decision</option>
              <option value="procedural_guidance">Guidance</option>
              <option value="appeal_statistics">Statistics</option>
            </select>
            <select
              aria-label="Outcome"
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
            >
              <option value="">All outcomes</option>
              <option>Win</option>
              <option>Loss</option>
              <option>Withdrawn</option>
              <option>Pending</option>
            </select>
          </div>
          <div className="question-actions">
            <button className="button primary" disabled={loading}>
              {loading ? "Searching…" : "Search library"}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={openWorkspace}
            >
              Ask with a case
            </button>
          </div>
        </form>
      </section>
      {error && <div className="error-message">{error}</div>}
      <div className="library-grid">
        {items.map((citation) => (
          <article className="panel library-card" key={citation.id}>
            <span className="section-kicker">
              Sacramento · {citation.documentType} ·{" "}
              {sourceTypeLabel(citation.sourceType)}
            </span>
            <h3>{citation.title}</h3>
            <p>{citation.excerpt}</p>
            <small>
              {citation.pageStart ? `Page ${citation.pageStart}` : "Page not stored"}
              {citation.taxYear ? ` · ${citation.taxYear}` : ""}
              {citation.outcome ? ` · ${citation.outcome}` : ""}
            </small>
          </article>
        ))}
        {!items.length && !loading && (
          <article className="panel library-card">
            <span className="section-kicker">Ready to search</span>
            <h3>Find Sacramento County evidence</h3>
            <p>
              Run a search to retrieve hybrid dense and BM25 matches from public
              records and prior appeals.
            </p>
          </article>
        )}
      </div>
    </main>
  );
}

export function PilotSourceInventory({
  dataMode,
  sources,
}: {
  dataMode: "demo" | "live";
  sources: SourceHealth[];
}) {
  return (
    <main className="page standard-page">
      <div className="eyebrow">System stewardship</div>
      <div className="page-heading">
        <div>
          <h1>Data sources</h1>
          <p>Live status of the systems behind analyst answers.</p>
        </div>
      </div>
      <section className="panel source-table">
        {sources.map((source) => (
          <div className="source-row" key={source.id}>
            <span className="source-icon">{source.label.slice(0, 1)}</span>
            <span>
              <strong>{source.label}</strong>
              <small>{source.detail}</small>
            </span>
            <span>
              {source.recordCount === undefined
                ? "Count pending"
                : `${source.recordCount.toLocaleString()} records`}
            </span>
            <span
              className={
                source.status === "healthy" ? "source-ready" : "source-next"
              }
            >
              {source.status}
            </span>
          </div>
        ))}
        {!sources.length && (
          <div className="empty-list">Source health is being checked.</div>
        )}
      </section>
      <section className="quality-banner">
        <div>
          <span className="section-kicker">Pilot safeguards</span>
          <h2>Sacramento-only indexing with private/public separation.</h2>
          <p>
            {dataMode === "live"
              ? "Health comes from live synchronization and collection records."
              : "Demo mode remains active until rotated secrets and the staging migration are validated."}
          </p>
        </div>
        <span className="quality-stat">
          3<small>separate evidence scopes</small>
        </span>
      </section>
    </main>
  );
}

export function AdminWorkspace({
  overview,
  cases,
  onRefresh,
  onCaseAssigned,
}: {
  overview: AdminOverview | null;
  cases: AppealCase[];
  onRefresh: (overview: AdminOverview | null) => void;
  onCaseAssigned: (appealId: string, email: string) => void;
}) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/overview");
    if (response.ok) onRefresh((await response.json()) as AdminOverview);
  }

  async function synchronize(source: "sacramento_lambda" | "sacramento_drive") {
    setBusy(source);
    setMessage("");
    const response = await fetch("/api/admin/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setMessage(
      response.ok
        ? data.message ?? "Synchronization completed."
        : data.error ?? "Synchronization failed.",
    );
    setBusy("");
    if (response.ok) await refresh();
  }

  async function saveAnalyst(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("analyst");
    const response = await fetch("/api/admin/analysts", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        displayName: form.get("displayName"),
        role: form.get("role"),
        active: true,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setMessage(
      response.ok ? "Analyst account saved." : data.error ?? "Save failed.",
    );
    setBusy("");
    if (response.ok) {
      event.currentTarget.reset();
      await refresh();
    }
  }

  async function toggleAnalyst(
    analyst: NonNullable<AdminOverview>["analysts"][number],
  ) {
    setBusy(analyst.email);
    const response = await fetch("/api/admin/analysts", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: analyst.email,
        displayName: analyst.displayName,
        role: analyst.role,
        active: !analyst.active,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setMessage(
      response.ok
        ? `Analyst ${analyst.active ? "deactivated" : "activated"}.`
        : data.error ?? "Update failed.",
    );
    setBusy("");
    if (response.ok) await refresh();
  }

  async function assignCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const appealId = String(form.get("appealId") ?? "");
    const analystEmail = String(form.get("analystEmail") ?? "");
    setBusy("assignment");
    const response = await fetch("/api/admin/assignments", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appealId, analystEmail }),
    });
    const data = (await response.json()) as { error?: string };
    setMessage(
      response.ok ? "Case assignment saved." : data.error ?? "Assignment failed.",
    );
    setBusy("");
    if (response.ok) onCaseAssigned(appealId, analystEmail);
  }

  return (
    <main className="page standard-page">
      <div className="eyebrow">Administrator controls</div>
      <div className="page-heading">
        <div>
          <h1>Sacramento pilot administration</h1>
          <p>Manage analysts, synchronization, OCR failures, and live aliases.</p>
        </div>
      </div>
      {message && <div className="quality-banner">{message}</div>}
      <section className="portfolio-metrics">
        <AdminMetric label="Analysts" value={overview?.analysts.length ?? 0} />
        <AdminMetric label="OCR failures" value={overview?.failedOcrJobs ?? 0} />
        <AdminMetric
          label="Live aliases"
          value={
            overview?.collections.filter((item) => item.status === "ready").length ??
            0
          }
          note="of 3 required"
        />
      </section>
      <section className="panel source-table">
        {(overview?.collections ?? []).map((collection) => (
          <div className="source-row" key={collection.alias}>
            <span className="source-icon">Q</span>
            <span>
              <strong>{collection.alias}</strong>
              <small>{collection.target ?? "No alias target"}</small>
            </span>
            <span>
              {collection.pointCount === undefined
                ? "Count pending"
                : `${collection.pointCount.toLocaleString()} points`}
            </span>
            <span
              className={
                collection.status === "ready" ? "source-ready" : "source-next"
              }
            >
              {collection.status}
            </span>
          </div>
        ))}
      </section>
      <div className="admin-grid">
        <section className="panel">
          <span className="section-kicker">Synchronization</span>
          <h2>Run sources on demand</h2>
          <div className="dialog-actions">
            <button
              className="button primary"
              disabled={Boolean(busy)}
              onClick={() => void synchronize("sacramento_lambda")}
            >
              {busy === "sacramento_lambda" ? "Syncing…" : "Sync appeals"}
            </button>
            <button
              className="button secondary"
              disabled={Boolean(busy)}
              onClick={() => void synchronize("sacramento_drive")}
            >
              {busy === "sacramento_drive" ? "Queueing…" : "Queue Drive OCR"}
            </button>
          </div>
        </section>
        <section className="panel">
          <span className="section-kicker">Team access</span>
          <h2>Add or update an analyst</h2>
          <form onSubmit={saveAnalyst} className="admin-form">
            <input name="displayName" placeholder="Display name" required />
            <input name="email" type="email" placeholder="Email" required />
            <select name="role" defaultValue="analyst">
              <option value="analyst">Analyst</option>
              <option value="admin">Administrator</option>
            </select>
            <button className="button primary" disabled={Boolean(busy)}>
              {busy === "analyst" ? "Saving…" : "Save analyst"}
            </button>
          </form>
        </section>
        <section className="panel">
          <span className="section-kicker">Assignments</span>
          <h2>Assign a case</h2>
          <form onSubmit={assignCase} className="admin-form">
            <select name="appealId" required defaultValue="">
              <option value="" disabled>
                Choose a case
              </option>
              {cases.map((appealCase) => (
                <option value={appealCase.id} key={appealCase.id}>
                  {appealCase.caseNumber} · {appealCase.propertyName}
                </option>
              ))}
            </select>
            <select name="analystEmail" required defaultValue="">
              <option value="" disabled>
                Choose an analyst
              </option>
              {(overview?.analysts ?? [])
                .filter((analyst) => analyst.active)
                .map((analyst) => (
                  <option value={analyst.email} key={analyst.email}>
                    {analyst.displayName}
                  </option>
                ))}
            </select>
            <button className="button primary" disabled={Boolean(busy)}>
              {busy === "assignment" ? "Assigning…" : "Save assignment"}
            </button>
          </form>
        </section>
      </div>
      <section className="panel source-table">
        {(overview?.analysts ?? []).map((analyst) => (
          <div className="source-row" key={analyst.email}>
            <span className="source-icon">
              {analyst.displayName.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{analyst.displayName}</strong>
              <small>{analyst.email}</small>
            </span>
            <span>{analyst.role}</span>
            <button
              className={analyst.active ? "source-ready" : "source-next"}
              disabled={Boolean(busy)}
              onClick={() => void toggleAnalyst(analyst)}
            >
              {busy === analyst.email
                ? "saving"
                : analyst.active
                  ? "deactivate"
                  : "activate"}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}

function AdminMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function sourceTypeLabel(
  value: ResearchLibraryItem["sourceType"],
): string {
  return value === "prior_appeal"
    ? "prior appeal"
    : value === "private_case"
      ? "private case"
      : "public record";
}
