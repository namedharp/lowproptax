"use client";

import { usePathname } from "next/navigation";
import { GlassNavbar } from "./GlassNavbar";
import { Footer } from "./Footer";

const authenticatedPrefixes = ["/dashboard", "/portfolio", "/ai-assistant"];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthenticated = authenticatedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAuthenticated) {
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
