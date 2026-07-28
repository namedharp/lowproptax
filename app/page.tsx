import type { Metadata } from "next";
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
  const user = await getChatGPTUser();

  return (
    <AnalystConsole
      analystName={user?.fullName ?? user?.email.split("@")[0] ?? "Demo Analyst"}
    />
  );
}
