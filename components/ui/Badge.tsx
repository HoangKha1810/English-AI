import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-white/8 text-slate-300 border-white/12",
  violet: "bg-violet-500/14 text-violet-200 border-violet-400/28",
  sky: "bg-sky-500/14 text-sky-200 border-sky-400/28",
  amber: "bg-amber-500/14 text-amber-200 border-amber-400/28",
  emerald: "bg-emerald-500/14 text-emerald-200 border-emerald-400/28",
  rose: "bg-rose-500/14 text-rose-200 border-rose-400/28",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
