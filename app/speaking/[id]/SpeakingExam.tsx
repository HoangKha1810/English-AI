"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Hourglass,
  RotateCcw,
  Send,
} from "lucide-react";
import type { AiFeedback, SpeakingPart, SpeakingTest } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Recorder } from "@/components/exam/Recorder";
import { AiFeedbackPanel } from "@/components/exam/AiFeedbackPanel";
import { useDraft, useSaveAttempt } from "@/lib/use-attempt";
import { removeResumeProgress, saveResumeProgress } from "@/lib/progress";
import { countWords, formatClock, formatDuration } from "@/lib/utils";

type Phase = "pick" | "prep" | "speak" | "transcribing" | "check" | "grading" | "result";

export function SpeakingExam({ test }: { test: SpeakingTest }) {
  const { save, saving } = useSaveAttempt();
  const [phase, setPhase] = useState<Phase>("pick");
  const [partIdx, setPartIdx] = useState(0);
  const [prepLeft, setPrepLeft] = useState(0);
  const [transcript, setTranscript, clearDraft] = useDraft<string>(
    `ielts:draft:speaking:${test.id}:p${partIdx + 1}`,
    ""
  );
  const [spokenSeconds, setSpokenSeconds] = useState(0);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [mode, setMode] = useState<"ai" | "heuristic">("ai");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const audioUrlRef = useRef<string | null>(null);

  const part: SpeakingPart = test.parts[partIdx];

  /* Dem nguoc thoi gian chuan bi cho Part 2 */
  useEffect(() => {
    if (phase !== "prep") return;
    if (prepLeft <= 0) {
      setPhase("speak");
      return;
    }
    const t = setTimeout(() => setPrepLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, prepLeft]);

  useEffect(() => {
    if (phase === "result" || phase === "grading" || phase === "transcribing") return;
    if (phase === "pick" && !transcript.trim()) return;
    saveResumeProgress({
      id: `skill:speaking:${test.id}`,
      kind: "skill",
      skill: "speaking",
      testId: test.id,
      title: test.title,
      href: `/speaking/${test.id}`,
      phase: phase === "pick" ? "Đang có bài nói dở" : "Đang làm Speaking",
      completed: phase === "pick" ? 0 : Math.min(test.parts.length, partIdx + 1),
      total: test.parts.length,
      detail: `Part ${part.part}`,
      updatedAt: Date.now(),
    });
  }, [part.part, partIdx, phase, test.id, test.parts.length, test.title, transcript]);

  const startPart = (i: number) => {
    const p = test.parts[i];
    setPartIdx(i);
    setFeedback(null);
    setError("");
    setNotice("");
    if (p.prepSeconds > 0) {
      setPrepLeft(p.prepSeconds);
      setPhase("prep");
    } else {
      setPhase("speak");
    }
  };

  const handleRecording = useCallback(async (blob: Blob, seconds: number) => {
    setSpokenSeconds(seconds);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = URL.createObjectURL(blob);
    setPhase("transcribing");
    setError("");

    try {
      const form = new FormData();
      form.append("audio", blob, "speech.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "Không chuyển được giọng nói thành văn bản.");
        setTranscript("");
      } else {
        setTranscript(data.text ?? "");
        if (!data.text) {
          setNotice("Không nghe rõ nội dung. Bạn có thể tự gõ lại phần mình nói.");
        }
      }
    } catch {
      setNotice("Không kết nối được tới dịch vụ chuyển giọng nói. Bạn có thể tự gõ lại.");
    } finally {
      setPhase("check");
    }
  }, []);

  const score = useCallback(async () => {
    setError("");
    setPhase("grading");
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Chấm bài thất bại.");
        setPhase("check");
        return;
      }
      setFeedback(data.feedback as AiFeedback);
      setMode(data.mode === "heuristic" ? "heuristic" : "ai");
      setPhase("result");
      window.scrollTo({ top: 0 });
      clearDraft();
      removeResumeProgress(`skill:speaking:${test.id}`);
      await save({
        skill: "speaking",
        testId: `${test.id}-p${part.part}`,
        testTitle: `${test.title} · Part ${part.part}`,
        band: (data.feedback as AiFeedback).overallBand,
        feedback: data.feedback as AiFeedback,
        answers: { transcript },
        durationSeconds: spokenSeconds,
      });
    } catch {
      setError("Không kết nối được tới máy chủ chấm bài.");
      setPhase("check");
    }
  }, [clearDraft, part, save, spokenSeconds, test.id, test.title, transcript]);

  /* ---------------------------- Chon part ---------------------------- */
  if (phase === "pick") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link
          href="/speaking"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Tất cả đề Speaking
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight">{test.title}</h1>
        <p className="mt-2 text-ink-500">
          Chủ đề: {test.topic}. Chọn part bạn muốn luyện.
        </p>

        <div className="mt-8 space-y-4">
          {test.parts.map((p, i) => (
            <GlassCard
              key={p.part}
              hover
              className="animate-fade-up p-6"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <Badge tone="emerald">Part {p.part}</Badge>
                  <h2 className="font-display mt-3 text-lg font-semibold text-ink-900">
                    {p.title}
                  </h2>
                  <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink-500">
                    {p.instruction}
                  </p>
                  {p.cueCard ? (
                    <p className="mt-3 text-[0.9rem] font-medium text-emerald-700 italic">
                      “{p.cueCard.topic}”
                    </p>
                  ) : (
                    <p className="mt-3 line-clamp-2 text-[0.85rem] text-ink-450">
                      {p.questions.slice(0, 2).join("  ·  ")}
                    </p>
                  )}
                </div>
                <Button onClick={() => startPart(i)} className="shrink-0">
                  Luyện Part {p.part}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  /* ------------------------------ Chuan bi ------------------------------ */
  if (phase === "prep") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <GlassCard strong className="animate-pop p-8 text-center sm:p-10">
          <Hourglass className="mx-auto size-8 animate-pulse text-emerald-700" />
          <p className="mt-4 text-sm text-ink-500">Thời gian chuẩn bị</p>
          <p className="font-display mt-1 text-6xl font-semibold text-ink-900 tabular-nums">
            {formatClock(prepLeft)}
          </p>

          {part.cueCard && (
            <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/8 p-6 text-left">
              <p className="font-display text-lg font-semibold text-ink-900">
                {part.cueCard.topic}
              </p>
              <p className="mt-3 text-[0.82rem] text-ink-500">You should say:</p>
              <ul className="mt-2 space-y-1.5">
                {part.cueCard.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-[0.92rem] text-ink-800">
                    <span className="text-emerald-600">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 text-[0.82rem] text-ink-500">
            Ghi nhanh vài ý ra giấy. Khi hết giờ bạn sẽ có {formatDuration(part.speakSeconds)} để nói.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setPhase("speak")}>
              Bỏ qua, nói luôn
            </Button>
            <Button variant="ghost" onClick={() => setPhase("pick")}>
              Quay lại
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  /* -------------------------- Dang chuyen van ban -------------------------- */
  if (phase === "transcribing" || phase === "grading") {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4">
        <GlassCard strong className="animate-pop max-w-md p-10 text-center">
          <Spinner />
          <h2 className="font-display mt-5 text-xl font-semibold text-ink-900">
            {phase === "transcribing"
              ? "Đang chuyển giọng nói thành văn bản"
              : "AI đang chấm phần nói của bạn"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            {phase === "transcribing"
              ? "Whisper đang nghe lại bản ghi của bạn, mất khoảng 5-15 giây."
              : "Đang đối chiếu với band descriptors của IELTS Speaking, mất khoảng 15-40 giây."}
          </p>
        </GlassCard>
      </div>
    );
  }

  /* ------------------------------ Ket qua ------------------------------ */
  if (phase === "result" && feedback) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div>
            <p className="text-sm text-ink-500">
              {test.title} · Part {part.part}
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink-900">
              Nhận xét chi tiết
            </h1>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => startPart(partIdx)}>
              <RotateCcw className="size-4" />
              Nói lại
            </Button>
            {partIdx < test.parts.length - 1 && (
              <Button size="sm" onClick={() => startPart(partIdx + 1)}>
                Part {test.parts[partIdx + 1].part}
              </Button>
            )}
            <ButtonLink href="/speaking" variant="ghost" size="sm">
              Đề khác
            </ButtonLink>
          </div>
        </div>

        {saving && <p className="mb-4 text-xs text-ink-450">Đang lưu kết quả...</p>}

        <AiFeedbackPanel feedback={feedback} mode={mode} />

        {audioUrlRef.current && (
          <GlassCard className="mt-5 p-5">
            <h3 className="font-display text-[0.95rem] font-semibold text-ink-900">
              Nghe lại bản ghi của bạn
            </h3>
            <audio src={audioUrlRef.current} controls className="mt-3 w-full" />
          </GlassCard>
        )}
      </div>
    );
  }

  /* --------------------------- Noi / kiem tra --------------------------- */
  const words = countWords(transcript);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <button
        onClick={() => setPhase("pick")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="size-4" />
        Chọn part khác
      </button>

      <GlassCard strong className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="emerald">Part {part.part}</Badge>
          <span className="text-sm text-ink-500">{test.topic}</span>
        </div>
        <h1 className="font-display mt-3 text-2xl font-semibold text-ink-900">
          {part.title}
        </h1>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-500">
          {part.instruction}
        </p>

        {part.cueCard ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/8 p-5">
            <p className="font-display text-lg font-semibold text-ink-900">
              {part.cueCard.topic}
            </p>
            <p className="mt-3 text-[0.8rem] text-ink-500">You should say:</p>
            <ul className="mt-2 space-y-1.5">
              {part.cueCard.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-[0.92rem] text-ink-800">
                  <span className="text-emerald-600">•</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="mt-6 space-y-2.5">
            {part.questions.map((q, i) => (
              <li
                key={q}
                className="flex gap-3 rounded-2xl border border-rose-200/70 bg-white/55 p-3.5"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-xl bg-white/85 text-xs font-semibold text-ink-700">
                  {i + 1}
                </span>
                <span className="text-[0.92rem] leading-relaxed text-ink-800">{q}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-7">
          <Recorder
            key={`${test.id}-${part.part}-${phase === "check" ? "done" : "live"}`}
            maxSeconds={part.speakSeconds}
            onComplete={handleRecording}
          />
        </div>

        {notice && (
          <div className="mt-4 flex gap-2.5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3.5">
            <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-amber-700" />
            <p className="text-[0.84rem] leading-relaxed text-amber-800">{notice}</p>
          </div>
        )}

        {phase === "check" && (
          <div className="mt-6">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-900">
              <FileText className="size-4 text-emerald-700" />
              Nội dung bạn đã nói
              <span className="ml-auto text-xs font-normal text-ink-500">
                {words} từ · {formatClock(spokenSeconds)}
              </span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Nếu nhận diện chưa chính xác, bạn có thể sửa lại ở đây trước khi chấm."
              className="min-h-40 w-full p-4 text-[0.95rem] leading-relaxed"
            />
            <p className="mt-1.5 text-[0.75rem] text-ink-450">
              AI chấm dựa trên văn bản này, nên hãy sửa cho đúng với những gì bạn thực sự
              nói.
            </p>

            {error && (
              <div className="mt-4 flex gap-2.5 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3.5">
                <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-rose-700" />
                <p className="text-[0.85rem] text-rose-800">{error}</p>
              </div>
            )}

            <Button
              className="mt-5 w-full"
              size="lg"
              onClick={() => void score()}
              disabled={words < 15}
            >
              <Send className="size-4.5" />
              {words < 15 ? "Cần ít nhất 15 từ để chấm" : "Chấm phần nói này"}
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
