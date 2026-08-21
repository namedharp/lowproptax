export type LlmApiStyle = "responses" | "chat-completions";

type Environment = Record<string, string | undefined>;

export type LlmConfiguration = {
  provider: string;
  apiKey?: string;
  baseUrl: string;
  style: LlmApiStyle;
  model: string;
  maxTokens?: number;
  temperature?: number;
  serviceTier?: "default" | "priority" | "flex";
  reasoningEffort?:
    | "none"
    | "minimal"
    | "low"
    | "medium"
    | "high"
    | "xhigh"
    | "max";
};

const PROVIDERS = {
  deepinfra: {
    baseUrl: "https://api.deepinfra.com/v1/openai",
    style: "chat-completions" as const,
    model: "deepseek-ai/DeepSeek-V4-Flash",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    style: "responses" as const,
    model: "gpt-5.6-sol",
  },
};

const SERVICE_TIERS = new Set(["default", "priority", "flex"]);
const REASONING_EFFORTS = new Set([
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

export function getLlmConfiguration(
  environment: Environment = process.env,
): LlmConfiguration {
  const provider = resolveProvider(environment);
  const preset = provider === "deepinfra" ? PROVIDERS.deepinfra : PROVIDERS.openai;
  const requestedStyle = environment.LLM_API_STYLE?.trim();
  const style: LlmApiStyle =
    requestedStyle === "chat-completions" || requestedStyle === "responses"
      ? requestedStyle
      : preset.style;

  return {
    provider,
    apiKey: environment.LLM_API_KEY ?? environment.OPENAI_API_KEY,
    baseUrl: (environment.LLM_API_BASE_URL ?? preset.baseUrl).replace(/\/+$/, ""),
    style,
    model:
      environment.LLM_MODEL ??
      environment.OPENAI_MODEL ??
      preset.model,
    maxTokens: optionalPositiveInteger(environment.LLM_MAX_TOKENS),
    temperature: optionalRangeNumber(environment.LLM_TEMPERATURE, 0, 2),
    serviceTier: optionalEnum(
      environment.LLM_SERVICE_TIER,
      SERVICE_TIERS,
    ) as LlmConfiguration["serviceTier"],
    reasoningEffort: optionalEnum(
      environment.LLM_REASONING_EFFORT,
      REASONING_EFFORTS,
    ) as LlmConfiguration["reasoningEffort"],
  };
}

export function llmIsConfigured(
  environment: Environment = process.env,
): boolean {
  return Boolean(getLlmConfiguration(environment).apiKey);
}

function resolveProvider(environment: Environment): string {
  const configured = environment.LLM_PROVIDER?.trim().toLowerCase();
  if (configured) return configured;
  if (environment.LLM_API_BASE_URL?.includes("deepinfra.com")) {
    return "deepinfra";
  }
  if (environment.OPENAI_API_KEY || environment.OPENAI_MODEL) {
    return "openai";
  }
  return "deepinfra";
}

function optionalPositiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function optionalRangeNumber(
  value: string | undefined,
  minimum: number,
  maximum: number,
): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function optionalEnum(
  value: string | undefined,
  options: Set<string>,
): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized && options.has(normalized) ? normalized : undefined;
}
