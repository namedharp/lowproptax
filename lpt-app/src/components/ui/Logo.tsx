import { cn } from "@/lib/utils/cn";
import { Shield } from "lucide-react";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const sizeStyles: Record<LogoSize, { text: string; icon: string }> = {
  sm: { text: "text-lg", icon: "h-5 w-5" },
  md: { text: "text-xl", icon: "h-6 w-6" },
  lg: { text: "text-2xl", icon: "h-7 w-7" },
};

export function Logo({ size = "md", className }: LogoProps) {
  const s = sizeStyles[size];

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <Shield className={cn(s.icon, "text-teal-400")} />
      <span className={cn(s.text, "font-bold")}>
        <span className="text-white">Low</span>
        <span className="text-teal-400">PropTax</span>
      </span>
    </Link>
  );
}
