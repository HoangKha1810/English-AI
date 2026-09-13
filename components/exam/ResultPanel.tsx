"use client";

import Link from "next/link";
import { ArrowRight, Eye, LayoutDashboard, RotateCcw, Target } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { BandRing } from "@/components/ui/BandRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TYPE_LABELS } from "@/lib/grade";
import { bandLabel } from "@/lib/band";
import { formatDuration } from "@/lib/utils";

export function ResultPanel({
  testTitle,
  band,
  correct,
  total,
  durationSeconds,
  weakTypes,
  targetBand,
  onReview,
  retakeHref,
  saving,
}: {
  testTitle: string;
  band: number;
  correct: number;
  total: number;
  durationSeconds: number;
  weakTypes: { type: string; correct: number; total: number }[];
  targetBand?: number;
  onReview: () => void;
  retakeHref: string;
  saving?: boolean;
}) {
  const gap = targetBand ? Math.round((targetBand - band) * 10) / 10 : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <GlassCard strong className="animate-pop overflow-hidden">
        <div
          className="px-6 py-10 text-center sm:px-10"
          style={{
            background:
              "radial-gradient(520px circle at 50% -10%, rgba(124,58,237,0.22), transparent 65%)",
          }}
        >
          <p className="text-sm text-slate-400">{testTitle}</p>
          <h1 className="font-display mt-1 text-2xl font-semibold text-white">
            Kết quả của bạn
          </h1>

          <div className="mt-7 flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
            <BandRing band={band} size={168} caption={bandLabel(band)} />

            <div className="w-full max-w-xs space-y-4 text-left">
              <Row label="Số câu đúng" value={`${correct}/${total}`} />
              <Row
                label="Độ chính xác"
                value={`${Math.round((correct / Math.max(1, total)) * 100)}%`}
              />
              <Row label="Thời gian làm" value={formatDuration(durationSeconds)} />
              {gap !== null && (
                <div className="rounded-xl border border-white/10 bg-white/4 p-3.5">
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Target className="size-3.5" />
                    Mục tiêu {targetBand?.toFixed(1)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {gap <= 0
                      ? "Bạn đã đạt mục tiêu ở kỹ năng này!"
                      : `Còn cách mục tiêu ${gap.toFixed(1)} band`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {saving && (
            <p className="mt-6 text-xs text-slate-500">Đang lưu kết quả...</p>
          )}
        </div>

        {weakTypes.length > 0 && (
          <div className="border-t border-white/8 px-6 py-7 sm:px-10">
            <h2 className="font-display text-base font-semibold text-white">
              Dạng câu hỏi cần luyện thêm
            </h2>
            <div className="mt-4 space-y-3.5">
              {weakTypes.slice(0, 4).map((w) => {
                const pct = Math.round((w.correct / w.total) * 100);
                const color =
                  pct >= 80 ? "#34d399" : pct >= 55 ? "#fbbf24" : "#fb7185";
                return (
                  <div key={w.type}>
                    <div className="mb-1.5 flex justify-between text-[0.82rem]">
                      <span className="text-slate-300">
                        {TYPE_LABELS[w.type] ?? w.type}
                      </span>
                      <span className="text-slate-400 tabular-nums">
                        {w.correct}/{w.total}
                      </span>
                    </div>
                    <ProgressBar value={w.correct} max={w.total} color={color} height={7} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-white/8 px-6 py-6 sm:px-10">
          <Button onClick={onReview} variant="primary">
            <Eye className="size-4.5" />
            Xem lại từng câu
          </Button>
          <ButtonLink href={retakeHref} variant="secondary">
            <RotateCcw className="size-4" />
            Làm lại
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost" className="ml-auto">
            <LayoutDashboard className="size-4" />
            Tiến độ
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </GlassCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-display text-base font-semibold text-white tabular-nums">
        {value}
      </span>
    </div>
  );
}
