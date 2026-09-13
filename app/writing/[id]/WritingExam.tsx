"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import type { AiFeedback, ChartSpec, WritingTask, WritingTest } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { AiFeedbackPanel } from "@/components/exam/AiFeedbackPanel";
import { ChartRenderer } from "@/components/ChartRenderer";
import { useSaveAttempt, useDraft } from "@/lib/use-attempt";
import { removeResumeProgress, saveResumeProgress } from "@/lib/progress";
import { cn, countWords } from "@/lib/utils";

type Phase = "pick" | "writing" | "grading" | "result";

function chartToText(chart?: ChartSpec): string | undefined {
  if (!chart) return undefined;
  const head = `${chart.title}${chart.unit ? ` (${chart.unit})` : ""}`;
  const cats = `Cột/nhóm: ${chart.categories.join(", ")}`;
  const rows = chart.series
    .map((s) => `${s.name}: ${s.values.join(", ")}`)
    .join("\n");
  return `${head}\n${cats}\n${rows}`;
}

export function WritingExam({ test }: { test: WritingTest }) {
  const { save, saving } = useSaveAttempt();
  const [phase, setPhase] = useState<Phase>("pick");
  const [taskIdx, setTaskIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [mode, setMode] = useState<"ai" | "heuristic">("ai");
  const [error, setError] = useState("");
  const [showIdeas, setShowIdeas] = useState(false);

  const task: WritingTask = test.tasks[taskIdx];
  const draftKey = `ielts:draft:writing:${test.id}:t${task.taskNumber}`;
  const [essay, setEssay, clearDraft] = useDraft<string>(draftKey, "");

  const words = useMemo(() => countWords(essay), [essay]);
  const short = words < task.minWords;

  useEffect(() => {
    if (phase === "result" || phase === "grading") return;
    if (phase === "pick" && !essay.trim()) return;
    saveResumeProgress({
      id: `skill:writing:${test.id}`,
      kind: "skill",
      skill: "writing",
      testId: test.id,
      title: test.title,
      href: `/writing/${test.id}`,
      phase: phase === "pick" ? "Đang có bài viết dở" : "Đang làm Writing",
      completed: Math.min(
        test.tasks.length,
        taskIdx + (words >= task.minWords ? 1 : 0)
      ),
      total: test.tasks.length,
      detail: `Task ${task.taskNumber}`,
      updatedAt: Date.now(),
    });
  }, [
    essay,
    phase,
    task.minWords,
    task.taskNumber,
    taskIdx,
    test.id,
    test.tasks.length,
    test.title,
    words,
  ]);

  const submit = useCallback(async () => {
    setError("");
    setPhase("grading");
    try {
      const res = await fetch("/api/score-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskNumber: task.taskNumber,
          prompt: task.prompt,
          essay,
          minWords: task.minWords,
          chartSummary: chartToText(task.chart),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Chấm bài thất bại.");
        setPhase("writing");
        return;
      }
      setFeedback(data.feedback as AiFeedback);
      setMode(data.mode === "heuristic" ? "heuristic" : "ai");
      setPhase("result");
      window.scrollTo({ top: 0 });
      clearDraft();
      removeResumeProgress(`skill:writing:${test.id}`);
      await save({
        skill: "writing",
        testId: `${test.id}-t${task.taskNumber}`,
        testTitle: `${test.title} · Task ${task.taskNumber}`,
        band: (data.feedback as AiFeedback).overallBand,
        feedback: data.feedback as AiFeedback,
        answers: { essay },
        durationSeconds: elapsed,
      });
    } catch {
      setError("Không kết nối được tới máy chủ chấm bài.");
      setPhase("writing");
    }
  }, [clearDraft, elapsed, essay, save, task, test.id, test.title]);

  /* ---------------------------- Chon task ---------------------------- */
  if (phase === "pick") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link
          href="/writing"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Tất cả đề Writing
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight">{test.title}</h1>
        <p className="mt-2 text-slate-400">Chọn phần bạn muốn luyện.</p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {test.tasks.map((t, i) => (
            <GlassCard
              key={t.taskNumber}
              hover
              className="animate-fade-up flex flex-col p-6"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-2">
                <Badge tone="amber">Task {t.taskNumber}</Badge>
                <span className="text-xs text-slate-400">{t.type}</span>
              </div>
              <p className="mt-4 flex-1 text-[0.9rem] leading-relaxed text-slate-300">
                {t.prompt}
              </p>
              <div className="mt-5 flex items-center gap-4 text-xs text-slate-400">
                <span>{t.durationMinutes} phút</span>
                <span>tối thiểu {t.minWords} từ</span>
              </div>
              <Button
                className="mt-5"
                onClick={() => {
                  setTaskIdx(i);
                  setPhase("writing");
                }}
              >
                Bắt đầu Task {t.taskNumber}
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------------------- Dang cham ---------------------------- */
  if (phase === "grading") {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4">
        <GlassCard strong className="animate-pop max-w-md p-10 text-center">
          <Spinner />
          <h2 className="font-display mt-5 text-xl font-semibold text-white">
            AI đang chấm bài của bạn
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Đang đối chiếu bài viết với bộ tiêu chí band descriptors, tìm lỗi ngữ pháp và
            soạn bài mẫu. Việc này thường mất 15-40 giây.
          </p>
        </GlassCard>
      </div>
    );
  }

  /* ----------------------------- Ket qua ----------------------------- */
  if (phase === "result" && feedback) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div>
            <p className="text-sm text-slate-400">
              {test.title} · Task {task.taskNumber}
            </p>
            <h1 className="font-display text-2xl font-semibold text-white">
              Nhận xét chi tiết
            </h1>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFeedback(null);
                setPhase("writing");
              }}
            >
              <RotateCcw className="size-4" />
              Viết lại
            </Button>
            <ButtonLink href="/writing" size="sm">
              Đề khác
            </ButtonLink>
          </div>
        </div>

        {saving && <p className="mb-4 text-xs text-slate-500">Đang lưu kết quả...</p>}

        <AiFeedbackPanel feedback={feedback} mode={mode} />

        <GlassCard className="mt-5 p-5">
          <h3 className="font-display text-[0.95rem] font-semibold text-white">
            Bài viết của bạn ({words} từ)
          </h3>
          <p className="mt-3 text-[0.9rem] leading-[1.9] whitespace-pre-wrap text-slate-400">
            {essay}
          </p>
        </GlassCard>
      </div>
    );
  }

  /* ----------------------------- Dang viet ----------------------------- */
  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-10 sm:px-6">
      <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-white/8 bg-ink-950/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {test.title} · Task {task.taskNumber}
            </p>
            <p className="text-[0.7rem] text-slate-400">{task.type}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium tabular-nums",
                short
                  ? "border-amber-400/35 bg-amber-500/12 text-amber-200"
                  : "border-emerald-400/35 bg-emerald-500/12 text-emerald-200"
              )}
            >
              {words} / {task.minWords} từ
            </span>
            <ExamTimer
              durationSeconds={task.durationMinutes * 60}
              running
              onTick={setElapsed}
              onExpire={() => void submit()}
            />
            <Button size="sm" onClick={() => void submit()} disabled={words < 20}>
              <Send className="size-4" />
              Nộp & chấm
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3.5">
          <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-rose-300" />
          <p className="text-[0.85rem] text-rose-100">{error}</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* De bai */}
        <div className="space-y-4 lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto lg:pr-1">
          <GlassCard className="p-5">
            <Badge tone="amber">Task {task.taskNumber}</Badge>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-400">
              {task.instruction}
            </p>
            <p className="mt-4 text-[1rem] leading-relaxed font-medium text-slate-100">
              {task.prompt}
            </p>
          </GlassCard>

          {task.chart && <ChartRenderer chart={task.chart} />}

          {task.ideas && task.ideas.length > 0 && (
            <GlassCard className="overflow-hidden">
              <button
                onClick={() => setShowIdeas((v) => !v)}
                className="flex w-full items-center gap-2 p-4 text-left"
              >
                <Lightbulb className="size-4.5 text-amber-300" />
                <span className="text-[0.9rem] font-medium text-white">
                  Gợi ý ý tưởng
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  {showIdeas ? "Ẩn" : "Xem"}
                </span>
              </button>
              {showIdeas && (
                <ul className="space-y-2 border-t border-white/8 px-4 py-4">
                  {task.ideas.map((idea, i) => (
                    <li key={i} className="flex gap-2 text-[0.85rem] leading-relaxed text-slate-300">
                      <span className="text-amber-400">•</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          )}

          {task.usefulLanguage && task.usefulLanguage.length > 0 && (
            <GlassCard className="p-4">
              <h3 className="flex items-center gap-2 text-[0.9rem] font-medium text-white">
                <BookOpen className="size-4.5 text-sky-300" />
                Cụm từ nên dùng
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {task.usefulLanguage.map((p) => (
                  <span
                    key={p}
                    className="rounded-lg border border-sky-400/20 bg-sky-500/8 px-2.5 py-1.5 text-[0.78rem] text-sky-100"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* O viet */}
        <GlassCard className="flex flex-col p-4 lg:h-[calc(100dvh-13rem)]">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="size-3.5 text-violet-300" />
            Bài viết tự động lưu khi bạn gõ
          </div>
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Bắt đầu viết bài của bạn ở đây..."
            spellCheck={false}
            className="min-h-[52vh] flex-1 resize-none p-4 text-[0.98rem] leading-[1.9]"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>
              {short
                ? `Còn thiếu ${task.minWords - words} từ nữa`
                : "Đã đủ số từ tối thiểu"}
            </span>
            <button
              onClick={() => {
                if (confirm("Xoá toàn bộ bài viết?")) setEssay("");
              }}
              className="text-slate-500 transition-colors hover:text-rose-300"
            >
              Xoá hết
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
