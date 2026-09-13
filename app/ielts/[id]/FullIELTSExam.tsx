"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Headphones,
  Mic,
  PenLine,
  Play,
  Send,
} from "lucide-react";
import type {
  IELTSFullTest,
  ListeningTest,
  ReadingTest,
  SpeakingPart,
  SpeakingTest,
  WritingTask,
  WritingTest,
  FullAttempt,
  Skill,
} from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { BandRing } from "@/components/ui/BandRing";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { ListeningPlayer } from "@/components/exam/ListeningPlayer";
import { QuestionGroupBlock } from "@/components/exam/QuestionGroupBlock";
import { Recorder } from "@/components/exam/Recorder";
import { ChartRenderer } from "@/components/ChartRenderer";
import { useAuth } from "@/lib/auth-context";
import { saveFullAttempt } from "@/lib/storage";
import {
  clearExamDraft,
  readExamDraft,
  removeResumeProgress,
  saveResumeProgress,
  writeExamDraft,
} from "@/lib/progress";
import { bandFromRaw, overallBand } from "@/lib/band";
import { gradeGroups, isAnswered, type AnswerMap } from "@/lib/grade";
import { countWords } from "@/lib/utils";

type ExamSection = "listening" | "reading" | "writing" | "speaking";
type Phase = "intro" | ExamSection | "grading" | "result";

interface FullDraft {
  section: ExamSection;
  listeningAnswers: AnswerMap;
  readingAnswers: AnswerMap;
  essays: { task1: string; task2: string };
  speakingTranscripts: Record<string, string>;
  speakingSeconds: Record<string, number>;
  speakingPartIndex: number;
  elapsedByPhase: Record<ExamSection, number>;
}

export interface FullIELTSBundle {
  full: IELTSFullTest;
  listening: ListeningTest;
  reading: ReadingTest;
  writing: WritingTest;
  speaking: SpeakingTest;
}

const SECTION_ORDER: ExamSection[] = ["listening", "reading", "writing", "speaking"];
const SECTION_META: Record<
  ExamSection,
  { label: string; minutes: number; color: string; icon: typeof Headphones }
> = {
  listening: { label: "Listening", minutes: 30, color: "#a78bfa", icon: Headphones },
  reading: { label: "Reading", minutes: 60, color: "#38bdf8", icon: BookOpen },
  writing: { label: "Writing", minutes: 60, color: "#fbbf24", icon: PenLine },
  speaking: { label: "Speaking", minutes: 14, color: "#34d399", icon: Mic },
};

function makeEmptyDraft(): FullDraft {
  return {
    section: "listening",
    listeningAnswers: {},
    readingAnswers: {},
    essays: { task1: "", task2: "" },
    speakingTranscripts: {},
    speakingSeconds: {},
    speakingPartIndex: 0,
    elapsedByPhase: {
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
    },
  };
}

function chartToText(chart?: WritingTask["chart"]): string | undefined {
  if (!chart) return undefined;
  return [
    `${chart.title}${chart.unit ? ` (${chart.unit})` : ""}`,
    `Categories: ${chart.categories.join(", ")}`,
    ...chart.series.map((series) => `${series.name}: ${series.values.join(", ")}`),
  ].join("\n");
}

async function scoreWritingTask(task: WritingTask, essay: string): Promise<number> {
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
    if (!res.ok) return 5.5;
    const data = (await res.json()) as { feedback?: { overallBand?: number } };
    const band = Number(data.feedback?.overallBand);
    return Number.isFinite(band) && band > 0 ? band : 5.5;
  } catch {
    return 5.5;
  }
}

async function scoreSpeakingPart(
  part: SpeakingPart,
  transcript: string,
  spokenSeconds: number
): Promise<number> {
  try {
    const res = await fetch("/api/score-speaking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: part.part,
        questions: part.questions,
        cueCard: part.cueCard ?? null,
        transcript,
        spokenSeconds,
      }),
    });
    if (!res.ok) return 5.5;
    const data = (await res.json()) as { feedback?: { overallBand?: number } };
    const band = Number(data.feedback?.overallBand);
    return Number.isFinite(band) && band > 0 ? band : 5.5;
  } catch {
    return 5.5;
  }
}

