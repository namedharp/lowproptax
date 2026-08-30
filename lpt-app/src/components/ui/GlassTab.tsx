"use client";

import { cn } from "@/lib/utils/cn";

interface Tab {
  key: string;
  label: string;
}

interface GlassTabProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export function GlassTab({
  tabs,
  activeTab,
  onChange,
  className,
}: GlassTabProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-[16px] bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.15)] p-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[rgba(255,255,255,0.2)] text-white border-b-2 border-teal-400"
                : "text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
