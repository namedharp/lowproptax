"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Search,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "AI Assistant", href: "/ai-assistant", icon: MessageSquare },
  { label: "Property Search", href: "/search", icon: Search },
];

const secondaryLinks = [
  { label: "Settings", href: "#", icon: Settings },
  { label: "Help", href: "#", icon: HelpCircle },
];

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const userName = session?.user?.name || "User";
  const userRole = (session?.user as { role?: string })?.role || "homeowner";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-[rgba(255,255,255,0.08)] backdrop-blur-[20px] border-r border-[rgba(255,255,255,0.1)] flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-[rgba(255,255,255,0.1)]">
          <Logo size="md" />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-white/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-white transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-lg",
                  isActive
                    ? "bg-[rgba(255,255,255,0.15)] text-teal-400"
                    : "text-white/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {link.label}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-4 border-t border-[rgba(255,255,255,0.1)]" />

          {secondaryLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-white transition-all rounded-lg"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-[rgba(255,255,255,0.1)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-sm font-semibold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-white/50 capitalize">{userRole}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile hamburger button */}
      <div className="fixed top-4 left-4 z-30 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center rounded-lg p-2 bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white/80 hover:bg-[rgba(255,255,255,0.25)] hover:text-white transition-all shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Main content */}
      <main className="ml-0 lg:ml-64 p-4 lg:p-8 min-h-screen">{children}</main>
    </div>
  );
}
