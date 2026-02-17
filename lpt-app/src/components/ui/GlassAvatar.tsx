import { cn } from "@/lib/utils/cn";

type GlassAvatarSize = "sm" | "md" | "lg";

interface GlassAvatarProps {
  name: string;
  src?: string;
  size?: GlassAvatarSize;
  className?: string;
}

const sizeStyles: Record<GlassAvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function GlassAvatar({
  name,
  src,
  size = "md",
  className,
}: GlassAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-2 ring-[rgba(255,255,255,0.2)]",
          sizeStyles[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 font-semibold text-white ring-2 ring-[rgba(255,255,255,0.2)]",
        sizeStyles[size],
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
