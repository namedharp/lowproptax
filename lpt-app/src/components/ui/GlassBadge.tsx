import { cn } from "@/lib/utils/cn";

type GlassBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "teal";

interface GlassBadgeProps {
  variant?: GlassBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<GlassBadgeVariant, string> = {
  default:
    "bg-[rgba(255,255,255,0.15)] text-white border-[rgba(255,255,255,0.2)]",
  success:
    "bg-green-500/20 text-green-300 border-green-400/30",
  warning:
    "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  error:
    "bg-red-500/20 text-red-300 border-red-400/30",
  info:
    "bg-blue-500/20 text-blue-300 border-blue-400/30",
  teal:
    "bg-teal-500/20 text-teal-300 border-teal-400/30",
};

export function GlassBadge({
  variant = "default",
  children,
  className,
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-[8px] border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
