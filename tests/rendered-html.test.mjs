import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

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
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /<title>Analyst Workspace \| LowPropTax<\/title>/i);
  assert.match(html, /Appeal Intelligence/);
  assert.match(html, /Cedar Ridge Office Park/);
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
    openai: false,
    supabase: false,
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
