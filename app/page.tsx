import type { Metadata } from "next";
import { listAppealCases, liveCaseDataIsConfigured } from "@/lib/cases";
import { getChatGPTUser } from "./chatgpt-auth";
import { AnalystConsole } from "./components/AnalystConsole";

export const metadata: Metadata = {
  title: "Analyst Workspace",
  description:
    "Research comparable appeals, inspect evidence, and prepare case strategy.",
  other: {
    "codex-preview": "development",
  },
};

export default async function Home() {
  const [user, cases] = await Promise.all([getChatGPTUser(), listAppealCases()]);

  return (
    <AnalystConsole
      analystName={user?.fullName ?? user?.email.split("@")[0] ?? "Demo Analyst"}
      initialCases={cases}
      dataMode={liveCaseDataIsConfigured() ? "live" : "demo"}
    />
  );
}
