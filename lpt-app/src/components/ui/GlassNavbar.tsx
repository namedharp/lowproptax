"use client";

import { cn } from "@/lib/utils/cn";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { GlassButton } from "./GlassButton";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Property Search", href: "/search" },
  { label: "About", href: "/about" },
];

export function GlassNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[rgba(255,255,255,0.08)] backdrop-blur-[20px] border-b border-[rgba(255,255,255,0.1)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Logo size="md" />

        {/* Center: Desktop nav links */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-[rgba(255,255,255,0.15)] text-white"
                    : "text-white/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                )}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Right: Auth buttons (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          <GlassButton variant="ghost" size="sm" href="/login">
            Login
          </GlassButton>
          <GlassButton variant="primary" size="sm" href="/register">
            Get Started
          </GlassButton>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-white/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-white transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[20px] border-b border-[rgba(255,255,255,0.1)] lg:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-[rgba(255,255,255,0.15)] text-white"
                      : "text-white/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                  )}
                >
                  {link.label}
                </a>
              );
            })}

            <div className="flex flex-col gap-2 pt-3 border-t border-[rgba(255,255,255,0.1)]">
              <GlassButton
                variant="ghost"
                size="sm"
                href="/login"
                className="w-full"
              >
                Login
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                href="/register"
                className="w-full"
              >
                Get Started
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
