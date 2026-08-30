"use client";

import { cn } from "@/lib/utils/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

interface GlassTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const GlassTextarea = forwardRef<
  HTMLTextAreaElement,
  GlassTextareaProps
>(function GlassTextarea({ label, error, className, id, ...rest }, ref) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-sm font-medium text-white/80"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          "w-full min-h-[120px] resize-y bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all duration-200",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/50",
          className
        )}
        {...rest}
      />

      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});
