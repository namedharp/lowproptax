"use client";

import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInput({ label, error, icon, className, id, ...rest }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-white/80"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all duration-200",
              icon && "pl-10",
              error && "border-red-400 focus:border-red-400 focus:ring-red-400/50",
              className
            )}
            {...rest}
          />
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
