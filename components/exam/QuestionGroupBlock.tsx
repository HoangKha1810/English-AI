"use client";

import { Check, X } from "lucide-react";
import type { Question, QuestionGroup } from "@/lib/types";
import type { AnswerMap } from "@/lib/grade";
import { cn } from "@/lib/utils";
import { BlankInput } from "./BlankInput";
import { introHasBlanks, parseIntro, splitPrompt } from "./blanks";

interface Props {
  group: QuestionGroup;
  answers: AnswerMap;
  onAnswer: (questionId: number, value: string | string[]) => void;
  disabled?: boolean;
  /** Che do xem lai: map id -> dung/sai */
  review?: Record<number, boolean>;
}

/** Chip khi option ngan, dropdown khi option dai */
function useChips(options?: string[]) {
  if (!options || options.length === 0) return false;
  if (options.length <= 4) return true;
  return options.every((o) => o.length <= 4);
}

export function QuestionGroupBlock({
  group,
  answers,
  onAnswer,
  disabled,
  review,
}: Props) {
  const ids = group.questions.map((q) => q.id);
  const inlineIntro = introHasBlanks(group.intro);
  const chips = useChips(group.options);

  const stateOf = (id: number): "correct" | "wrong" | undefined =>
    review ? (review[id] ? "correct" : "wrong") : undefined;

  const valueOf = (id: number): string => {
    const v = answers[String(id)];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };

  return (
    <section className="scroll-mt-24" id={`group-${group.id}`}>
      <div className="mb-4 rounded-xl border border-white/10 bg-white/4 p-4">
        <p className="font-display text-sm font-semibold text-violet-300">
          {group.range}
        </p>
        <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-300">
          {group.instruction}
        </p>
        {group.wordLimit && (
          <p className="mt-2 inline-block rounded-md bg-amber-500/12 px-2 py-1 text-[0.72rem] font-medium text-amber-200">
            Giới hạn: {group.wordLimit}
          </p>
        )}
      </div>

      {/* Option bank dung chung */}
      {group.options && group.options.length > 0 && !chips && (
        <div className="mb-5 rounded-xl border border-sky-400/18 bg-sky-500/6 p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-sky-300 uppercase">
            Danh sách lựa chọn
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {group.options.map((o) => (
              <li key={o} className="text-[0.86rem] leading-snug text-slate-300">
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bang bieu / tom tat co o trong */}
      {group.intro && inlineIntro && (
        <div className="mb-5 rounded-xl border border-white/10 bg-ink-850/60 p-5">
          <p className="text-[0.95rem] leading-[2.6] whitespace-pre-wrap text-slate-200">
            {parseIntro(group.intro, ids).map((tok, i) =>
              tok.kind === "text" ? (
                <span key={i}>{tok.value}</span>
              ) : (
                <BlankInput
                  key={i}
                  id={tok.questionId}
                  value={valueOf(tok.questionId)}
                  onChange={(v) => onAnswer(tok.questionId, v)}
                  disabled={disabled}
                  state={stateOf(tok.questionId)}
                  label={
                    group.questions.find((q) => q.id === tok.questionId)?.prompt
                  }
                />
              )
            )}
          </p>
        </div>
      )}

      {group.intro && !inlineIntro && (
        <div className="mb-5 rounded-xl border border-white/10 bg-ink-850/60 p-5 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-slate-200">
          {group.intro}
        </div>
      )}

      {/* Xem lai cac cau nam trong bang bieu */}
      {inlineIntro && review && (
        <ol className="space-y-2.5">
          {group.questions.map((q) => (
            <ReviewRow
              key={q.id}
              q={q}
              given={answers[String(q.id)]}
              ok={review[q.id]}
            />
          ))}
        </ol>
      )}

      {/* Danh sach cau hoi */}
      {!inlineIntro && (
        <ol className="space-y-4">
          {group.questions.map((q) => (
            <QuestionRow
              key={q.id}
              q={q}
              group={group}
              chips={chips}
              value={answers[String(q.id)]}
              onAnswer={onAnswer}
              disabled={disabled}
              state={stateOf(q.id)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function QuestionRow({
  q,
  group,
  chips,
  value,
  onAnswer,
  disabled,
  state,
}: {
  q: Question;
  group: QuestionGroup;
  chips: boolean;
  value: string | string[] | undefined;
  onAnswer: (id: number, v: string | string[]) => void;
  disabled?: boolean;
  state?: "correct" | "wrong";
}) {
  const single = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  const multi = Array.isArray(value) ? value : value ? [value] : [];
  const bank = q.options ?? group.options;
  const parts = splitPrompt(q.prompt);

  return (
    <li
      id={`q-row-${q.id}`}
      className={cn(
        "scroll-mt-24 rounded-xl border p-4 transition-colors",
        state === "correct"
          ? "border-emerald-400/30 bg-emerald-500/6"
          : state === "wrong"
            ? "border-rose-400/30 bg-rose-500/6"
            : "border-white/8 bg-white/3"
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg text-xs font-semibold tabular-nums",
            state === "correct"
              ? "bg-emerald-500 text-white"
              : state === "wrong"
                ? "bg-rose-500 text-white"
                : "bg-white/10 text-slate-300"
          )}
        >
          {q.id}
        </span>

        <div className="min-w-0 flex-1">
          {/* Cau hoi dang dien tu vao cho trong */}
          {parts ? (
            <p className="text-[0.95rem] leading-[2.4] text-slate-200">
              {parts[0]}
              <BlankInput
                id={q.id}
                value={single}
                onChange={(v) => onAnswer(q.id, v)}
                disabled={disabled}
                state={state}
                label={q.prompt}
              />
              {parts[1]}
            </p>
          ) : (
            <p className="text-[0.95rem] leading-relaxed text-slate-200">
              {q.prompt}
              {q.type === "multiple_select" && q.selectCount && (
                <span className="ml-2 rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[0.7rem] font-medium text-violet-200">
                  chọn {q.selectCount}
                </span>
              )}
            </p>
          )}

          {/* Cac o tra loi */}
          {!parts && q.type === "multiple_select" && q.options && (
            <div className="mt-3 space-y-2">
              {q.options.map((o) => {
                const checked = multi.includes(o);
                const limit = q.selectCount ?? 2;
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (checked) onAnswer(q.id, multi.filter((x) => x !== o));
                      else if (multi.length < limit) onAnswer(q.id, [...multi, o]);
                      else onAnswer(q.id, [...multi.slice(1), o]);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left text-[0.9rem] transition-colors",
                      checked
                        ? "border-violet-400/50 bg-violet-500/14 text-white"
                        : "border-white/10 bg-white/3 text-slate-300 hover:border-white/20 hover:bg-white/6"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded border",
                        checked
                          ? "border-violet-400 bg-violet-500"
                          : "border-white/25"
                      )}
                    >
                      {checked && <Check className="size-3 text-white" />}
                    </span>
                    {o}
                  </button>
                );
              })}
            </div>
          )}

          {!parts && q.type !== "multiple_select" && bank && chips && (
            <div className="mt-3 flex flex-wrap gap-2">
              {bank.map((o) => {
                const active = single === o;
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAnswer(q.id, active ? "" : o)}
                    className={cn(
                      "rounded-lg border px-3.5 py-2 text-[0.85rem] font-medium transition-colors",
                      active
                        ? "border-violet-400/55 bg-violet-500/18 text-white"
                        : "border-white/10 bg-white/3 text-slate-300 hover:border-white/22 hover:bg-white/7"
                    )}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          )}

          {!parts && q.type !== "multiple_select" && bank && !chips && (
            <div className="mt-3">
              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((o, idx) => {
                    const active = single === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        disabled={disabled}
                        onClick={() => onAnswer(q.id, active ? "" : o)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left text-[0.9rem] transition-colors",
                          active
                            ? "border-violet-400/50 bg-violet-500/14 text-white"
                            : "border-white/10 bg-white/3 text-slate-300 hover:border-white/20 hover:bg-white/6"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border text-[0.7rem] font-semibold",
                            active
                              ? "border-violet-400 bg-violet-500 text-white"
                              : "border-white/25 text-slate-400"
                          )}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {o}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <select
                  value={single}
                  disabled={disabled}
                  onChange={(e) => onAnswer(q.id, e.target.value)}
                  className="h-11 w-full max-w-xl px-3"
                >
                  <option value="">-- Chọn đáp án --</option>
                  {bank.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {!parts && !bank && (
            <div className="mt-3">
              <BlankInput
                id={q.id}
                value={single}
                onChange={(v) => onAnswer(q.id, v)}
                disabled={disabled}
                state={state}
                width="lg"
                label={q.prompt}
              />
            </div>
          )}

          {/* Xem lai: dap an dung + giai thich */}
          {state && (
            <div className="mt-3 rounded-lg border border-white/8 bg-ink-900/60 p-3">
              <p className="flex flex-wrap items-center gap-2 text-[0.82rem]">
                {state === "correct" ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <X className="size-4 text-rose-400" />
                )}
                <span className="text-slate-400">Đáp án:</span>
                <span className="font-medium text-emerald-300">
                  {(Array.isArray(q.answer) ? q.answer : [q.answer]).join("  /  ")}
                </span>
              </p>
              {q.explanation && (
                <p className="mt-1.5 text-[0.82rem] leading-relaxed text-slate-400">
                  {q.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}


function ReviewRow({
  q,
  given,
  ok,
}: {
  q: Question;
  given: string | string[] | undefined;
  ok: boolean;
}) {
  const shown = Array.isArray(given) ? given.join(", ") : (given ?? "");
  return (
    <li
      className={cn(
        "rounded-xl border p-3.5",
        ok ? "border-emerald-400/25 bg-emerald-500/5" : "border-rose-400/25 bg-rose-500/5"
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg text-xs font-semibold tabular-nums",
            ok ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          )}
        >
          {q.id}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.88rem] leading-relaxed text-slate-300">{q.prompt}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem]">
            <span className="text-slate-500">
              Bạn trả lời:{" "}
              <span className={ok ? "text-emerald-300" : "text-rose-300"}>
                {shown || "(bỏ trống)"}
              </span>
            </span>
            {!ok && (
              <span className="text-slate-500">
                Đáp án:{" "}
                <span className="font-medium text-emerald-300">
                  {(Array.isArray(q.answer) ? q.answer : [q.answer]).join("  /  ")}
                </span>
              </span>
            )}
          </p>
          {q.explanation && (
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-slate-400">
              {q.explanation}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
