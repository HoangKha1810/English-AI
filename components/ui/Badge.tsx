import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-white/80 text-ink-600 border-pink-200",
  pink: "bg-pink-100/80 text-pink-700 border-pink-300/70",
  violet: "bg-violet-100/80 text-violet-700 border-violet-300/70",
  sky: "bg-sky-100/80 text-sky-700 border-sky-300/70",
  amber: "bg-amber-100/80 text-amber-700 border-amber-300/70",
  emerald: "bg-emerald-100/80 text-emerald-700 border-emerald-300/70",
  rose: "bg-rose-100/80 text-rose-700 border-rose-300/70",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1 text-xs font-bold",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
