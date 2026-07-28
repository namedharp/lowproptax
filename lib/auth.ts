import "server-only";

import { getSupabaseServerClient, supabaseServerIsConfigured } from "./supabase/server";

export type AnalystIdentity = {
  email: string;
  name: string;
  isDemo: boolean;
};

export type AnalystRole = "admin" | "analyst";

export type AnalystAccess = AnalystIdentity & {
  role: AnalystRole;
};

const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";

export function getRequestAnalyst(request: Request): AnalystIdentity | null {
  return getRequestIdentity(request);
}

export function getRequestIdentity(request: Request): AnalystIdentity | null {
  const email = request.headers.get(USER_EMAIL_HEADER)?.trim().toLowerCase();
  const demoMode = process.env.DEMO_MODE !== "false";

  if (demoMode) {
    return {
      email: email ?? "demo.analyst@lowproptax.local",
      name: readDisplayName(request) ?? "Demo Analyst",
      isDemo: true,
    };
  }

  if (!email) return null;
  return {
    email,
    name: readDisplayName(request) ?? email.split("@")[0],
    isDemo: false,
  };
}

export async function authorizeRequest(
  request: Request,
  requiredRole?: AnalystRole,
): Promise<AnalystAccess | null> {
  const identity = getRequestIdentity(request);
  if (!identity) return null;
  const access = await getAnalystAccess(identity);
  if (!access || (requiredRole === "admin" && access.role !== "admin")) {
    return null;
  }
  return access;
}

export async function getAnalystAccess(
  identity: AnalystIdentity,
): Promise<AnalystAccess | null> {
  if (identity.isDemo) return { ...identity, role: "admin" };

  if (supabaseServerIsConfigured()) {
    const { data, error } = await getSupabaseServerClient()
      .from("analyst_accounts")
      .select("role,active")
      .eq("email", identity.email)
      .maybeSingle();
    if (!error && data?.active === true) {
      const role = data.role === "admin" ? "admin" : "analyst";
      if (!livePhaseAllows(role)) return null;
      return {
        ...identity,
        role,
      };
    }
    if (error && !isMissingTableError(error.message)) {
      throw new Error(`Unable to verify analyst access: ${error.message}`);
    }
  }

  if (!isAllowedAnalyst(identity.email)) return null;
  const role = adminEmails().includes(identity.email) ? "admin" : "analyst";
  if (!livePhaseAllows(role)) return null;
  return {
    ...identity,
    role,
  };
}

export function analystAccessIsConfigured(): boolean {
  return (
    process.env.DEMO_MODE !== "false" ||
    supabaseServerIsConfigured() ||
    allowedEmails().length > 0
  );
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

function adminEmails(): string[] {
  return (process.env.LPT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function livePhaseAllows(role: AnalystRole): boolean {
  return process.env.LPT_LIVE_ACCESS_PHASE !== "admins" || role === "admin";
}

function isMissingTableError(message: string): boolean {
  return /analyst_accounts|schema cache|does not exist/i.test(message);
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
