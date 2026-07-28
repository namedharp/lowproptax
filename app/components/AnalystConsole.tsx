"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  createDemoResearch,
  demoCases,
  demoCitations,
  demoSimilarCases,
} from "@/lib/demo-data";
import type { AppealCase, ResearchResult } from "@/lib/types";

type Section = "workspace" | "cases" | "research" | "sources";

const quickQuestions = [
  "Which evidence most often changes the result in similar office appeals?",
  "What weaknesses should I address before filing this case?",
  "How have boards treated sustained vacancy near the lien date?",
];

export function AnalystConsole({ analystName }: { analystName: string }) {
  const [section, setSection] = useState<Section>("workspace");
  const [selectedId, setSelectedId] = useState(demoCases[0].id);
  const selectedCase = useMemo(
    () => demoCases.find((item) => item.id === selectedId) ?? demoCases[0],
    [selectedId],
  );
  const [question, setQuestion] = useState(
    "What evidence has driven successful outcomes in similar cases?",
  );
  const [result, setResult] = useState<ResearchResult>(() =>
    createDemoResearch(
      "What evidence has driven successful outcomes in similar cases?",
      demoCases[0],
    ),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runResearch(nextQuestion: string) {
    const cleanQuestion = nextQuestion.trim();
    if (cleanQuestion.length < 5) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: cleanQuestion,
          appealCase: selectedCase,
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
    setSection("workspace");
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
            count="18"
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
        </nav>

        <div className="sidebar-spacer" />
        <div className="corpus-card">
          <span className="status-dot" />
          <div>
            <strong>Research corpus ready</strong>
            <small>72,092 indexed records</small>
          </div>
        </div>
        <div className="analyst-card">
          <span className="avatar">{initials(analystName)}</span>
          <div>
            <strong>{analystName}</strong>
            <small>LPT analyst · California</small>
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

        {section === "workspace" && (
          <Workspace
            appealCase={selectedCase}
            result={result}
            question={question}
            setQuestion={setQuestion}
            submitQuestion={submitQuestion}
            runResearch={runResearch}
            loading={loading}
            error={error}
          />
        )}
        {section === "cases" && <CaseList openCase={openCase} />}
        {section === "research" && (
          <ResearchLibrary openWorkspace={() => setSection("workspace")} />
        )}
        {section === "sources" && <SourceInventory />}
      </div>
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
}: {
  appealCase: AppealCase;
  result: ResearchResult;
  question: string;
  setQuestion: (value: string) => void;
  submitQuestion: (event: FormEvent<HTMLFormElement>) => void;
  runResearch: (question: string) => Promise<void>;
  loading: boolean;
  error: string;
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
          note="21 days remaining"
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

          <ResearchAnswer result={result} loading={loading} />
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
              Strong comparable pattern. Resolve the missing records before
              finalizing the filing position.
            </p>
          </section>

          <section className="panel gap-card">
            <div className="panel-title-row">
              <div>
                <span className="section-kicker">Before filing</span>
                <h2>Evidence gaps</h2>
              </div>
              <span className="count-badge">{result.gaps.length}</span>
            </div>
            <ol className="gap-list">
              {result.gaps.map((gap, index) => (
                <li key={gap}>
                  <span>{index + 1}</span>
                  <p>{gap}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel source-stack">
            <span className="section-kicker">Search scope</span>
            <h2>Sources used</h2>
            <SourceStat label="Public-record passages" value="69,602" />
            <SourceStat label="Prior appeal outcomes" value="2,490" />
            <SourceStat label="County" value={appealCase.county} />
            <p className="privacy-note">
              Private case facts are used for this search. They are never added
              to the public FOIA corpus.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function ResearchAnswer({
  result,
  loading,
}: {
  result: ResearchResult;
  loading: boolean;
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
          <div className="citation-grid">
            {result.citations.map((citation, index) => {
              const content = (
                <>
                  <div className="citation-meta">
                    <span>[{index + 1}]</span>
                    {citation.county} · {citation.documentType}
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
          <p className="answer-disclaimer">
            Research aid only. Verify the cited record and valuation assumptions
            before using this analysis in a filing.
          </p>
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

function CaseList({ openCase }: { openCase: (item: AppealCase) => void }) {
  return (
    <main className="page standard-page">
      <div className="eyebrow">California portfolio</div>
      <div className="page-heading">
        <div>
          <h1>Active cases</h1>
          <p>Prioritized by filing deadline and evidence readiness.</p>
        </div>
        <button className="button primary">Add case</button>
      </div>
      <section className="portfolio-metrics">
        <Metric label="Active cases" value="18" note="Across 7 counties" />
        <Metric label="Due in 30 days" value="6" note="2 need evidence" />
        <Metric label="Value at issue" value="$38.4M" />
        <Metric label="Ready to file" value="9" note="50% of portfolio" accent />
      </section>
      <section className="panel case-list">
        {demoCases.map((item) => (
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
      </section>
    </main>
  );
}

function ResearchLibrary({ openWorkspace }: { openWorkspace: () => void }) {
  return (
    <main className="page standard-page">
      <div className="eyebrow">Public-record intelligence</div>
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
        <span>Search 72,092 indexed records</span>
        <h2>What have California boards accepted as proof of economic obsolescence?</h2>
        <button className="button primary" onClick={openWorkspace}>
          Start case-grounded research
        </button>
      </section>
      <div className="library-grid">
        {demoCitations.map((citation) => (
          <article className="panel library-card" key={citation.id}>
            <span className="section-kicker">
              {citation.county} · {citation.documentType}
            </span>
            <h3>{citation.title}</h3>
            <p>{citation.excerpt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

function SourceInventory() {
  const sources = [
    {
      name: "FOIA research corpus",
      system: "Qdrant · lpt_research",
      records: "69,602 passages",
      state: "Ready",
    },
    {
      name: "Prior appeal outcomes",
      system: "Qdrant · appeal_comps",
      records: "2,490 appeals",
      state: "Ready",
    },
    {
      name: "Active case records",
      system: "Supabase",
      records: "Private analyst data",
      state: "Configure",
    },
    {
      name: "FOIA source files",
      system: "Google Drive",
      records: "County-organized archive",
      state: "Connector",
    },
  ];
  return (
    <main className="page standard-page">
      <div className="eyebrow">System stewardship</div>
      <div className="page-heading">
        <div>
          <h1>Data sources</h1>
          <p>One view of the evidence systems behind analyst answers.</p>
        </div>
      </div>
      <section className="panel source-table">
        {sources.map((source) => (
          <div className="source-row" key={source.name}>
            <span className="source-icon">{source.name.slice(0, 1)}</span>
            <span>
              <strong>{source.name}</strong>
              <small>{source.system}</small>
            </span>
            <span>{source.records}</span>
            <span className={source.state === "Ready" ? "source-ready" : "source-next"}>
              {source.state}
            </span>
          </div>
        ))}
      </section>
      <section className="quality-banner">
        <div>
          <span className="section-kicker">Data quality checkpoint</span>
          <h2>Normalize county names and document types before automation.</h2>
          <p>
            The current research corpus contains inconsistent county labels and
            many records without a document type. Answers remain citation-first
            while that cleanup is completed.
          </p>
        </div>
        <span className="quality-stat">52K<small>records need classification</small></span>
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

export const previewSimilarCases = demoSimilarCases;
