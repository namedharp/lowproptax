"use client";

import { usePathname } from "next/navigation";
import { GlassNavbar } from "./GlassNavbar";
import { Footer } from "./Footer";

const appPrefixes = [
  "/dashboard",
  "/portfolio",
  "/ai-assistant",
  "/overview",
  "/clients",
  "/appeals",
  "/properties",
  "/portfolios",
  "/settings",
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = appPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAppRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <GlassNavbar />
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