export function FullIELTSExam({ bundle }: { bundle: FullIELTSBundle }) {
  const { storageId } = useAuth();
  const { full, listening, reading, writing, speaking } = bundle;
  const draftKey = `ielts:full-draft:${full.id}`;
  const progressId = `full:${full.id}`;
  const [draft, setDraft] = useState<FullDraft>(() => makeEmptyDraft());
  const [phase, setPhase] = useState<Phase>("intro");
  const [resumeSection, setResumeSection] = useState<ExamSection | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [fullResult, setFullResult] = useState<FullAttempt | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingNotice, setSpeakingNotice] = useState("");
  const [savingResult, setSavingResult] = useState(false);
  const gradingRef = useRef(false);

  const listeningGroups = useMemo(
    () => listening.sections.flatMap((section) => section.groups),
    [listening]
  );
  const readingGroups = useMemo(
    () => reading.passages.flatMap((passage) => passage.groups),
    [reading]
  );
  const listeningQuestionCount = useMemo(
    () => listeningGroups.reduce((sum, group) => sum + group.questions.length, 0),
    [listeningGroups]
  );
  const readingQuestionCount = useMemo(
    () => readingGroups.reduce((sum, group) => sum + group.questions.length, 0),
    [readingGroups]
  );
  const listeningAnswered = useMemo(
    () =>
      listeningGroups
        .flatMap((group) => group.questions)
        .filter((question) => isAnswered(draft.listeningAnswers[String(question.id)])).length,
    [draft.listeningAnswers, listeningGroups]
  );
  const readingAnswered = useMemo(
    () =>
      readingGroups
        .flatMap((group) => group.questions)
        .filter((question) => isAnswered(draft.readingAnswers[String(question.id)])).length,
    [draft.readingAnswers, readingGroups]
  );
  const writingTasks = useMemo(
    () => [...writing.tasks].sort((a, b) => a.taskNumber - b.taskNumber),
    [writing.tasks]
  );
  const speakingPart = speaking.parts[draft.speakingPartIndex] ?? speaking.parts[0];
  const speakingTranscript = speakingPart
    ? draft.speakingTranscripts[String(speakingPart.part)] ?? ""
    : "";
  const currentWritingProgress = writingTasks.filter((task) => {
    const key = task.taskNumber === 1 ? "task1" : "task2";
    return countWords(draft.essays[key]) >= task.minWords;
  }).length;

  useEffect(() => {
    const saved = readExamDraft<Partial<FullDraft> | null>(draftKey, null);
    const next = makeEmptyDraft();
    if (saved) {
      next.section =
        saved.section === "reading" ||
        saved.section === "writing" ||
        saved.section === "speaking"
          ? saved.section
          : "listening";
      next.listeningAnswers = saved.listeningAnswers ?? {};
      next.readingAnswers = saved.readingAnswers ?? {};
      next.essays = { ...next.essays, ...(saved.essays ?? {}) };
      next.speakingTranscripts = saved.speakingTranscripts ?? {};
      next.speakingSeconds = saved.speakingSeconds ?? {};
      next.speakingPartIndex = Math.min(
        Math.max(0, saved.speakingPartIndex ?? 0),
        Math.max(0, speaking.parts.length - 1)
      );
      next.elapsedByPhase = { ...next.elapsedByPhase, ...(saved.elapsedByPhase ?? {}) };
      setResumeSection(next.section);
      setDraft(next);
    }
    setHydrated(true);
  }, [draftKey, speaking.parts.length]);

  useEffect(() => {
    if (!hydrated || phase === "intro" || phase === "grading" || phase === "result") return;
    const nextDraft = { ...draft, section: phase };
    writeExamDraft(draftKey, nextDraft);

    const completed =
      phase === "listening"
        ? listeningAnswered
        : phase === "reading"
          ? readingAnswered
          : phase === "writing"
            ? currentWritingProgress
            : draft.speakingPartIndex + 1;
    const total =
      phase === "listening"
        ? listeningQuestionCount
        : phase === "reading"
          ? readingQuestionCount
          : phase === "writing"
            ? Math.max(2, writingTasks.length)
            : speaking.parts.length;
    const detail =
      phase === "listening"
        ? `${listeningAnswered}/${listeningQuestionCount} câu`
        : phase === "reading"
          ? `${readingAnswered}/${readingQuestionCount} câu`
          : phase === "writing"
            ? `${currentWritingProgress}/${writingTasks.length} task đủ từ`
            : `Part ${speakingPart?.part ?? 1}`;

    saveResumeProgress({
      id: progressId,
      kind: "full",
      testId: full.id,
      title: full.title,
      href: `/ielts/${full.id}`,
      phase: `Đang làm ${SECTION_META[phase].label}`,
      completed,
      total,
      detail,
      updatedAt: Date.now(),
    });
  }, [
    currentWritingProgress,
    draft,
    draftKey,
    full.id,
    full.title,
    hydrated,
    listeningAnswered,
    listeningQuestionCount,
    phase,
    progressId,
    readingAnswered,
    readingQuestionCount,
    speaking.parts.length,
    speakingPart?.part,
    writingTasks.length,
  ]);

  const goTo = useCallback((next: ExamSection) => {
    setDraft((current) => ({ ...current, section: next }));
    setPhase(next);
    window.scrollTo({ top: 0 });
  }, []);

  const updateElapsed = useCallback((section: ExamSection, elapsed: number) => {
    setDraft((current) => ({
      ...current,
      elapsedByPhase: { ...current.elapsedByPhase, [section]: elapsed },
    }));
  }, []);

  const updateAnswer = useCallback(
    (section: "listeningAnswers" | "readingAnswers", id: number, value: string | string[]) => {
      setDraft((current) => ({
        ...current,
        [section]: { ...current[section], [String(id)]: value },
      }));
    },
    []
  );

  const handleRecording = useCallback(
    async (blob: Blob, seconds: number) => {
      if (!speakingPart) return;
      const key = String(speakingPart.part);
      setSpeakingNotice("");
      setTranscribing(true);
      setDraft((current) => ({
        ...current,
        speakingSeconds: { ...current.speakingSeconds, [key]: seconds },
      }));
      try {
        const form = new FormData();
        form.append("audio", blob, "speaking.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) {
          setSpeakingNotice(data.error ?? "Không chuyển được giọng nói thành văn bản.");
        } else {
          setDraft((current) => ({
            ...current,
            speakingTranscripts: {
              ...current.speakingTranscripts,
              [key]: data.text ?? "",
            },
          }));
          if (!data.text) setSpeakingNotice("Bạn có thể gõ lại nội dung mình đã nói.");
        }
      } catch {
        setSpeakingNotice("Không kết nối được dịch vụ chuyển giọng nói. Hãy gõ transcript thủ công.");
      } finally {
        setTranscribing(false);
      }
    },
    [speakingPart]
  );

  const gradeFull = useCallback(async () => {
    if (gradingRef.current) return;
    gradingRef.current = true;
    setPhase("grading");
    setSavingResult(true);

    const listeningGrade = gradeGroups(listeningGroups, draft.listeningAnswers);
    const readingGrade = gradeGroups(readingGroups, draft.readingAnswers);
    const listeningBand = bandFromRaw(
      listeningGrade.correct,
      listeningGrade.total,
      "listening"
    );
    const readingBand = bandFromRaw(
      readingGrade.correct,
      readingGrade.total,
      "reading-academic"
    );
    const writingBands = await Promise.all(
      writingTasks.map((task) =>
        scoreWritingTask(
          task,
          draft.essays[task.taskNumber === 1 ? "task1" : "task2"]
        )
      )
    );
    const speakingBands = await Promise.all(
      speaking.parts.map((part) =>
        scoreSpeakingPart(
          part,
          draft.speakingTranscripts[String(part.part)] ?? "",
          draft.speakingSeconds[String(part.part)] ?? 0
        )
      )
    );
    const bands: Record<Skill, number> = {
      listening: listeningBand,
      reading: readingBand,
      writing: writingBands.length > 0 ? writingBands.reduce((a, b) => a + b, 0) / writingBands.length : 5.5,
      speaking: speakingBands.length > 0 ? speakingBands.reduce((a, b) => a + b, 0) / speakingBands.length : 5.5,
    };
    const normalizedBands: Record<Skill, number> = {
      ...bands,
      writing: Math.round(bands.writing * 2) / 2,
      speaking: Math.round(bands.speaking * 2) / 2,
    };
    const overall = overallBand(Object.values(normalizedBands)) ?? 0;
    const attempt: FullAttempt = {
      uid: storageId,
      testId: full.id,
      testTitle: full.title,
      bands: normalizedBands,
      overallBand: overall,
      durationSeconds: Object.values(draft.elapsedByPhase).reduce((a, b) => a + b, 0),
      createdAt: Date.now(),
    };

    try {
      await saveFullAttempt(attempt);
    } catch (error) {
      console.warn("[IELTS Lab] Không lưu được kết quả đề full:", error);
    }
    setFullResult(attempt);
    clearExamDraft(draftKey);
    removeResumeProgress(progressId);
    setSavingResult(false);
    setPhase("result");
    window.scrollTo({ top: 0 });
    gradingRef.current = false;
  }, [
    draft,
    draftKey,
    full.id,
    full.title,
    listeningGroups,
    readingGroups,
    progressId,
    speaking.parts,
    storageId,
    writingTasks,
  ]);

  const nextSection = phase !== "intro" && phase !== "grading" && phase !== "result"
    ? SECTION_ORDER[SECTION_ORDER.indexOf(phase) + 1]
    : undefined;

  const renderTimer = (section: ExamSection) => (
    <ExamTimer
      key={section}
      durationSeconds={SECTION_META[section].minutes * 60}
      initialElapsed={draft.elapsedByPhase[section]}
      running
      allowPause={false}
      onTick={(elapsed) => updateElapsed(section, elapsed)}
      onExpire={() => {
        if (section === "speaking") void gradeFull();
        else if (nextSection) goTo(nextSection);
      }}
    />
  );

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link href="/ielts" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="size-4" />
          Tất cả đề IELTS
        </Link>
        <GlassCard strong className="animate-fade-up overflow-hidden">
          <div className="border-b border-white/8 px-6 py-8 sm:px-10">
            <Badge tone="violet">IELTS Full Test</Badge>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-white">
              {full.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Một lượt thi đủ bốn kỹ năng, ghép từ các đề tương đương và tính band tổng sau khi hoàn tất.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {full.topics.map((topic) => (
                <span key={topic} className="rounded-lg border border-white/10 bg-white/4 px-2.5 py-1.5 text-xs text-slate-300">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-px bg-white/8 sm:grid-cols-4">
            {SECTION_ORDER.map((section) => {
              const meta = SECTION_META[section];
              const Icon = meta.icon;
              return (
                <div key={section} className="bg-ink-900/80 p-5">
                  <Icon className="size-5" style={{ color: meta.color }} />
                  <p className="mt-3 text-sm font-medium text-white">{meta.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{meta.minutes} phút</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 px-6 py-6 sm:px-10">
            <Button size="lg" onClick={() => goTo(resumeSection ?? "listening")}>
              <Play className="size-4.5" />
              {resumeSection ? "Tiếp tục bài đang làm" : "Bắt đầu đề IELTS"}
            </Button>
            <ButtonLink href="/ielts" variant="secondary" size="lg">
              Chọn đề khác
            </ButtonLink>
            {resumeSection && (
              <p className="w-full text-xs text-amber-200/80">
                Đang dở phần {SECTION_META[resumeSection].label}. Câu trả lời và thời gian đã được lưu.
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (phase === "grading") {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4">
        <GlassCard strong className="animate-pop max-w-md p-10 text-center">
          <Spinner />
          <h2 className="font-display mt-5 text-xl font-semibold text-white">
            Đang chấm đề IELTS
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Listening và Reading đang được quy đổi band. Writing và Speaking đang được AI phân tích theo tiêu chí IELTS.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (phase === "result" && fullResult) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <GlassCard strong className="animate-pop overflow-hidden">
          <div className="px-6 py-10 text-center sm:px-10">
            <p className="text-sm text-slate-400">{fullResult.testTitle}</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-white">
              Kết quả đề IELTS
            </h1>
            <div className="mt-7 flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
              <BandRing band={fullResult.overallBand} size={172} caption="Overall band" />
              <div className="w-full max-w-sm text-left">
                <p className="text-sm leading-relaxed text-slate-300">
                  {savingResult
                    ? "Đang lưu kết quả..."
                    : "Bạn đã hoàn thành đủ Listening, Reading, Writing và Speaking."}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {SECTION_ORDER.map((section) => {
                    const meta = SECTION_META[section];
                    return (
                      <div key={section} className="rounded-xl border border-white/8 bg-white/4 p-3.5">
                        <p className="text-xs text-slate-500">{meta.label}</p>
                        <p className="font-display mt-1 text-2xl font-semibold tabular-nums" style={{ color: meta.color }}>
                          {fullResult.bands[section].toFixed(1)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-white/8 px-6 py-6 sm:px-10">
            <ButtonLink href="/ielts" variant="secondary">
              Chọn đề full khác
            </ButtonLink>
            <ButtonLink href="/" className="ml-auto">
              Về trang chủ
              <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </GlassCard>
      </div>
    );
  }

  const activeSection = phase as ExamSection;
  const meta = SECTION_META[activeSection];
  const sectionIndex = SECTION_ORDER.indexOf(activeSection);

  return (
    <div className="mx-auto max-w-7xl px-3 pb-10 sm:px-5">
      <div className="sticky top-16 z-30 -mx-3 mb-5 border-b border-white/8 bg-ink-950/90 px-3 py-3 backdrop-blur-xl sm:-mx-5 sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{full.title}</p>
            <p className="text-[0.7rem] text-slate-400">
              Phần {sectionIndex + 1}/4 · {meta.label}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {renderTimer(activeSection)}
            {nextSection ? (
              <Button size="sm" onClick={() => goTo(nextSection)}>
                Sang {SECTION_META[nextSection].label}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => void gradeFull()}>
                <Send className="size-4" />
                Nộp & nhận band
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {SECTION_ORDER.map((section, index) => {
            const item = SECTION_META[section];
            const Icon = item.icon;
            return (
              <div
                key={section}
                className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                  index <= sectionIndex
                    ? "border-white/15 bg-white/8 text-white"
                    : "border-white/6 bg-white/3 text-slate-500"
                }`}
              >
                <Icon className="size-3.5 shrink-0" style={{ color: index <= sectionIndex ? item.color : undefined }} />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {activeSection === "listening" && (
        <ListeningSection
          test={listening}
          answers={draft.listeningAnswers}
          onAnswer={(id, value) => updateAnswer("listeningAnswers", id, value)}
          onNext={() => nextSection && goTo(nextSection)}
        />
      )}
      {activeSection === "reading" && (
        <ReadingSection
          test={reading}
          answers={draft.readingAnswers}
          onAnswer={(id, value) => updateAnswer("readingAnswers", id, value)}
          onNext={() => nextSection && goTo(nextSection)}
        />
      )}
      {activeSection === "writing" && (
        <WritingSection
          test={writing}
          essays={draft.essays}
          onEssay={(key, value) =>
            setDraft((current) => ({ ...current, essays: { ...current.essays, [key]: value } }))
          }
          onNext={() => nextSection && goTo(nextSection)}
        />
      )}
      {activeSection === "speaking" && speakingPart && (
        <SpeakingSection
          test={speaking}
          part={speakingPart}
          partIndex={draft.speakingPartIndex}
          transcript={speakingTranscript}
          transcribing={transcribing}
          notice={speakingNotice}
          onTranscript={(value) =>
            setDraft((current) => ({
              ...current,
              speakingTranscripts: {
                ...current.speakingTranscripts,
                [String(speakingPart.part)]: value,
              },
            }))
          }
          onRecording={handleRecording}
          onNext={() => {
            setSpeakingNotice("");
            if (draft.speakingPartIndex < speaking.parts.length - 1) {
              setDraft((current) => ({
                ...current,
                speakingPartIndex: current.speakingPartIndex + 1,
              }));
              window.scrollTo({ top: 0 });
            } else {
              void gradeFull();
            }
          }}
        />
      )}
    </div>
  );
}

function ListeningSection({
  test,
  answers,
  onAnswer,
  onNext,
}: {
  test: ListeningTest;
  answers: AnswerMap;
  onAnswer: (id: number, value: string | string[]) => void;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeading
        icon={Headphones}
        color="#a78bfa"
        eyebrow="Listening"
        title="Nghe và trả lời toàn bộ câu hỏi"
        text="Mỗi section có audio riêng. Bạn có thể chuyển tiếp khi hoàn tất phần Listening."
      />
      {test.sections.map((section) => (
        <GlassCard key={section.number} className="p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-wider text-violet-300 uppercase">
            Section {section.number}
          </p>
          <h2 className="font-display mt-1 text-xl font-semibold text-white">{section.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{section.context}</p>
          <div className="mt-5">
            <ListeningPlayer
              src={section.audioSrc}
              transcript={section.transcript}
              voices={section.voices}
            />
          </div>
          <div className="mt-7 space-y-8">
            {section.groups.map((group) => (
              <QuestionGroupBlock
                key={group.id}
                group={group}
                answers={answers}
                onAnswer={onAnswer}
              />
            ))}
          </div>
        </GlassCard>
      ))}
      <SectionNextButton label="Sang Reading" icon={BookOpen} onClick={onNext} />
    </div>
  );
}

function ReadingSection({
  test,
  answers,
  onAnswer,
  onNext,
}: {
  test: ReadingTest;
  answers: AnswerMap;
  onAnswer: (id: number, value: string | string[]) => void;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeading
        icon={BookOpen}
        color="#38bdf8"
        eyebrow="Reading"
        title="Đọc các passage và hoàn thành câu hỏi"
        text="Các passage trong đề full được ghép từ bài Reading tương ứng."
      />
      {test.passages.map((passage) => (
        <GlassCard key={passage.number} className="p-5 sm:p-7">
          <div className="border-b border-white/8 pb-5">
            <p className="text-xs font-semibold tracking-wider text-sky-300 uppercase">
              Passage {passage.number}
            </p>
            <h2 className="font-display mt-1.5 text-2xl font-semibold text-white">
              {passage.title}
            </h2>
            {passage.subtitle && <p className="mt-1.5 text-sm text-slate-400">{passage.subtitle}</p>}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <article className="passage text-[0.97rem] text-slate-300">
              {passage.paragraphs.map((paragraph, index) => (
                <p key={index} className="mb-5 leading-[1.9]">
                  {paragraph.label && (
                    <span className="mr-2 inline-grid size-6 place-items-center rounded-md bg-sky-500/15 align-text-bottom text-xs font-semibold text-sky-300">
                      {paragraph.label}
                    </span>
                  )}
                  {paragraph.text}
                </p>
              ))}
            </article>
            <div className="space-y-8">
              {passage.groups.map((group) => (
                <QuestionGroupBlock
                  key={group.id}
                  group={group}
                  answers={answers}
                  onAnswer={onAnswer}
                />
              ))}
            </div>
          </div>
        </GlassCard>
      ))}
      <SectionNextButton label="Sang Writing" icon={PenLine} onClick={onNext} />
    </div>
  );
}

function WritingSection({
  test,
  essays,
  onEssay,
  onNext,
}: {
  test: WritingTest;
  essays: FullDraft["essays"];
  onEssay: (key: "task1" | "task2", value: string) => void;
  onNext: () => void;
}) {
  const tasks = [...test.tasks].sort((a, b) => a.taskNumber - b.taskNumber);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHeading
        icon={PenLine}
        color="#fbbf24"
        eyebrow="Writing"
        title="Hoàn thành Task 1 và Task 2"
        text="AI sẽ chấm từng task theo tiêu chí IELTS rồi lấy band trung bình cho kỹ năng Writing."
      />
      {tasks.map((task) => {
        const key = task.taskNumber === 1 ? "task1" : "task2";
        const essay = essays[key];
        const words = countWords(essay);
        return (
          <GlassCard key={task.taskNumber} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="amber">Task {task.taskNumber}</Badge>
              <span className="text-xs text-slate-400">{task.type}</span>
              <span className="ml-auto text-xs tabular-nums text-slate-500">
                {words}/{task.minWords} từ
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{task.instruction}</p>
            <p className="mt-3 text-[1rem] font-medium leading-relaxed text-white">{task.prompt}</p>
            {task.chart && <div className="mt-5"><ChartRenderer chart={task.chart} /></div>}
            <textarea
              value={essay}
              onChange={(event) => onEssay(key, event.target.value)}
              placeholder={`Viết câu trả lời cho Task ${task.taskNumber}...`}
              spellCheck={false}
              className="mt-5 min-h-64 w-full p-4 text-[0.95rem] leading-[1.9]"
            />
          </GlassCard>
        );
      })}
      <SectionNextButton label="Sang Speaking" icon={Mic} onClick={onNext} />
    </div>
  );
}

function SpeakingSection({
  test,
  part,
  partIndex,
  transcript,
  transcribing,
  notice,
  onTranscript,
  onRecording,
  onNext,
}: {
  test: SpeakingTest;
  part: SpeakingPart;
  partIndex: number;
  transcript: string;
  transcribing: boolean;
  notice: string;
  onTranscript: (value: string) => void;
  onRecording: (blob: Blob, seconds: number) => void;
  onNext: () => void;
}) {
  const words = countWords(transcript);
  const isLast = partIndex === test.parts.length - 1;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading
        icon={Mic}
        color="#34d399"
        eyebrow={`Speaking · Part ${part.part}`}
        title={part.title}
        text="Ghi âm câu trả lời, kiểm tra transcript và chuyển sang part tiếp theo khi sẵn sàng."
      />
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {test.parts.map((item, index) => (
          <span
            key={item.part}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs ${
              index === partIndex
                ? "border-emerald-400/40 bg-emerald-500/14 text-emerald-100"
                : index < partIndex
                  ? "border-white/12 bg-white/8 text-slate-300"
                  : "border-white/8 bg-white/3 text-slate-500"
            }`}
          >
            Part {item.part}
          </span>
        ))}
      </div>
      <GlassCard className="p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-slate-300">{part.instruction}</p>
        {part.cueCard ? (
          <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/8 p-5">
            <p className="font-display text-lg font-semibold text-white">{part.cueCard.topic}</p>
            <ul className="mt-3 space-y-1.5">
              {part.cueCard.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm text-slate-200">
                  <span className="text-emerald-400">•</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="mt-5 space-y-2.5">
            {part.questions.map((question, index) => (
              <li key={question} className="flex gap-3 rounded-xl border border-white/8 bg-white/3 p-3.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-white/10 text-xs text-slate-300">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-slate-200">{question}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-6">
          <Recorder
            key={`${test.id}-full-${part.part}`}
            maxSeconds={part.speakSeconds}
            onComplete={onRecording}
          />
        </div>
        {notice && <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-100">{notice}</p>}
        <label className="mt-6 block">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <FileText className="size-4 text-emerald-300" />
            Transcript
            <span className="ml-auto text-xs font-normal text-slate-500">{words} từ</span>
          </span>
          <textarea
            value={transcript}
            onChange={(event) => onTranscript(event.target.value)}
            placeholder="Bạn có thể sửa transcript hoặc gõ câu trả lời thủ công."
            className="mt-2 min-h-40 w-full p-4 text-[0.95rem] leading-relaxed"
          />
        </label>
        <Button
          className="mt-5 w-full"
          size="lg"
          onClick={onNext}
          disabled={transcribing}
          loading={transcribing}
        >
          {isLast ? "Hoàn tất và nhận band" : "Sang Part tiếp theo"}
          {!transcribing && <ArrowRight className="size-4.5" />}
        </Button>
      </GlassCard>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  color,
  eyebrow,
  title,
  text,
}: {
  icon: typeof Headphones;
  color: string;
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 px-1">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${color}1c` }}>
        <Icon className="size-5" style={{ color }} />
      </span>
      <div>
        <p className="text-xs tracking-[0.16em] uppercase" style={{ color }}>{eyebrow}</p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function SectionNextButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Headphones;
  onClick: () => void;
}) {
  return (
    <Button size="lg" className="w-full" onClick={onClick}>
      {label}
      <Icon className="size-4.5" />
      <ArrowRight className="size-4" />
    </Button>
  );
}
