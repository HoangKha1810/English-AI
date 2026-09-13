"use client";

import { Flag } from "lucide-react";
import type { AnswerMap } from "@/lib/grade";
import { isAnswered } from "@/lib/grade";
import { cn } from "@/lib/utils";

export function AnswerPalette({
  questionIds,
  answers,
  flagged,
  onToggleFlag,
  review,
  compact,
  columns = 5,
}: {
  questionIds: number[];
  answers: AnswerMap;
  flagged: Set<number>;
  onToggleFlag?: (id: number) => void;
  review?: Record<number, boolean>;
  compact?: boolean;
  columns?: number;
}) {
  const done = questionIds.filter((id) => isAnswered(answers[String(id)])).length;

  const go = (id: number) => {
    const el =
      document.getElementById(`q-row-${id}`) ?? document.getElementById(`q-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
  };

  return (
    <div>
      {!compact && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Bảng câu hỏi
          </p>
          <p className="text-xs text-slate-400 tabular-nums">
            <span className="font-semibold text-white">{done}</span>/{questionIds.length}
          </p>
        </div>
      )}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {questionIds.map((id) => {
          const answered = isAnswered(answers[String(id)]);
          const isFlag = flagged.has(id);
          const ok = review?.[id];
          return (
            <button
              key={id}
              onClick={() => go(id)}
              onContextMenu={(e) => {
                if (!onToggleFlag) return;
                e.preventDefault();
                onToggleFlag(id);
              }}
              title={isFlag ? "Đã đánh dấu (chuột phải để bỏ)" : "Chuột phải để đánh dấu"}
              className={cn(
                "relative grid h-8 place-items-center rounded-lg border text-xs font-medium tabular-nums transition-colors",
                review
                  ? ok
                    ? "border-emerald-400/40 bg-emerald-500/18 text-emerald-200"
                    : "border-rose-400/40 bg-rose-500/18 text-rose-200"
                  : answered
                    ? "border-violet-400/45 bg-violet-500/20 text-white"
                    : "border-white/10 bg-white/4 text-slate-500 hover:border-white/25 hover:text-slate-300"
              )}
            >
              {id}
              {isFlag && (
                <Flag className="absolute -top-1 -right-1 size-3 fill-amber-400 text-amber-400" />
              )}
            </button>
          );
        })}
      </div>
      {!compact && !review && (
        <p className="mt-3 text-[0.68rem] leading-relaxed text-slate-500">
          Nhấp để nhảy tới câu. Chuột phải để đánh dấu câu cần xem lại.
        </p>
      )}
    </div>
  );
}
