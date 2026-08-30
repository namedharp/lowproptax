"use client";

import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";

interface GlassSelectOption {
  value: string;
  label: string;
}

interface GlassSelectProps {
  label?: string;
  options: GlassSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
  placeholder?: string;
}

export function GlassSelect({
  label,
  options,
  value,
  onChange,
  error,
  className,
  placeholder,
}: GlassSelectProps) {
  const selectId = label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-white/80"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full appearance-none bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all duration-200 cursor-pointer",
            error && "border-red-400 focus:border-red-400 focus:ring-red-400/50",
            className
          )}
        >
          {placeholder && (
            <option value="" disabled className="bg-slate-800 text-white/50">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-800 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
