"use client";

import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";

type GlassButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type GlassButtonSize = "sm" | "md" | "lg";

interface GlassButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  href?: string;
  className?: string;
  children: ReactNode;
  type?: "button" | "submit" | "reset";
}

const variantStyles: Record<GlassButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white hover:from-teal-500/60 hover:to-emerald-500/60",
  secondary:
    "bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white hover:bg-[rgba(255,255,255,0.25)]",
  ghost: "bg-transparent text-white hover:bg-[rgba(255,255,255,0.08)]",
  outline:
    "bg-transparent border-2 border-teal-400/50 text-white hover:bg-[rgba(20,184,166,0.15)]",
};

const sizeStyles: Record<GlassButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-7 py-3.5 text-lg rounded-xl",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function GlassButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  href,
  className,
  children,
  type = "button",
  onClick,
  ...rest
}: GlassButtonProps) {
  const classes = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  const content = (
    <>
      {loading ? <Spinner /> : icon}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
}
