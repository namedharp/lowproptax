import { cn } from "@/lib/utils/cn";

type GlassCardVariant = "default" | "heavy" | "light";
type GlassCardPadding = "none" | "sm" | "md" | "lg";

interface GlassCardProps {
  variant?: GlassCardVariant;
  hover?: boolean;
  padding?: GlassCardPadding;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<GlassCardVariant, string> = {
  default:
    "bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)]",
  heavy:
    "bg-[rgba(255,255,255,0.25)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.25)]",
  light:
    "bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.12)]",
};

const paddingStyles: Record<GlassCardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function GlassCard({
  variant = "default",
  hover = false,
  padding = "md",
  className,
  children,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        hover &&
          "hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.2)] transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
