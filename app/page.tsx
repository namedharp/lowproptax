import type { Metadata } from "next";
import { listAppealCases, liveCaseDataIsConfigured } from "@/lib/cases";
import { getChatGPTUser } from "./chatgpt-auth";
import { AnalystConsole } from "./components/AnalystConsole";
import { getAnalystAccess } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Analyst Workspace",
  description:
    "Research comparable appeals, inspect evidence, and prepare case strategy.",
};

export default async function Home() {
  const user = await getChatGPTUser();
  const access = await getAnalystAccess({
    email: user?.email.toLowerCase() ?? "demo.analyst@lowproptax.local",
    name: user?.fullName ?? user?.email.split("@")[0] ?? "Demo Analyst",
    isDemo: process.env.DEMO_MODE !== "false",
  });
  if (!access) {
    return (
      <main className="page standard-page">
        <section className="panel empty-portfolio">
          <span className="section-kicker">Access restricted</span>
          <h1>Analyst access is required</h1>
          <p>
            Ask a LowPropTax administrator to add this email to the Sacramento
            pilot team.
          </p>
        </section>
      </main>
    );
  }
  const cases = await listAppealCases(access);

  return (
    <AnalystConsole
      analystName={user?.fullName ?? user?.email.split("@")[0] ?? "Demo Analyst"}
      initialCases={cases}
      dataMode={liveCaseDataIsConfigured() ? "live" : "demo"}
      analystRole={access.role}
    />
  );
}
