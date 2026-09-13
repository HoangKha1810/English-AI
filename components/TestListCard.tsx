import Link from "next/link";
import { ArrowRight, Clock3, ListChecks } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { Badge } from "./ui/Badge";

const DIFF_TONE = {
  "Dễ": "emerald",
  "Trung bình": "amber",
  "Khó": "rose",
} as const;

export function TestListCard({
  href,
  title,
  difficulty,
  duration,
  questions,
  topics,
  accent,
  index = 0,
  footer,
}: {
  href: string;
  title: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  duration: string;
  questions?: string;
  topics: string[];
  accent: string;
  index?: number;
  footer?: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <GlassCard
        hover
        glowColor={accent}
        className="animate-fade-up h-full p-5"
        style={{ animationDelay: `${index * 70}ms` }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug font-semibold text-white">
            {title}
          </h3>
          <Badge tone={DIFF_TONE[difficulty]} className="shrink-0">
            {difficulty}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {duration}
          </span>
          {questions && (
            <span className="inline-flex items-center gap-1.5">
              <ListChecks className="size-3.5" />
              {questions}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span
              key={t}
              className="rounded-md border border-white/8 bg-white/4 px-2 py-0.5 text-[0.7rem] text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>

        {footer}

        <span
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-transform group-hover:translate-x-1"
          style={{ color: accent }}
        >
          Bắt đầu <ArrowRight className="size-4" />
        </span>
      </GlassCard>
    </Link>
  );
}
