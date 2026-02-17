import { cn } from "@/lib/utils/cn";

interface SectionProps {
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export function Section({ className, children, id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-16 sm:py-20 lg:py-24", className)}
    >
      {children}
    </section>
  );
}
