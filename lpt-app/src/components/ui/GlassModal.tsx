"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import { useEffect, useCallback, type ReactNode } from "react";

type GlassModalSize = "sm" | "md" | "lg" | "xl";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: GlassModalSize;
}

const sizeStyles: Record<GlassModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: GlassModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full bg-[rgba(255,255,255,0.25)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.25)] p-6",
          "animate-[slide-up_0.3s_ease-out]",
          sizeStyles[size]
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/60 hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        {title && (
          <h2 className="mb-4 pr-8 text-lg font-semibold text-white">
            {title}
          </h2>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
