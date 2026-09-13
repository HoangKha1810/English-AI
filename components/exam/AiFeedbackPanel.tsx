"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  ChevronDown,
  Info,
  Lightbulb,
  Quote,
  SpellCheck2,
  TrendingUp,
} from "lucide-react";
import type { AiFeedback } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { BandRing } from "@/components/ui/BandRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { bandColor } from "@/lib/band";
import { cn } from "@/lib/utils";

export function AiFeedbackPanel({
  feedback,
  mode,
}: {
  feedback: AiFeedback;
  mode?: "ai" | "heuristic";
}) {
  const [openModel, setOpenModel] = useState(false);

  return (
    <div className="space-y-5">
      {mode === "heuristic" && (
        <div className="flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div className="text-[0.85rem] leading-relaxed text-amber-800">
            <p className="font-medium text-amber-800">Đây là ước lượng, chưa phải điểm AI</p>
            <p className="mt-1">
              Chưa có <code className="rounded bg-rose-100 px-1">GEMINI_API_KEY</code> nên hệ
              thống chỉ đo được các chỉ số bề mặt như độ dài, độ đa dạng từ vựng và độ dài câu.
              Thêm khoá Gemini miễn phí vào <code className="rounded bg-rose-100 px-1">.env.local</code>{" "}
              để được chấm theo đúng band descriptors.
            </p>
          </div>
        </div>
      )}

      {/* Tong quan */}
      <GlassCard strong className="animate-pop overflow-hidden">
        <div
          className="flex flex-col items-center gap-8 px-6 py-8 sm:flex-row sm:px-8"
          style={{
            background:
              "radial-gradient(480px circle at 20% -20%, rgba(124,58,237,0.2), transparent 62%)",
          }}
        >
          <BandRing band={feedback.overallBand} size={150} />
          <div className="w-full flex-1 space-y-3.5">
            {feedback.criteria.map((c) => (
              <div key={c.key}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[0.85rem] text-ink-700">{c.label}</span>
                  <span
                    className="font-display text-base font-semibold tabular-nums"
                    style={{ color: bandColor(c.band) }}
                  >
                    {c.band.toFixed(1)}
                  </span>
                </div>
                <ProgressBar value={c.band} max={9} color={bandColor(c.band)} height={6} />
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Nhan xet tung tieu chi */}
      <div className="grid gap-4 md:grid-cols-2">
        {feedback.criteria.map((c) => (
          <GlassCard key={c.key} className="p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-[0.95rem] font-semibold text-ink-900">
                {c.label}
              </h3>
              <span
                className="font-display text-lg font-semibold tabular-nums"
                style={{ color: bandColor(c.band) }}
              >
                {c.band.toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-500">{c.comment}</p>
            {c.evidence && c.evidence.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-l-2 border-violet-400/30 pl-3">
                {c.evidence.map((e, i) => (
                  <li key={i} className="flex gap-1.5 text-[0.78rem] text-ink-450 italic">
                    <Quote className="mt-0.5 size-3 shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Diem manh / can cai thien */}
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="flex items-center gap-2 font-display text-[0.95rem] font-semibold text-emerald-700">
            <CheckCircle2 className="size-4.5" />
            Bạn đang làm tốt
          </h3>
          <ul className="mt-3 space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-[0.85rem] leading-relaxed text-ink-700">
                <span className="text-emerald-600">•</span>
                {s}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="flex items-center gap-2 font-display text-[0.95rem] font-semibold text-amber-700">
            <TrendingUp className="size-4.5" />
            Cần cải thiện
          </h3>
          <ul className="mt-3 space-y-2">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="flex gap-2 text-[0.85rem] leading-relaxed text-ink-700">
                <span className="text-amber-600">•</span>
                {s}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      {/* Sua loi */}
      {feedback.corrections && feedback.corrections.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="flex items-center gap-2 font-display text-[0.95rem] font-semibold text-ink-900">
            <SpellCheck2 className="size-4.5 text-rose-700" />
            Sửa lỗi cụ thể
          </h3>
          <ul className="mt-4 space-y-4">
            {feedback.corrections.map((c, i) => (
              <li key={i} className="rounded-2xl border border-rose-200/70 bg-white/55 p-3.5">
                <p className="text-[0.85rem] leading-relaxed text-rose-700 line-through decoration-rose-400/50">
                  {c.original}
                </p>
                <p className="mt-1.5 flex gap-2 text-[0.85rem] leading-relaxed text-emerald-700">
                  <ArrowRight className="mt-1 size-3.5 shrink-0" />
                  {c.corrected}
                </p>
                <p className="mt-1.5 text-[0.78rem] text-ink-500">{c.reason}</p>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Nang cap tu vung */}
      {feedback.upgradedVocabulary && feedback.upgradedVocabulary.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="flex items-center gap-2 font-display text-[0.95rem] font-semibold text-ink-900">
            <Lightbulb className="size-4.5 text-amber-700" />
            Nâng cấp từ vựng lên band 7-8
          </h3>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {feedback.upgradedVocabulary.map((v, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl border border-rose-200/70 bg-white/55 px-3.5 py-2.5"
              >
                <span className="text-[0.82rem] text-ink-450 line-through">{v.basic}</span>
                <ArrowRight className="size-3.5 shrink-0 text-violet-400" />
                <span className="text-[0.86rem] font-medium text-violet-700">{v.better}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Bai mau */}
      {feedback.modelAnswer && (
        <GlassCard className="overflow-hidden">
          <button
            onClick={() => setOpenModel((v) => !v)}
            className="flex w-full items-center gap-2.5 p-5 text-left"
          >
            <BookMarked className="size-4.5 text-pink-700" />
            <span className="font-display text-[0.95rem] font-semibold text-ink-900">
              Bài mẫu band 8
            </span>
            <ChevronDown
              className={cn(
                "ml-auto size-4.5 text-ink-500 transition-transform",
                openModel && "rotate-180"
              )}
            />
          </button>
          {openModel && (
            <div className="border-t border-rose-200/70 px-5 py-5">
              <p className="text-[0.92rem] leading-[1.9] whitespace-pre-wrap text-ink-700">
                {feedback.modelAnswer}
              </p>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
