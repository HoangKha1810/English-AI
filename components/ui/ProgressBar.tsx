import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  color = "#a78bfa",
  className,
  height = 8,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-white/8", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          boxShadow: `0 0 12px ${color}66`,
        }}
      />
    </div>
  );
}
