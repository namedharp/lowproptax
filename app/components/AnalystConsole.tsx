"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createDemoResearch,
  demoCases,
  demoSimilarCases,
} from "@/lib/demo-data";
import type {
  AdminOverview,
  AppealCase,
  CaseDocument,
  EvidenceItem,
  ResearchHistoryItem,
  ResearchResult,
  SourceHealth,
} from "@/lib/types";
import {
  AdminWorkspace,
  PilotResearchLibrary,
  PilotSourceInventory,
} from "./PilotPanels";

type Section = "workspace" | "cases" | "research" | "sources" | "admin";

const quickQuestions = [
  "Which evidence most often changes the result in similar office appeals?",
  "What weaknesses should I address before filing this case?",
  "How have boards treated sustained vacancy near the lien date?",
];

export function AnalystConsole({
  analystName,
  initialCases,
  dataMode,
  analystRole,
}: {
  analystName: string;
  initialCases: AppealCase[];
  dataMode: "demo" | "live";
  analystRole: "admin" | "analyst";
}) {
  const [section, setSection] = useState<Section>("workspace");
  const [cases, setCases] = useState(
    initialCases.length || dataMode === "live" ? initialCases : demoCases,
  );
  const [selectedId, setSelectedId] = useState(
    initialCases[0]?.id ?? (dataMode === "demo" ? demoCases[0].id : ""),
  );
  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedId) ?? cases[0],
    [cases, selectedId],
  );
  const [question, setQuestion] = useState(
    "What evidence has driven successful outcomes in similar cases?",
  );
  const [result, setResult] = useState<ResearchResult>(() =>
    createDemoResearch(
      "What evidence has driven successful outcomes in similar cases?",
      initialCases[0] ?? demoCases[0],
    ),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [feedbackState, setFeedbackState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [sourceHealth, setSourceHealth] = useState<SourceHealth[]>([]);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/sources", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { sources?: SourceHealth[] };
        setSourceHealth(data.sources ?? []);
      })
      .catch(() => undefined);
    if (analystRole === "admin") {
      void fetch("/api/admin/overview", { signal: controller.signal })
        .then(async (response) => {
          if (response.ok) {
            setAdminOverview((await response.json()) as AdminOverview);
          }
        })
        .catch(() => undefined);
    }
    return () => controller.abort();
  }, [analystRole]);

  useEffect(() => {
    if (!selectedCase || dataMode !== "live") {
      return;
    }
    const controller = new AbortController();
    void Promise.all([
      fetch(
        `/api/research/history?appealId=${encodeURIComponent(selectedCase.id)}`,
        { signal: controller.signal },
      ).then(async (response) => {
        if (response.ok) {
          const data = (await response.json()) as {
            history?: ResearchHistoryItem[];
          };
          setHistory(data.history ?? []);
        }
      }),
      fetch(`/api/cases/${encodeURIComponent(selectedCase.id)}/evidence`, {
        signal: controller.signal,
      }).then(async (response) => {
        if (response.ok) {
          const data = (await response.json()) as { items?: EvidenceItem[] };
          setEvidenceItems(data.items ?? []);
        }
      }),
      fetch(`/api/cases/${encodeURIComponent(selectedCase.id)}/documents`, {
        signal: controller.signal,
      }).then(async (response) => {
        if (response.ok) {
          const data = (await response.json()) as {
            documents?: CaseDocument[];
          };
          setDocuments(data.documents ?? []);
        }
      }),
    ]).catch((loadError: unknown) => {
      if (
        !(loadError instanceof DOMException && loadError.name === "AbortError")
      ) {
        console.error("Case details could not be loaded", loadError);
      }
    });
    return () => controller.abort();
  }, [dataMode, selectedCase]);

  async function runResearch(nextQuestion: string) {
    if (!selectedCase) return;
    const cleanQuestion = nextQuestion.trim();
    if (cleanQuestion.length < 5) return;
    setLoading(true);
    setError("");
    setFeedbackState("idle");
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: cleanQuestion,
          appealId: selectedCase.id,
        }),
      });
      const data = (await response.json()) as ResearchResult & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Research could not be completed.");
      }
      setResult(data);
    } catch (researchError) {
      setError(
        researchError instanceof Error
          ? researchError.message
          : "Research could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runResearch(question);
  }

  function openCase(appealCase: AppealCase) {
    setSelectedId(appealCase.id);
    setQuestion("What evidence has driven successful outcomes in similar cases?");
    setResult(
      createDemoResearch(
        "What evidence has driven successful outcomes in similar cases?",
        appealCase,
      ),
    );
    setFeedbackState("idle");
    setSection("workspace");
  }

  async function saveCase(update: {
    requestedValue: number;
    caseTheory: string;
    confidence: number;
    status: AppealCase["status"];
  }) {
    if (!selectedCase) return;
    const response = await fetch(
      `/api/cases/${encodeURIComponent(selectedCase.id)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestedValue: update.requestedValue,
          caseTheory: update.caseTheory,
          confidence: update.confidence,
          status: update.status.toLowerCase().replaceAll(" ", "_"),
        }),
      },
    );
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Case update failed.");
    setCases((current) =>
      current.map((item) =>
        item.id === selectedCase.id
          ? {
              ...item,
              requestedValue: update.requestedValue,
              issue: update.caseTheory,
              confidence: update.confidence,
              status: update.status,
              lastActivity: "Just now",
            }
          : item,
      ),
    );
    setEditOpen(false);
  }

  async function submitFeedback(rating: -1 | 1) {
    if (!result.runId) {
      setFeedbackState("saved");
      return;
    }
    setFeedbackState("saving");
    const response = await fetch("/api/research/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: result.runId, rating }),
    });
    setFeedbackState(response.ok ? "saved" : "idle");
  }

  async function uploadDocument(file: File, title: string, documentType: string) {
    if (!selectedCase) return;
    const form = new FormData();
    form.set("file", file);
    form.set("title", title);
    form.set("documentType", documentType);
    const response = await fetch(
      `/api/cases/${encodeURIComponent(selectedCase.id)}/documents`,
      { method: "POST", body: form },
    );
    const data = (await response.json()) as {
      document?: CaseDocument;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Document upload failed.");
    }
    if (data.document) {
      setDocuments((current) => [data.document!, ...current]);
    }
  }

  async function createCase(input: {
    address: string;
    city: string;
    county: string;
    parcel: string;
    propertyType: string;
    taxYear: number;
    assessedValue: number;
    requestedValue: number;
    filingDeadline?: string;
  }) {
    const response = await fetch("/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await response.json()) as {
      case?: AppealCase;
      error?: string;
    };
    if (!response.ok || !data.case) {
      throw new Error(data.error ?? "Case creation failed.");
    }
    setCases((current) => [data.case!, ...current]);
    openCase(data.case);
    setCreateOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">LP</span>
          <span>
            <strong>LowPropTax</strong>
            <small>Appeal Intelligence</small>
          </span>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          <NavButton
            label="Case workspace"
            marker="01"
            active={section === "workspace"}
            onClick={() => setSection("workspace")}
          />
          <NavButton
            label="Active cases"
            marker="02"
            active={section === "cases"}
            onClick={() => setSection("cases")}
            count={String(cases.length)}
          />
          <NavButton
            label="Research library"
            marker="03"
            active={section === "research"}
            onClick={() => setSection("research")}
          />
          <NavButton
            label="Data sources"
            marker="04"
            active={section === "sources"}
            onClick={() => setSection("sources")}
          />
          {analystRole === "admin" && (
            <NavButton
              label="Administration"
              marker="05"
              active={section === "admin"}
              onClick={() => setSection("admin")}
            />
          )}
        </nav>

        <div className="sidebar-spacer" />
        <div className="corpus-card">
          <span className="status-dot" />
          <div>
            <strong>Sacramento research pilot</strong>
            <small>{corpusSummary(sourceHealth)}</small>
          </div>
        </div>
        <div className="analyst-card">
          <span className="avatar">{initials(analystName)}</span>
          <div>
            <strong>{analystName}</strong>
            <small>LPT {analystRole} · Sacramento</small>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search cases and parcels"
              placeholder="Search case, parcel, owner, or address"
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="topbar-actions">
            <span className="private-badge">
              <span className="status-dot" /> Private analyst workspace
            </span>
            <button className="icon-button" aria-label="Notifications">
              2
            </button>
          </div>
        </header>

        {section === "workspace" && selectedCase && (
          <Workspace
            appealCase={selectedCase}
            result={result}
            question={question}
            setQuestion={setQuestion}
            submitQuestion={submitQuestion}
            runResearch={runResearch}
            loading={loading}
            error={error}
            history={history}
            evidenceItems={evidenceItems}
            onEdit={() => setEditOpen(true)}
            submitFeedback={submitFeedback}
            feedbackState={feedbackState}
            documents={documents}
            uploadDocument={uploadDocument}
            sourceHealth={sourceHealth}
          />
        )}
        {section === "workspace" && !selectedCase && <EmptyPortfolio />}
        {section === "cases" && (
          <CaseList
            cases={cases}
            openCase={openCase}
            onAdd={() => setCreateOpen(true)}
          />
        )}
        {section === "research" && (
          <PilotResearchLibrary openWorkspace={() => setSection("workspace")} />
        )}
        {section === "sources" && (
          <PilotSourceInventory dataMode={dataMode} sources={sourceHealth} />
        )}
        {section === "admin" && analystRole === "admin" && (
          <AdminWorkspace
            overview={adminOverview}
            cases={cases}
            onRefresh={setAdminOverview}
            onCaseAssigned={(appealId, email) =>
              setCases((current) =>
                current.map((item) =>
                  item.id === appealId
                    ? {
                        ...item,
                        analyst: email,
                        assignedAnalystEmail: email,
                      }
                    : item,
                ),
              )
            }
          />
        )}
      </div>
      {editOpen && selectedCase && (
        <EditCaseDialog
          appealCase={selectedCase}
          onClose={() => setEditOpen(false)}
          onSave={saveCase}
        />
      )}
      {createOpen && (
        <CreateCaseDialog
          onClose={() => setCreateOpen(false)}
          onSave={createCase}
        />
      )}
    </div>
  );
}

function NavButton({
  label,
  marker,
  active,
  onClick,
  count,
}: {
  label: string;
  marker: string;
  active: boolean;
  onClick: () => void;
  count?: string;
}) {
  return (
    <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>
      <span className="nav-marker">{marker}</span>
      <span>{label}</span>
      {count && <span className="nav-count">{count}</span>}
    </button>
  );
}

function Workspace({
  appealCase,
  result,
  question,
  setQuestion,
  submitQuestion,
  runResearch,
  loading,
  error,
  history,
  evidenceItems,
  onEdit,
  submitFeedback,
  feedbackState,
  documents,
  uploadDocument,
  sourceHealth,
}: {
  appealCase: AppealCase;
  result: ResearchResult;
  question: string;
  setQuestion: (value: string) => void;
  submitQuestion: (event: FormEvent<HTMLFormElement>) => void;
  runResearch: (question: string) => Promise<void>;
  loading: boolean;
  error: string;
  history: ResearchHistoryItem[];
  evidenceItems: EvidenceItem[];
  onEdit: () => void;
  submitFeedback: (rating: -1 | 1) => Promise<void>;
  feedbackState: "idle" | "saving" | "saved";
  documents: CaseDocument[];
  uploadDocument: (
    file: File,
    title: string,
    documentType: string,
  ) => Promise<void>;
  sourceHealth: SourceHealth[];
}) {
  const savings = appealCase.assessedValue - appealCase.requestedValue;
  const reduction = Math.round((savings / appealCase.assessedValue) * 100);

  return (
    <main className="page">
      <div className="breadcrumbs">
        Active cases <span>/</span> {appealCase.caseNumber}
      </div>
      <div className="case-heading">
        <div>
          <div className="eyebrow">
            {appealCase.county} County · {appealCase.taxYear}
          </div>
          <h1>{appealCase.propertyName}</h1>
          <p>
            {appealCase.address} · APN {appealCase.parcel}
          </p>
        </div>
        <div className="case-actions">
          <span className={`case-status ${slug(appealCase.status)}`}>
            {appealCase.status}
          </span>
          {appealCase.canEdit !== false && (
            <button className="button secondary" onClick={onEdit}>
              Edit case
            </button>
          )}
          <button className="button secondary" onClick={() => window.print()}>
            Export brief
          </button>
        </div>
      </div>

      <section className="metric-grid" aria-label="Case metrics">
        <Metric label="Enrolled value" value={money(appealCase.assessedValue)} />
        <Metric label="Requested value" value={money(appealCase.requestedValue)} />
        <Metric
          label="Potential reduction"
          value={money(savings)}
          note={`${reduction}% below roll`}
          accent
        />
        <Metric
          label="Filing deadline"
          value={appealCase.deadline}
          note={deadlineNote(appealCase.deadline)}
        />
      </section>

      <div className="workspace-grid">
        <div className="workspace-primary">
          <section className="panel case-summary">
            <div className="panel-title-row">
              <div>
                <span className="section-kicker">Current theory</span>
                <h2>Case position</h2>
              </div>
              <span className="confidence-pill">
                {appealCase.confidence}% case readiness
              </span>
            </div>
            <p>{appealCase.issue}</p>
            <div className="case-facts">
              <Fact label="Property type" value={appealCase.propertyType} />
              <Fact label="Assigned analyst" value={appealCase.analyst} />
              <Fact label="Last activity" value={appealCase.lastActivity} />
            </div>
          </section>

          <section className="panel ask-panel">
            <div className="panel-title-row">
              <div>
                <span className="section-kicker">Evidence assistant</span>
                <h2>Ask this case</h2>
              </div>
              <span className={result.mode === "live" ? "mode live" : "mode"}>
                {result.mode === "live" ? "Live corpus" : "Demo corpus"}
              </span>
            </div>
            <form onSubmit={submitQuestion} className="question-form">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                aria-label="Ask a question about this case"
                placeholder="Ask about comparable outcomes, evidence, or board reasoning…"
                rows={3}
              />
              <div className="question-actions">
                <span>Uses case facts + cited public records</span>
                <button className="button primary" disabled={loading}>
                  {loading ? "Researching…" : "Research"}
                </button>
              </div>
            </form>
            <div className="quick-prompts">
              {quickQuestions.map((prompt) => (
                <button
                  key={prompt}
                  disabled={loading}
                  onClick={() => {
                    setQuestion(prompt);
                    void runResearch(prompt);
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
            {error && <div className="error-message">{error}</div>}
          </section>

          <ResearchAnswer
            result={result}
            loading={loading}
            submitFeedback={submitFeedback}
            feedbackState={feedbackState}
          />
          <SimilarCases result={result} />
        </div>

        <aside className="workspace-aside">
          <section className="panel readiness-card">
            <span className="section-kicker">Evidence readiness</span>
            <div className="readiness-score">
              <span>{result.confidence}</span>
              <small>/ 100</small>
            </div>
            <div className="progress-track">
              <span style={{ width: `${result.confidence}%` }} />
            </div>
            <p>
              {result.confidence >= 75
                ? "Retrieval coverage is strong. Resolve the remaining evidence gaps before finalizing the filing position."
                : "Retrieval coverage is limited. Broaden the evidence set before relying on this answer."}
            </p>
          </section>

          <section className="panel gap-card">
            <div className="panel-title-row">
              <div>
                <span className="section-kicker">Before filing</span>
                <h2>Evidence gaps</h2>
              </div>
              <span className="count-badge">
                {evidenceItems.length || result.gaps.length}
              </span>
            </div>
            <ol className="gap-list">
              {(evidenceItems.length
                ? evidenceItems.map((item) => item.label)
                : result.gaps
              ).map((gap, index) => (
                <li key={`${gap}-${index}`}>
                  <span>{index + 1}</span>
                  <p>{gap}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel history-card">
            <span className="section-kicker">Saved work</span>
            <h2>Research history</h2>
            {history.length ? (
              <div className="history-list">
                {history.slice(0, 4).map((item) => (
                  <article key={item.id}>
                    <strong>{item.question}</strong>
                    <small>
                      {new Date(item.createdAt).toLocaleDateString()} ·{" "}
                      {item.confidence}% confidence
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Live research answers will be saved here automatically.
              </p>
            )}
          </section>

          <section className="panel source-stack">
            <span className="section-kicker">Search scope</span>
            <h2>Sources used</h2>
            <SourceStat
              label="Public-record citations"
              value={String(
                result.citations.filter((item) => item.sourceType === "public")
                  .length,
              )}
            />
            <SourceStat
              label="Prior-appeal citations"
              value={String(
                result.citations.filter(
                  (item) => item.sourceType === "prior_appeal",
                ).length,
              )}
            />
            <SourceStat
              label="Private-case excerpts"
              value={String(
                result.citations.filter(
                  (item) => item.sourceType === "private_case",
                ).length,
              )}
            />
            <SourceStat label="County" value={appealCase.county} />
            <SourceStat
              label="Index state"
              value={
                sourceHealth.find((item) => item.id === "qdrant")?.status ??
                "checking"
              }
            />
            <p className="privacy-note">
              Private case facts are used for this search. They are never added
              to the public FOIA corpus.
            </p>
          </section>

          <DocumentPanel
            documents={documents}
            uploadDocument={uploadDocument}
            canEdit={appealCase.canEdit !== false}
          />
        </aside>
      </div>
    </main>
  );
}

function ResearchAnswer({
  result,
  loading,
  submitFeedback,
  feedbackState,
}: {
  result: ResearchResult;
  loading: boolean;
  submitFeedback: (rating: -1 | 1) => Promise<void>;
  feedbackState: "idle" | "saving" | "saved";
}) {
  return (
    <section className={loading ? "panel answer-panel loading" : "panel answer-panel"}>
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">Grounded response</span>
          <h2>Analyst answer</h2>
        </div>
        <span className="answer-confidence">
          {result.confidence}% evidence confidence
        </span>
      </div>
      {loading ? (
        <div className="loading-lines" aria-live="polite">
          <span />
          <span />
          <span />
          <p>Searching decisions, findings, and comparable outcomes…</p>
        </div>
      ) : (
        <>
          <p className="answer-copy">{result.answer}</p>
          {result.inferences.length > 0 && (
            <div className="answer-notes">
              <strong>Clearly marked inference</strong>
              <ul>
                {result.inferences.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="citation-grid">
            {result.citations.map((citation, index) => {
              const content = (
                <>
                  <div className="citation-meta">
                    <span>[{citation.sourceNumber ?? index + 1}]</span>
                    {citation.county} · {citation.documentType} ·{" "}
                    {sourceTypeLabel(citation.sourceType)}
                    {citation.pageStart
                      ? ` · p. ${citation.pageStart}${
                          citation.pageEnd &&
                          citation.pageEnd !== citation.pageStart
                            ? `–${citation.pageEnd}`
                            : ""
                        }`
                      : ""}
                  </div>
                  <strong>{citation.title}</strong>
                  <p>{citation.excerpt}</p>
                </>
              );
              return citation.sourceUrl ? (
                <a
                  className="citation"
                  href={citation.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  key={citation.id}
                >
                  {content}
                </a>
              ) : (
                <article className="citation" key={citation.id}>
                  {content}
                </article>
              );
            })}
          </div>
          {result.limitations.length > 0 && (
            <div className="answer-notes">
              <strong>Limitations</strong>
              <ul>
                {result.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="answer-disclaimer">
            Research aid only. Verify the cited record and valuation assumptions
            before using this analysis in a filing.
          </p>
          <div className="answer-feedback">
            <span>
              {feedbackState === "saved"
                ? "Feedback saved"
                : "Was this evidence useful?"}
            </span>
            <button
              disabled={feedbackState !== "idle"}
              onClick={() => void submitFeedback(1)}
            >
              Useful
            </button>
            <button
              disabled={feedbackState !== "idle"}
              onClick={() => void submitFeedback(-1)}
            >
              Needs work
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function SimilarCases({ result }: { result: ResearchResult }) {
  return (
    <section className="panel similar-panel">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">Outcome patterns</span>
          <h2>Most similar appeals</h2>
        </div>
        <button className="text-button">View all matches →</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Appeal</th>
              <th>Match</th>
              <th>Outcome</th>
              <th>Reduction</th>
              <th>Why it matters</th>
            </tr>
          </thead>
          <tbody>
            {result.similarCases.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.id}</strong>
                  <small>
                    {item.county} · {item.year} · {item.propertyType}
                  </small>
                </td>
                <td>
                  <span className="match-value">{item.match}%</span>
                </td>
                <td>
                  <span className={`outcome ${item.outcome.toLowerCase()}`}>
                    {item.outcome}
                  </span>
                </td>
                <td>
                  {item.reduction === null ? "—" : `${item.reduction}%`}
                </td>
                <td>{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CaseList({
  cases,
  openCase,
  onAdd,
}: {
  cases: AppealCase[];
  openCase: (item: AppealCase) => void;
  onAdd: () => void;
}) {
  const dueSoon = cases.filter((item) => {
    const days = daysUntil(item.deadline);
    return days >= 0 && days <= 30;
  }).length;
  const valueAtIssue = cases.reduce(
    (total, item) =>
      total + Math.max(0, item.assessedValue - item.requestedValue),
    0,
  );
  const ready = cases.filter((item) => item.status === "Ready to file").length;
  return (
    <main className="page standard-page">
      <div className="eyebrow">Sacramento County portfolio</div>
      <div className="page-heading">
        <div>
          <h1>Active cases</h1>
          <p>Prioritized by filing deadline and evidence readiness.</p>
        </div>
        <button className="button primary" onClick={onAdd}>
          Add case
        </button>
      </div>
      <section className="portfolio-metrics">
        <Metric
          label="Active cases"
          value={String(cases.length)}
          note="Sacramento County only"
        />
        <Metric label="Due in 30 days" value={String(dueSoon)} />
        <Metric label="Value at issue" value={money(valueAtIssue)} />
        <Metric
          label="Ready to file"
          value={String(ready)}
          note={
            cases.length
              ? `${Math.round((ready / cases.length) * 100)}% of portfolio`
              : "No cases loaded"
          }
          accent
        />
      </section>
      <section className="panel case-list">
        {cases.map((item) => (
          <button key={item.id} className="case-row" onClick={() => openCase(item)}>
            <span className="case-row-id">{item.caseNumber}</span>
            <span className="case-row-name">
              <strong>{item.propertyName}</strong>
              <small>
                {item.county} · {item.propertyType} · APN {item.parcel}
              </small>
            </span>
            <span className={`case-status ${slug(item.status)}`}>
              {item.status}
            </span>
            <span>
              <strong>{money(item.assessedValue)}</strong>
              <small>Enrolled value</small>
            </span>
            <span>
              <strong>{item.deadline}</strong>
              <small>Deadline</small>
            </span>
            <span className="row-arrow">→</span>
          </button>
        ))}
        {!cases.length && (
          <div className="empty-list">
            No active appeals are stored yet. Import or create the first case to
            begin.
          </div>
        )}
      </section>
    </main>
  );
}

function DocumentPanel({
  documents,
  uploadDocument,
  canEdit,
}: {
  documents: CaseDocument[];
  uploadDocument: (
    file: File,
    title: string,
    documentType: string,
  ) => Promise<void>;
  canEdit: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadDocument(file, file.name, inferUploadType(file.name));
      setFile(null);
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Document upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="panel document-card">
      <span className="section-kicker">Private case files</span>
      <h2>Documents</h2>
      <form onSubmit={submit} className="document-upload">
        <label>
          <input
            type="file"
            accept=".pdf,.docx,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span>{file ? file.name : "Choose a case document"}</span>
        </label>
        <button
          className="button primary"
          disabled={!canEdit || !file || uploading}
        >
          {uploading ? "Uploading…" : canEdit ? "Upload" : "Assigned analyst only"}
        </button>
      </form>
      {!canEdit && (
        <p className="empty-copy">
          Only the assigned analyst or an administrator can add files.
        </p>
      )}
      {error && <p className="document-error">{error}</p>}
      <div className="document-list">
        {documents.slice(0, 5).map((document) => (
          <article key={document.id}>
            <span>{document.documentType.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{document.title}</strong>
              <small>{new Date(document.createdAt).toLocaleDateString()}</small>
            </div>
          </article>
        ))}
        {!documents.length && (
          <p>Files uploaded here remain separate from the public FOIA corpus.</p>
        )}
      </div>
    </section>
  );
}

function CreateCaseDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: {
    address: string;
    city: string;
    county: string;
    parcel: string;
    propertyType: string;
    taxYear: number;
    assessedValue: number;
    requestedValue: number;
    filingDeadline?: string;
  }) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      address: String(form.get("address") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      county: String(form.get("county") ?? "").trim(),
      parcel: String(form.get("parcel") ?? "").trim(),
      propertyType: String(form.get("propertyType") ?? "").trim(),
      taxYear: Number(form.get("taxYear")),
      assessedValue: Number(form.get("assessedValue")),
      requestedValue: Number(form.get("requestedValue")),
      filingDeadline: String(form.get("filingDeadline") ?? "") || undefined,
    };
    if (
      !input.address ||
      !input.city ||
      !input.county ||
      !input.parcel ||
      !input.propertyType ||
      !Number.isFinite(input.assessedValue) ||
      !Number.isFinite(input.requestedValue)
    ) {
      setError("Complete all required case fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(input);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Case creation failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-case-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <span className="section-kicker">New appeal</span>
            <h2 id="create-case-title">Create analyst case</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={submit} className="edit-form">
          <label className="full-field">
            Property address
            <input name="address" required maxLength={500} />
          </label>
          <label>
            City
            <input name="city" required maxLength={200} />
          </label>
          <label>
            County
            <input name="county" value="Sacramento" readOnly />
          </label>
          <label>
            Parcel number
            <input name="parcel" required maxLength={200} />
          </label>
          <label>
            Property type
            <select name="propertyType" defaultValue="Office">
              <option>Office</option>
              <option>Retail</option>
              <option>Industrial</option>
              <option>Multifamily</option>
              <option>Hospitality</option>
              <option>Vacant land</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Tax year
            <input
              name="taxYear"
              type="number"
              min="2000"
              max="2100"
              defaultValue={new Date().getFullYear()}
              required
            />
          </label>
          <label>
            Filing deadline
            <input name="filingDeadline" type="date" />
          </label>
          <label>
            Enrolled value
            <input name="assessedValue" type="number" min="0" required />
          </label>
          <label>
            Requested value
            <input name="requestedValue" type="number" min="0" required />
          </label>
          {error && <div className="error-message full-field">{error}</div>}
          <div className="dialog-actions full-field">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="button primary" disabled={saving}>
              {saving ? "Creating…" : "Create case"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function EditCaseDialog({
  appealCase,
  onClose,
  onSave,
}: {
  appealCase: AppealCase;
  onClose: () => void;
  onSave: (update: {
    requestedValue: number;
    caseTheory: string;
    confidence: number;
    status: AppealCase["status"];
  }) => Promise<void>;
}) {
  const [requestedValue, setRequestedValue] = useState(
    String(appealCase.requestedValue),
  );
  const [caseTheory, setCaseTheory] = useState(appealCase.issue);
  const [confidence, setConfidence] = useState(appealCase.confidence);
  const [status, setStatus] = useState<AppealCase["status"]>(appealCase.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericValue = Number(requestedValue);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setError("Enter a valid requested value.");
      return;
    }
    if (caseTheory.trim().length < 20) {
      setError("Document a more complete case position before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        requestedValue: numericValue,
        caseTheory: caseTheory.trim(),
        confidence,
        status,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Case update failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-case-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <span className="section-kicker">{appealCase.caseNumber}</span>
            <h2 id="edit-case-title">Update case position</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={submit} className="edit-form">
          <label>
            Workflow status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AppealCase["status"])
              }
            >
              <option>Researching</option>
              <option>Evidence review</option>
              <option>Ready to file</option>
            </select>
          </label>
          <label>
            Requested value
            <input
              type="number"
              min="0"
              step="1000"
              value={requestedValue}
              onChange={(event) => setRequestedValue(event.target.value)}
            />
          </label>
          <label className="full-field">
            Case position
            <textarea
              rows={6}
              maxLength={5000}
              value={caseTheory}
              onChange={(event) => setCaseTheory(event.target.value)}
            />
          </label>
          <label className="full-field range-field">
            Analyst readiness
            <span>{confidence}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={confidence}
              onChange={(event) => setConfidence(Number(event.target.value))}
            />
          </label>
          {error && <div className="error-message full-field">{error}</div>}
          <div className="dialog-actions full-field">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="button primary" disabled={saving}>
              {saving ? "Saving…" : "Save case"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function EmptyPortfolio() {
  return (
    <main className="page standard-page">
      <section className="panel empty-portfolio">
        <span className="section-kicker">Live data connected</span>
        <h1>No active appeals yet</h1>
        <p>
          The connected Supabase project currently contains the case schema but
          no appeal rows. Import the portal appeal feed or add the first case to
          begin live research.
        </p>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "metric accent" : "metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SourceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="source-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function corpusSummary(sources: SourceHealth[]): string {
  const qdrant = sources.find((item) => item.id === "qdrant");
  if (!qdrant) return "Checking live index health";
  if (qdrant.recordCount !== undefined) {
    return `${qdrant.recordCount.toLocaleString()} indexed records`;
  }
  return qdrant.detail;
}

function deadlineNote(value: string): string {
  const days = daysUntil(value);
  if (!Number.isFinite(days)) return "Deadline not scheduled";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  return `${days} days remaining`;
}

function daysUntil(value: string): number {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function sourceTypeLabel(value: string): string {
  if (value === "prior_appeal") return "prior appeal";
  if (value === "private_case") return "private case";
  return "public record";
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1000000 ? "compact" : "standard",
  }).format(value);
}

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function inferUploadType(fileName: string) {
  const name = fileName.toLowerCase();
  if (name.includes("rent")) return "rent_roll";
  if (name.includes("income") || name.includes("operating")) {
    return "operating_statement";
  }
  if (name.includes("appraisal")) return "appraisal";
  if (name.includes("photo")) return "property_photos";
  return "other";
}

export const previewSimilarCases = demoSimilarCases;
