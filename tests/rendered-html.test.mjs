import assert from "node:assert/strict";
import test from "node:test";

async function request(path = "/", init) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", ...(init?.headers ?? {}) },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the analyst workspace", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.doesNotMatch(html, /codex-preview/i);
  assert.match(html, /<title>Analyst Workspace \| LowPropTax<\/title>/i);
  assert.match(html, /Appeal Intelligence/);
  assert.match(html, /Capitol Ridge Office Park/);
  assert.match(html, /Sacramento research pilot/);
  assert.match(html, /Ask this case/);
  assert.match(html, /Most similar appeals/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("returns safe integration health without credentials", async () => {
  const response = await request("/api/health", {
    headers: { accept: "application/json" },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.equal(body.mode, "demo");
  assert.deepEqual(body.integrations, {
    qdrant: false,
    qdrantCollections: [
      { alias: "lpt_research_live", status: "unconfigured" },
      { alias: "appeal_comps_live", status: "unconfigured" },
      { alias: "case_private_live", status: "unconfigured" },
    ],
    llm: false,
    llmProvider: "deepinfra",
    llmModel: "deepseek-ai/DeepSeek-V4-Flash",
    qdrantCloudInference: false,
    supabase: false,
    caseData: false,
    analystAccess: true,
    millage: false,
  });
});

test("validates research questions", async () => {
  const response = await request("/api/research", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ question: "no" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /between 5 and 2,000/);
});

test("loads demo case facts server-side for research", async () => {
  const response = await request("/api/research", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      appealId: "case-2197",
      question: "Which Sacramento evidence should be reviewed first?",
      threadId: "demo-thread",
    }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.mode, "demo");
  assert.equal(body.citations[0].sourceType, "public");
  assert.ok(body.limitations.length > 0);
});

test("lists fictional cases through the same API used by live data", async () => {
  const response = await request("/api/cases", {
    headers: { accept: "application/json" },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.mode, "demo");
  assert.equal(body.cases.length, 3);
  assert.equal(body.cases[0].county, "Sacramento");
});

test("creates a safe demo case through the production-shaped API", async () => {
  const response = await request("/api/cases", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      address: "100 Test Plaza",
      city: "Sacramento",
      county: "Sacramento",
      parcel: "000-000-001",
      propertyType: "Office",
      taxYear: 2026,
      assessedValue: 5000000,
      requestedValue: 4200000,
      filingDeadline: "2026-09-15",
    }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.case.county, "Sacramento");
  assert.equal(body.case.requestedValue, 4200000);
  assert.equal(body.case.source, "demo");
});
