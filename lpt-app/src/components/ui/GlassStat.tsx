import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

interface GlassStatTrend {
  value: string;
  positive: boolean;
}

interface GlassStatProps {
  label: string;
  value: string;
  icon?: ReactNode;
  trend?: GlassStatTrend;
  className?: string;
}

export function GlassStat({
  label,
  value,
  icon,
  trend,
  className,
}: GlassStatProps) {
  return (
    <GlassCard padding="md" className={className}>
      <div className="flex items-start justify-between">
        {icon && (
          <div className="text-teal-400">{icon}</div>
        )}
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.positive
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
            )}
          >
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </div>
        )}
      </div>

      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/60">{label}</p>
    </GlassCard>
  );
}
