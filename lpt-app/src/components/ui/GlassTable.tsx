import { cn } from "@/lib/utils/cn";

interface GlassTableColumn {
  key: string;
  header: string;
  className?: string;
}

interface GlassTableProps {
  columns: GlassTableColumn[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  className?: string;
}

export function GlassTable({
  columns,
  data,
  onRowClick,
  className,
}: GlassTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[16px] bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.15)]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[rgba(255,255,255,0.1)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-200/80",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-[rgba(255,255,255,0.1)] transition-colors hover:bg-[rgba(255,255,255,0.08)]",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-sm text-white/90",
                      col.className
                    )}
                  >
                    {row[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
