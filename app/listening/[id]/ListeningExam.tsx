"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Play, Send } from "lucide-react";
import type { ListeningTest } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { AnswerPalette } from "@/components/exam/AnswerPalette";
import { QuestionGroupBlock } from "@/components/exam/QuestionGroupBlock";
import { ResultPanel } from "@/components/exam/ResultPanel";
import { ListeningPlayer } from "@/components/exam/ListeningPlayer";
import {
  AnswerClip,
  AnswerClipProvider,
  useCueMap,
  useSectionAudio,
} from "@/components/exam/AnswerClip";
import { accuracyByType, gradeGroups, isAnswered, type AnswerMap } from "@/lib/grade";
import { bandFromRaw } from "@/lib/band";
import { useAuth } from "@/lib/auth-context";
import { useDraft, useSaveAttempt } from "@/lib/use-attempt";
import { removeResumeProgress, saveResumeProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Phase = "intro" | "doing" | "result" | "review";

export function ListeningExam({ test }: { test: ListeningTest }) {
  const { profile } = useAuth();
  const { save, saving } = useSaveAttempt();

  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers, clearDraft] = useDraft<AnswerMap>(
    `ielts:draft:listening:${test.id}`,
    {}
  );
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [sectionIdx, setSectionIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof gradeGroups> | null>(null);
  const [band, setBand] = useState(0);

  const allGroups = useMemo(() => test.sections.flatMap((s) => s.groups), [test]);
  const questionIds = useMemo(
    () => allGroups.flatMap((g) => g.questions.map((q) => q.id)),
    [allGroups]
  );
  const section = test.sections[sectionIdx];

  /* Moc thoi gian cua section, dung cho nut "nghe doan nay" khi xem lai */
  const sectionAudio = useSectionAudio(section);
  const cueMap = useCueMap(section, sectionAudio);

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
    const b = bandFromRaw(graded.correct, graded.total, "listening");
    setResult(graded);
    setBand(b);
    setPhase("result");
    window.scrollTo({ top: 0 });
    clearDraft();
    removeResumeProgress(`skill:listening:${test.id}`);
    await save({
      skill: "listening",
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
      id: `skill:listening:${test.id}`,
      kind: "skill",
      skill: "listening",
      testId: test.id,
      title: test.title,
      href: `/listening/${test.id}`,
      phase: phase === "intro" ? "Đang có bài làm dở" : "Đang làm Listening",
      completed: answeredCount,
      total: questionIds.length,
      detail: `Section ${section.number}`,
      updatedAt: Date.now(),
    });
  }, [answeredCount, phase, questionIds.length, section.number, test.id, test.title]);

  /* ---------------------------- Intro ---------------------------- */
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Link
          href="/listening"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Tất cả đề Listening
        </Link>

        <GlassCard strong className="animate-fade-up p-7 sm:p-10">
          <Badge tone="violet">IELTS Listening</Badge>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
            {test.title}
          </h1>

          <dl className="mt-7 grid grid-cols-3 gap-4">
            {[
              { k: "Thời gian", v: `${test.durationMinutes} phút` },
              { k: "Số câu", v: `${questionIds.length} câu` },
              { k: "Section", v: `${test.sections.length}` },
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
            <p className="font-medium text-ink-900">Cách làm</p>
            <ul className="space-y-1.5 text-ink-500">
              <li>• Mỗi section có một đoạn audio riêng, bấm nút phát để bắt đầu nghe.</li>
              <li>• Bạn được nghe lại nếu cần — trong phòng thi thật thì không, hãy tự giới hạn.</li>
              <li>• Transcript chỉ hiện sau khi nộp bài.</li>
              <li>• Bài làm được lưu tự động.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setPhase("doing")}>
              <Play className="size-4.5" />
              Bắt đầu làm bài
            </Button>
            <ButtonLink href="/listening" variant="secondary" size="lg">
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
          setShowTranscript(true);
          window.scrollTo({ top: 0 });
        }}
        retakeHref={`/listening/${test.id}`}
      />
    );
  }

  /* ------------------------ Doing / Review ------------------------ */
  const reviewing = phase === "review";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-rose-200/70 bg-white/82 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-900">{test.title}</p>
            <p className="text-[0.7rem] text-ink-500">
              {reviewing
                ? "Chế độ xem lại"
                : `Đã trả lời ${answeredCount}/${questionIds.length}`}
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
                <ButtonLink href="/listening" size="sm">
                  Đề khác
                </ButtonLink>
              </>
            ) : (
              <Button size="sm" onClick={() => void submit()}>
                <Send className="size-4" />
                Nộp bài
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {test.sections.map((s, i) => {
            const ids = s.groups.flatMap((g) => g.questions.map((q) => q.id));
            const done = ids.filter((id) => isAnswered(answers[String(id)])).length;
            return (
              <button
                key={s.number}
                onClick={() => {
                  setSectionIdx(i);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "shrink-0 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  i === sectionIdx
                    ? "border-violet-400/50 bg-violet-500/18 text-ink-900"
                    : "border-rose-200/80 bg-white/60 text-ink-500 hover:bg-white/75"
                )}
              >
                Section {s.number}
                <span className="ml-2 text-[0.68rem] text-ink-450 tabular-nums">
                  {done}/{ids.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_14rem]">
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-violet-600 uppercase">
                Section {section.number}
              </p>
              <h2 className="font-display mt-1 text-xl font-semibold text-ink-900">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-ink-500">{section.context}</p>
            </div>

            <ListeningPlayer
              key={`${test.id}-${section.number}`}
              src={section.audioSrc}
              transcript={section.transcript}
              voices={section.voices}
            />
          </GlassCard>

          <AnswerClipProvider src={section.audioSrc}>
            <div className="space-y-8">
              {section.groups.map((g) => (
                <QuestionGroupBlock
                  key={g.id}
                  group={g}
                  answers={answers}
                  onAnswer={setAnswer}
                  disabled={reviewing}
                  review={reviewing ? result?.perQuestion : undefined}
                  questionExtra={
                    reviewing && sectionAudio.available
                      ? (q) =>
                          cueMap[q.id] ? (
                            <AnswerClip questionId={q.id} cue={cueMap[q.id]} />
                          ) : null
                      : undefined
                  }
                />
              ))}
            </div>
          </AnswerClipProvider>

          {reviewing && (
            <GlassCard className="p-5">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="flex w-full items-center gap-2 text-left"
              >
                <FileText className="size-4 text-violet-600" />
                <span className="font-display font-semibold text-ink-900">
                  Transcript Section {section.number}
                </span>
                <span className="ml-auto text-xs text-ink-500">
                  {showTranscript ? "Ẩn" : "Hiện"}
                </span>
              </button>
              {showTranscript && (
                <div className="mt-4 space-y-2.5 border-t border-rose-200/70 pt-4">
                  {section.transcript.map((l, i) => (
                    <p key={i} className="text-[0.9rem] leading-relaxed text-ink-700">
                      {l.speaker && (
                        <span className="font-medium text-violet-600">{l.speaker}: </span>
                      )}
                      {l.text}
                    </p>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {!reviewing && sectionIdx < test.sections.length - 1 && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSectionIdx(sectionIdx + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Sang Section {test.sections[sectionIdx + 1].number}
            </Button>
          )}
        </div>

        <GlassCard className="hidden h-fit p-4 lg:block">
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
      </div>
    </div>
  );
}
