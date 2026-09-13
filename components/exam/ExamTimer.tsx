"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, Pause, Play } from "lucide-react";
import { cn, formatClock } from "@/lib/utils";

export function ExamTimer({
  durationSeconds,
  running,
  onExpire,
  onTick,
  allowPause = true,
  initialElapsed = 0,
}: {
  durationSeconds: number;
  running: boolean;
  onExpire: () => void;
  onTick?: (elapsed: number) => void;
  allowPause?: boolean;
  initialElapsed?: number;
}) {
  const [left, setLeft] = useState(() =>
    Math.max(0, durationSeconds - Math.max(0, initialElapsed))
  );
  const [paused, setPaused] = useState(false);
  const firedRef = useRef(false);
  const tickRef = useRef(onTick);
  const expireRef = useRef(onExpire);

  // Cap nhat ref sau khi render, khong ghi de trong luc render.
  useEffect(() => {
    tickRef.current = onTick;
    expireRef.current = onExpire;
  });

  // Chi dem nguoc o day. Ham cap nhat state phai thuan tuy: React co the
  // goi lai no trong luc render, nen tuyet doi khong goi callback cua
  // component cha ben trong nay.
  useEffect(() => {
    if (!running || paused) return;
    const t = setInterval(() => setLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [running, paused]);

  // Moi tac dong ra ben ngoai deu nam o effect rieng, chay sau khi render xong.
  useEffect(() => {
    if (!running) return;
    tickRef.current?.(durationSeconds - left);
    if (left <= 0 && !firedRef.current) {
      firedRef.current = true;
      expireRef.current();
    }
  }, [left, durationSeconds, running]);

  const pct = durationSeconds > 0 ? left / durationSeconds : 0;
  const danger = left <= 300;
  const critical = left <= 60;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border px-3 py-2 transition-colors",
        critical
          ? "animate-pulse border-rose-400/50 bg-rose-500/14"
          : danger
            ? "border-amber-400/40 bg-amber-500/12"
            : "border-rose-200/80 bg-white/65"
      )}
    >
      <Clock3
        className={cn(
          "size-4",
          critical ? "text-rose-700" : danger ? "text-amber-700" : "text-ink-500"
        )}
      />
      <div className="min-w-[4.2rem]">
        <span
          className={cn(
            "font-display text-[1.05rem] font-semibold tabular-nums",
            critical ? "text-rose-700" : danger ? "text-amber-700" : "text-ink-900"
          )}
        >
          {formatClock(left)}
        </span>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-pink-100">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-1000 ease-linear",
              critical ? "bg-rose-400" : danger ? "bg-amber-400" : "bg-violet-400"
            )}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
      {allowPause && running && (
        <button
          onClick={() => setPaused((v) => !v)}
          className="grid size-7 place-items-center rounded-xl text-ink-500 transition-colors hover:bg-white/85 hover:text-ink-900"
          aria-label={paused ? "Tiếp tục" : "Tạm dừng"}
          title={paused ? "Tiếp tục" : "Tạm dừng"}
        >
          {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
