"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Highlighter,
  ListChecks,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Send,
} from "lucide-react";
import type { ReadingTest } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { AnswerPalette } from "@/components/exam/AnswerPalette";
import { QuestionGroupBlock } from "@/components/exam/QuestionGroupBlock";
import { ResultPanel } from "@/components/exam/ResultPanel";
import { HighlightableText, type Range2 } from "@/components/exam/HighlightableText";
import { accuracyByType, gradeGroups, isAnswered, type AnswerMap } from "@/lib/grade";
import { bandFromRaw } from "@/lib/band";
import { useAuth } from "@/lib/auth-context";
import { useDraft, useSaveAttempt } from "@/lib/use-attempt";
import { removeResumeProgress, saveResumeProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Phase = "intro" | "doing" | "result" | "review";

export function ReadingExam({ test }: { test: ReadingTest }) {
  const { profile } = useAuth();
  const { save, saving } = useSaveAttempt();

  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers, clearDraft] = useDraft<AnswerMap>(
    `ielts:draft:reading:${test.id}`,
    {}
  );
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [highlights, setHighlights] = useState<Record<string, Range2[]>>({});
  const [passageIdx, setPassageIdx] = useState(0);
  const [tab, setTab] = useState<"passage" | "questions">("passage");
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof gradeGroups> | null>(null);
  const [band, setBand] = useState(0);

  const allGroups = useMemo(
    () => test.passages.flatMap((p) => p.groups),
    [test]
  );
  const questionIds = useMemo(
    () => allGroups.flatMap((g) => g.questions.map((q) => q.id)),
    [allGroups]
  );
  const passage = test.passages[passageIdx];

  const setAnswer = useCallback(
    (id: number, value: string | string[]) => {
      setAnswers((prev) => ({ ...prev, [String(id)]: value }));
    },
    [setAnswers]
  );

  const toggleFlag = (id: number) =>
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = useCallback(async () => {
    const graded = gradeGroups(allGroups, answers);
    const b = bandFromRaw(graded.correct, graded.total, "reading-academic");
    setResult(graded);
    setBand(b);
    setPhase("result");
    window.scrollTo({ top: 0 });
    clearDraft();
    removeResumeProgress(`skill:reading:${test.id}`);
    await save({
      skill: "reading",
      testId: test.id,
      testTitle: test.title,
      band: b,
      correct: graded.correct,
      total: graded.total,
      durationSeconds: elapsed,
      answers: Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [k, Array.isArray(v) ? v.join(" | ") : v])
      ),
    });
  }, [allGroups, answers, clearDraft, elapsed, save, test.id, test.title]);

  const answeredCount = questionIds.filter((id) =>
    isAnswered(answers[String(id)])
  ).length;

  useEffect(() => {
    if (phase === "result") return;
    if (phase === "intro" && answeredCount === 0) return;
    saveResumeProgress({
      id: `skill:reading:${test.id}`,
      kind: "skill",
      skill: "reading",
      testId: test.id,
      title: test.title,
      href: `/reading/${test.id}`,
      phase: phase === "intro" ? "Đang có bài làm dở" : "Đang làm Reading",
      completed: answeredCount,
      total: questionIds.length,
      detail: `Passage ${passage.number}`,
      updatedAt: Date.now(),
    });
  }, [answeredCount, passage.number, phase, questionIds.length, test.id, test.title]);

  /* ---------------------------- Intro ---------------------------- */
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Link
          href="/reading"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Tất cả đề Reading
        </Link>

        <GlassCard strong className="animate-fade-up p-7 sm:p-10">
          <Badge tone="pink">{test.module}</Badge>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
            {test.title}
          </h1>

          <dl className="mt-7 grid grid-cols-3 gap-4">
            {[
              { k: "Thời gian", v: `${test.durationMinutes} phút` },
              { k: "Số câu", v: `${questionIds.length} câu` },
              { k: "Bài đọc", v: `${test.passages.length} bài` },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-rose-200/70 bg-white/60 p-3.5">
                <dt className="text-[0.7rem] text-ink-500">{x.k}</dt>
                <dd className="font-display mt-1 text-lg font-semibold text-ink-900">
                  {x.v}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 space-y-2.5 text-[0.9rem] leading-relaxed text-ink-700">
            <p className="font-medium text-ink-900">Trước khi bắt đầu</p>
            <ul className="space-y-1.5 text-ink-500">
              <li>• Đồng hồ bắt đầu chạy ngay khi bạn nhấn Bắt đầu, có thể tạm dừng.</li>
              <li>• Bài làm được lưu tự động, tải lại trang không mất dữ liệu.</li>
              <li>• Bôi đen chữ trong bài đọc để highlight, nhấp vào chỗ vàng để bỏ.</li>
              <li>• Chuột phải lên số câu ở bảng bên phải để đánh dấu câu cần xem lại.</li>
            </ul>
          </div>

          {Object.keys(answers).length > 0 && (
            <p className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-[0.85rem] text-amber-800">
              Bạn có một bài làm dở với {Object.keys(answers).length} câu đã trả lời. Nhấn
              Bắt đầu để làm tiếp.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setPhase("doing")}>
              <Play className="size-4.5" />
              Bắt đầu làm bài
            </Button>
            <ButtonLink href="/reading" variant="secondary" size="lg">
              Chọn đề khác
            </ButtonLink>
          </div>
        </GlassCard>
      </div>
    );
  }

  /* ---------------------------- Result ---------------------------- */
  if (phase === "result" && result) {
    return (
      <ResultPanel
        testTitle={test.title}
        band={band}
        correct={result.correct}
        total={result.total}
        durationSeconds={elapsed}
        weakTypes={accuracyByType(allGroups, result.perQuestion)}
        targetBand={profile?.targetBand}
        saving={saving}
        onReview={() => {
          setPhase("review");
          setTab("questions");
          window.scrollTo({ top: 0 });
        }}
        retakeHref={`/reading/${test.id}`}
      />
    );
  }

  /* ------------------------ Doing / Review ------------------------ */
  const reviewing = phase === "review";

  return (
    <div className="mx-auto max-w-[1600px] px-3 pb-6 sm:px-5">
      {/* Thanh dieu khien */}
      <div className="sticky top-16 z-30 -mx-3 mb-4 border-b border-rose-200/70 bg-white/82 px-3 py-3 backdrop-blur-xl sm:-mx-5 sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-900">{test.title}</p>
            <p className="text-[0.7rem] text-ink-500">
              {reviewing ? "Chế độ xem lại" : `Đã trả lời ${answeredCount}/${questionIds.length}`}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {!reviewing && (
              <ExamTimer
                durationSeconds={test.durationMinutes * 60}
                running
                onTick={setElapsed}
                onExpire={() => void submit()}
              />
            )}
            {reviewing ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setPhase("result")}>
                  Xem tổng kết
                </Button>
                <ButtonLink href="/reading" size="sm">
                  Đề khác
                </ButtonLink>
              </>
            ) : (
              <Button size="sm" onClick={() => void submit()}>
                <Send className="size-4" />
                Nộp bài
              </Button>
            )}
            <button
              onClick={() => setPaletteOpen((v) => !v)}
              className="hidden size-9 place-items-center rounded-xl border border-rose-200/80 bg-white/65 text-ink-700 hover:bg-white/85 xl:grid"
              title={paletteOpen ? "Ẩn bảng câu hỏi" : "Hiện bảng câu hỏi"}
            >
              {paletteOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Tab chon bai doc */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {test.passages.map((p, i) => {
            const ids = p.groups.flatMap((g) => g.questions.map((q) => q.id));
            const done = ids.filter((id) => isAnswered(answers[String(id)])).length;
            return (
              <button
                key={p.number}
                onClick={() => {
                  setPassageIdx(i);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "shrink-0 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  i === passageIdx
                    ? "border-pink-400/50 bg-pink-500/18 text-ink-900"
                    : "border-rose-200/80 bg-white/60 text-ink-500 hover:bg-white/75"
                )}
              >
                Passage {p.number}
                <span className="ml-2 text-[0.68rem] text-ink-450 tabular-nums">
                  {done}/{ids.length}
                </span>
              </button>
            );
          })}
          </div>

          {/* Tab mobile */}
          <div className="flex shrink-0 gap-1 rounded-xl border border-rose-200/80 bg-white/60 p-0.5 lg:hidden">
            {(["passage", "questions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  tab === t ? "bg-white/90 text-ink-900" : "text-ink-500"
                )}
              >
                {t === "passage" ? (
                  <BookOpen className="size-3.5" />
                ) : (
                  <ListChecks className="size-3.5" />
                )}
                {t === "passage" ? "Bài đọc" : "Câu hỏi"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Noi dung */}
      <div
        className={cn(
          "grid gap-4",
          paletteOpen
            ? "lg:grid-cols-2 xl:grid-cols-[1fr_1fr_15rem]"
            : "lg:grid-cols-2"
        )}
      >
        {/* Bai doc */}
        <GlassCard
          className={cn(
            "h-[calc(100dvh-13rem)] overflow-y-auto p-5 sm:p-6",
            tab === "questions" && "hidden lg:block"
          )}
        >
          <div className="mb-4 border-b border-rose-200/70 pb-4">
            <p className="text-xs font-semibold tracking-wider text-pink-700 uppercase">
              Reading Passage {passage.number}
            </p>
            <h2 className="font-display mt-1.5 text-2xl font-semibold text-ink-900">
              {passage.title}
            </h2>
            {passage.subtitle && (
              <p className="mt-1.5 text-sm text-ink-500">{passage.subtitle}</p>
            )}
            <p className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] text-ink-450">
              <Highlighter className="size-3.5" />
              Bôi đen đoạn văn để highlight
            </p>
          </div>

          <div className="passage text-[0.97rem] text-ink-700">
            {passage.paragraphs.map((para, i) => {
              const key = `${passage.number}-${i}`;
              return (
                <p key={key} className="mb-5 leading-[1.9]">
                  {para.label && (
                    <span className="mr-2 inline-grid size-6 place-items-center rounded-lg bg-pink-500/15 align-text-bottom text-xs font-semibold text-pink-700">
                      {para.label}
                    </span>
                  )}
                  <HighlightableText
                    text={para.text}
                    ranges={highlights[key] ?? []}
                    enabled={!reviewing}
                    onChange={(next) =>
                      setHighlights((prev) => ({ ...prev, [key]: next }))
                    }
                  />
                </p>
              );
            })}
          </div>
        </GlassCard>

        {/* Cau hoi */}
        <div
          className={cn(
            "h-[calc(100dvh-13rem)] overflow-y-auto pr-1",
            tab === "passage" && "hidden lg:block"
          )}
        >
          <div className="space-y-8">
            {passage.groups.map((g) => (
              <QuestionGroupBlock
                key={g.id}
                group={g}
                answers={answers}
                onAnswer={setAnswer}
                disabled={reviewing}
                review={reviewing ? result?.perQuestion : undefined}
              />
            ))}

            {passageIdx < test.passages.length - 1 && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setPassageIdx(passageIdx + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Sang Passage {test.passages[passageIdx + 1].number}
              </Button>
            )}
          </div>
        </div>

        {/* Bang cau hoi */}
        {paletteOpen && (
          <GlassCard className="hidden h-fit p-4 xl:block">
            <AnswerPalette
              questionIds={questionIds}
              answers={answers}
              flagged={flagged}
              onToggleFlag={reviewing ? undefined : toggleFlag}
              review={reviewing ? result?.perQuestion : undefined}
            />
            {!reviewing && (
              <Button className="mt-4 w-full" size="sm" onClick={() => void submit()}>
                <Send className="size-4" />
                Nộp bài
              </Button>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
}
