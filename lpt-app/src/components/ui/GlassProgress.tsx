import { cn } from "@/lib/utils/cn";

type GlassProgressVariant = "teal" | "emerald" | "white";
type GlassProgressSize = "sm" | "md";

interface GlassProgressProps {
  value: number;
  variant?: GlassProgressVariant;
  size?: GlassProgressSize;
  className?: string;
}

const variantStyles: Record<GlassProgressVariant, string> = {
  teal: "bg-gradient-to-r from-teal-500 to-teal-400",
  emerald: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  white: "bg-gradient-to-r from-white/60 to-white/40",
};

const sizeStyles: Record<GlassProgressSize, string> = {
  sm: "h-1.5",
  md: "h-3",
};

export function GlassProgress({
  value,
  variant = "teal",
  size = "md",
  className,
}: GlassProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]",
        sizeStyles[size],
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          variantStyles[variant]
        )}
        style={{ width: `${clampedValue}%` }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
