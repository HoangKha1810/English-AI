"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  History,
  Mic,
  PenLine,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import type { Attempt, FullAttempt, ProgressAnalysis, Skill } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { getAttempts, getFullAttempts } from "@/lib/storage";
import { loadResumeProgress, type ResumeProgress } from "@/lib/progress";
import { SKILL_MAP, SKILLS } from "@/lib/skills";
import { bandColor, overallBand } from "@/lib/band";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { BandRing } from "@/components/ui/BandRing";
import { ProgressBar } from "@/components/ui/ProgressBar";

const ICONS = {
  listening: Headphones,
  reading: Target,
  writing: PenLine,
  speaking: Mic,
} as const;

export function HomeWorkspace() {
  const { user, profile, configured, storageId } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [fullAttempts, setFullAttempts] = useState<FullAttempt[]>([]);
  const [resume, setResume] = useState<ResumeProgress[]>([]);
  const [ready, setReady] = useState(false);
  const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const refresh = useCallback(async () => {
    const [attemptsResult, fullAttemptsResult] = await Promise.allSettled([
      getAttempts(storageId, { max: 200 }),
      getFullAttempts(storageId, 50),
    ]);
    if (attemptsResult.status === "fulfilled") setAttempts(attemptsResult.value);
    if (fullAttemptsResult.status === "fulfilled") {
      setFullAttempts(fullAttemptsResult.value);
    }
    setResume(loadResumeProgress());
    setReady(true);
  }, [storageId]);

  useEffect(() => {
    setResume(loadResumeProgress());
    setReady(true);
    void refresh();

    const syncProgress = () => setResume(loadResumeProgress());
    const syncAttempts = () => void refresh();
    const syncAll = () => void refresh();
    window.addEventListener("ielts:progress-change", syncProgress);
    window.addEventListener("ielts:attempt-change", syncAttempts);
    window.addEventListener("storage", syncAll);
    return () => {
      window.removeEventListener("ielts:progress-change", syncProgress);
      window.removeEventListener("ielts:attempt-change", syncAttempts);
      window.removeEventListener("storage", syncAll);
    };
  }, [refresh]);

  const bySkill = useMemo(() => {
    const map = {} as Record<Skill, Attempt[]>;
    for (const skill of SKILLS) map[skill.key] = [];
    for (const attempt of attempts) map[attempt.skill]?.push(attempt);
    for (const fullAttempt of fullAttempts) {
      for (const skill of SKILLS) {
        map[skill.key].push({
          uid: fullAttempt.uid,
          skill: skill.key,
          testId: fullAttempt.testId,
          testTitle: `${fullAttempt.testTitle} · ${skill.name}`,
          band: fullAttempt.bands[skill.key],
          durationSeconds: fullAttempt.durationSeconds,
          createdAt: fullAttempt.createdAt,
        });
      }
    }
    for (const skill of SKILLS) {
      map[skill.key].sort((a, b) => b.createdAt - a.createdAt);
    }
    return map;
  }, [attempts, fullAttempts]);

  const skillStats = useMemo(
    () =>
      SKILLS.map((skill) => {
        const list = bySkill[skill.key];
        const average =
          list.length > 0
            ? list.reduce((sum, attempt) => sum + attempt.band, 0) / list.length
            : null;
        return {
          ...skill,
          average,
          latest: list[0]?.band ?? null,
          count: list.length,
        };
      }),
    [bySkill]
  );

  const latestBands = skillStats.map((skill) => skill.latest ?? undefined);
  const latestOverall = overallBand(latestBands);
  const scoreEntries = skillStats.flatMap((skill) =>
    bySkill[skill.key].map((attempt) => attempt.band)
  );
  const averageBand =
    scoreEntries.length > 0
      ? scoreEntries.reduce((sum, band) => sum + band, 0) / scoreEntries.length
      : null;
  const latestFull = fullAttempts[0] ?? null;

  const analyzeProgress = async () => {
    if (scoreEntries.length === 0) return;
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const rows = [
        ...attempts.map((attempt) => ({
          skill: attempt.skill,
          testTitle: attempt.testTitle,
          band: attempt.band,
          correct: attempt.correct,
          total: attempt.total,
          createdAt: attempt.createdAt,
        })),
        ...fullAttempts.flatMap((attempt) =>
          SKILLS.map((skill) => ({
            skill: skill.key,
            testTitle: `${attempt.testTitle} · ${skill.name}`,
            band: attempt.bands[skill.key],
            createdAt: attempt.createdAt,
          }))
        ),
      ]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20);
      const res = await fetch("/api/analyze-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempts: rows,
        }),
      });
      const data = (await res.json()) as ProgressAnalysis & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không thể phân tích tiến độ.");
      setAnalysis(data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Không thể phân tích tiến độ.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!ready) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="h-44 animate-pulse rounded-2xl border border-rose-200/70 bg-white/60" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-ink-500">
            <Sparkles className="size-4 text-violet-600" />
            {user ? `Chào ${profile?.displayName ?? user.email}` : "Không gian luyện tập của bạn"}
          </p>
          <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight text-ink-900">
            Tiếp tục hành trình IELTS
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/ielts" variant="secondary" size="sm">
            <History className="size-4" />
            Đề full IELTS
          </ButtonLink>
          <ButtonLink href="/dashboard" size="sm">
            Xem tiến độ
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </div>

      {!user && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/8 p-3.5">
          <Sparkles className="size-4.5 shrink-0 text-violet-600" />
          <p className="min-w-0 flex-1 text-[0.82rem] leading-relaxed text-violet-800">
            Tiến độ hiện được lưu trên trình duyệt này.
            {configured ? " Đăng nhập để đồng bộ giữa các thiết bị." : ""}
          </p>
          {configured && (
            <ButtonLink href="/login" variant="ghost" size="sm">
              Đăng nhập
            </ButtonLink>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
        <GlassCard strong className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.16em] text-ink-450 uppercase">Đang làm dở</p>
              <h3 className="font-display mt-1 text-xl font-semibold text-ink-900">
                Quay lại đúng chỗ bạn đã dừng
              </h3>
            </div>
            <Clock3 className="size-5 text-ink-450" />
          </div>

          {resume.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-rose-300/60 bg-white/55 p-5">
              <p className="text-sm text-ink-700">Chưa có bài làm dở nào.</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-450">
                Chọn một kỹ năng hoặc bắt đầu ngay một đề IELTS đủ bốn phần.
              </p>
              <ButtonLink href="/ielts" size="sm" className="mt-4">
                Bắt đầu đề full
                <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {resume.slice(0, 5).map((item) => (
                <ResumeRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="flex items-center gap-5 p-5 sm:p-6">
          <div className="shrink-0">
            {latestOverall !== null ? (
              <BandRing band={latestOverall} size={132} caption="Band hiện tại" />
            ) : (
              <div className="grid size-[132px] place-items-center rounded-full border border-dashed border-rose-300/70 text-center">
                <span className="text-xs leading-relaxed text-ink-450">Chưa có<br />điểm</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs tracking-[0.16em] text-ink-450 uppercase">Tổng quan</p>
            <h3 className="font-display mt-1 text-xl font-semibold text-ink-900">
              {averageBand !== null ? `Trung bình ${averageBand.toFixed(1)}` : "Bắt đầu từ hôm nay"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {scoreEntries.length > 0
                ? `${scoreEntries.length} điểm kỹ năng đã được ghi nhận.`
                : "Làm một bài để mở bảng phân tích và gợi ý cá nhân."}
            </p>
            {latestFull && (
              <Link
                href={`/ielts/${latestFull.testId}`}
                className="mt-3 inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
              >
                Đề full gần nhất: {latestFull.overallBand.toFixed(1)}
                <ChevronRight className="size-3.5" />
              </Link>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {skillStats.map((skill) => {
          const Icon = ICONS[skill.key];
          return (
            <Link key={skill.key} href={skill.href} className="group">
              <GlassCard hover className="h-full p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl"
                    style={{ background: `${skill.color}1c` }}
                  >
                    <Icon className="size-4.5" style={{ color: skill.color }} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-ink-900">{skill.name}</p>
                    <p className="text-[0.68rem] text-ink-450">{skill.count} lượt làm</p>
                  </div>
                  <span
                    className="ml-auto font-display text-xl font-semibold tabular-nums"
                    style={{ color: skill.latest === null ? "#9b7789" : skill.color }}
                  >
                    {skill.latest === null ? "--" : skill.latest.toFixed(1)}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-[0.68rem] text-ink-450">
                    <span>Điểm trung bình</span>
                    <span className="tabular-nums">
                      {skill.average === null ? "--" : skill.average.toFixed(1)}
                    </span>
                  </div>
                  <ProgressBar
                    value={skill.average ?? 0}
                    max={9}
                    color={skill.color}
                    height={5}
                  />
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-violet-500/15">
              <BrainCircuit className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs tracking-[0.16em] text-ink-450 uppercase">AI coach</p>
              <h3 className="font-display mt-1 text-lg font-semibold text-ink-900">
                Gợi ý bài tiếp theo
              </h3>
            </div>
            <Button
              className="ml-auto"
              variant="secondary"
              size="sm"
              onClick={() => void analyzeProgress()}
              loading={analyzing}
              disabled={scoreEntries.length === 0}
            >
              <RefreshCw className="size-4" />
              Phân tích điểm
            </Button>
          </div>

          {analysis ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/8 p-4">
                <p className="text-sm leading-relaxed text-violet-800">{analysis.summary}</p>
                <p className="mt-2 text-xs text-violet-700">
                  {analysis.mode === "ai" ? "Phân tích bằng AI" : "Gợi ý tự động từ dữ liệu điểm"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-200/70 bg-white/55 p-3.5">
                  <p className="text-xs text-ink-450">Nên ưu tiên</p>
                  <p className="mt-1 font-medium text-ink-900">
                    {analysis.prioritySkill === "full"
                      ? "Đề IELTS đầy đủ"
                      : SKILL_MAP[analysis.prioritySkill].name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{analysis.reason}</p>
                </div>
                <div className="rounded-2xl border border-rose-200/70 bg-white/55 p-3.5">
                  <p className="text-xs text-ink-450">Bài nên làm</p>
                  <p className="mt-1 font-medium text-ink-900">{analysis.recommendation}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    {analysis.nextActions[0]}
                  </p>
                </div>
              </div>
              <ButtonLink href={analysis.recommendedHref} size="sm">
                Làm bài được gợi ý
                <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-rose-300/60 bg-white/55 p-4">
              <p className="text-sm text-ink-700">
                {scoreEntries.length > 0
                  ? "Bấm phân tích để xem kỹ năng yếu nhất và bài nên làm tiếp."
                  : "Sau bài làm đầu tiên, AI sẽ có đủ dữ liệu để gợi ý lộ trình."}
              </p>
              {analysisError && <p className="mt-2 text-xs text-rose-700">{analysisError}</p>}
            </div>
          )}
          {analysisError && analysis && <p className="mt-3 text-xs text-rose-700">{analysisError}</p>}
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-emerald-500/14">
              <CheckCircle2 className="size-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs tracking-[0.16em] text-ink-450 uppercase">Full test</p>
              <h3 className="font-display mt-1 text-lg font-semibold text-ink-900">
                Thi thử như một buổi thật
              </h3>
            </div>
          </div>
          {latestFull ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{latestFull.testTitle}</p>
                  <p className="mt-1 text-xs text-ink-450">{formatDate(latestFull.createdAt)}</p>
                </div>
                <span
                  className="font-display text-3xl font-semibold tabular-nums"
                  style={{ color: bandColor(latestFull.overallBand) }}
                >
                  {latestFull.overallBand.toFixed(1)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {SKILLS.map((skill) => (
                  <div key={skill.key} className="rounded-xl border border-rose-200/70 bg-white/55 p-2 text-center">
                    <p className="text-[0.62rem] text-ink-450">{skill.name}</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums" style={{ color: skill.color }}>
                      {latestFull.bands[skill.key].toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-rose-300/60 bg-white/55 p-4">
              <p className="text-sm leading-relaxed text-ink-700">
                Ghép đủ bốn kỹ năng để nhận một band tổng cho cả đề.
              </p>
            </div>
          )}
          <ButtonLink href="/ielts" variant="secondary" size="sm" className="mt-5">
            Chọn một đề trong 10 đề
            <ArrowRight className="size-4" />
          </ButtonLink>
        </GlassCard>
      </div>
    </section>
  );
}

function ResumeRow({ item }: { item: ResumeProgress }) {
  const meta = item.skill ? SKILL_MAP[item.skill] : null;
  const percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
  const color = meta?.color ?? "#7c3aed";
  const Icon = item.skill ? ICONS[item.skill] : Clock3;

  return (
    <Link
      href={item.href}
      className="group block rounded-2xl border border-rose-200/70 bg-white/55 p-3.5 transition-colors hover:border-rose-200/70 hover:bg-white/70"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: `${color}1c` }}>
          <Icon className="size-4.5" style={{ color }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900">{item.title}</p>
          <p className="mt-0.5 text-xs text-ink-450">
            {item.detail ? `${item.phase} · ${item.detail}` : item.phase}
          </p>
        </div>
        <span className="hidden text-xs tabular-nums text-ink-500 sm:block">
          {item.completed}/{item.total}
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-450 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-900" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ProgressBar value={item.completed} max={item.total} color={color} height={4} />
        <span className="w-9 text-right text-[0.68rem] tabular-nums text-ink-450">{percent}%</span>
      </div>
    </Link>
  );
}
