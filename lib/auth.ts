export type AnalystIdentity = {
  email: string;
  name: string;
  isDemo: boolean;
};

const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";

export function getRequestAnalyst(request: Request): AnalystIdentity | null {
  const email = request.headers.get(USER_EMAIL_HEADER)?.trim().toLowerCase();
  const demoMode = process.env.DEMO_MODE !== "false";

  if (demoMode) {
    return {
      email: email ?? "demo.analyst@lowproptax.local",
      name: readDisplayName(request) ?? "Demo Analyst",
      isDemo: true,
    };
  }

  if (!email || !isAllowedAnalyst(email)) return null;
  return {
    email,
    name: readDisplayName(request) ?? email.split("@")[0],
    isDemo: false,
  };
}

export function analystAccessIsConfigured(): boolean {
  return process.env.DEMO_MODE !== "false" || allowedEmails().length > 0;
}

function isAllowedAnalyst(email: string): boolean {
  return allowedEmails().includes(email);
}

function allowedEmails(): string[] {
  return (process.env.ANALYST_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function readDisplayName(request: Request): string | null {
  const raw = request.headers.get(USER_NAME_HEADER);
  if (!raw) return null;
  if (
    request.headers.get(USER_NAME_ENCODING_HEADER) === "percent-encoded-utf-8"
  ) {
    try {
      return decodeURIComponent(raw);
    } catch {
      return null;
    }
  }
  return raw;
}
