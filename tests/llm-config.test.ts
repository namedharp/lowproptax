import assert from "node:assert/strict";
import test from "node:test";
import { getLlmConfiguration, llmIsConfigured } from "../lib/llm-config";

test("uses the DeepInfra DeepSeek preset without exposing a browser key", () => {
  const config = getLlmConfiguration({
    LLM_PROVIDER: "deepinfra",
    LLM_API_KEY: "server-only-test-key",
  });

  assert.equal(config.provider, "deepinfra");
  assert.equal(config.baseUrl, "https://api.deepinfra.com/v1/openai");
  assert.equal(config.style, "chat-completions");
  assert.equal(config.model, "deepseek-ai/DeepSeek-V4-Flash");
  assert.equal(llmIsConfigured({ LLM_PROVIDER: "deepinfra" }), false);
  assert.equal(
    llmIsConfigured({
      LLM_PROVIDER: "deepinfra",
      LLM_API_KEY: "server-only-test-key",
    }),
    true,
  );
});

test("accepts documented DeepInfra request controls and ignores invalid values", () => {
  const config = getLlmConfiguration({
    LLM_PROVIDER: "deepinfra",
    LLM_SERVICE_TIER: "priority",
    LLM_REASONING_EFFORT: "medium",
    LLM_TEMPERATURE: "0.2",
    LLM_MAX_TOKENS: "1600",
  });

  assert.equal(config.serviceTier, "priority");
  assert.equal(config.reasoningEffort, "medium");
  assert.equal(config.temperature, 0.2);
  assert.equal(config.maxTokens, 1600);

  const invalid = getLlmConfiguration({
    LLM_PROVIDER: "deepinfra",
    LLM_SERVICE_TIER: "fastest",
    LLM_TEMPERATURE: "4",
    LLM_MAX_TOKENS: "-1",
  });
  assert.equal(invalid.serviceTier, undefined);
  assert.equal(invalid.temperature, undefined);
  assert.equal(invalid.maxTokens, undefined);
});
