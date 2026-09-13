"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Mic, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatClock } from "@/lib/utils";

type State = "idle" | "recording" | "recorded" | "denied" | "unsupported";

const BARS = 28;

export function Recorder({
  maxSeconds,
  onComplete,
  disabled,
}: {
  maxSeconds: number;
  onComplete: (blob: Blob, seconds: number) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => new Array(BARS).fill(0.06));
  const [url, setUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !("MediaRecorder" in window)) {
      setState("unsupported");
    }
  }, []);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const stop = useCallback(() => {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        analyser.getByteFrequencyData(buf);
        const next: number[] = [];
        const step = Math.floor(buf.length / BARS) || 1;
        for (let i = 0; i < BARS; i++) {
          const v = buf[i * step] / 255;
          next.push(Math.max(0.06, Math.min(1, v * 1.5)));
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
        setUrl(URL.createObjectURL(blob));
        setState("recorded");
        setLevels(new Array(BARS).fill(0.06));
        cleanup();
        onComplete(blob, elapsed);
      };

      startedAtRef.current = Date.now();
      setSeconds(0);
      rec.start();
      setState("recording");

      timerRef.current = setInterval(() => {
        const s = Math.round((Date.now() - startedAtRef.current) / 1000);
        setSeconds(s);
        if (s >= maxSeconds) stop();
      }, 250);
    } catch {
      setState("denied");
      cleanup();
    }
  }, [cleanup, maxSeconds, onComplete, stop]);

  if (state === "unsupported" || state === "denied") {
    return (
      <div className="flex gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" />
        <p className="text-[0.85rem] leading-relaxed text-amber-100/90">
          {state === "unsupported"
            ? "Trình duyệt của bạn không hỗ trợ ghi âm. Hãy dùng Chrome, Edge hoặc Safari bản mới."
            : "Chưa được cấp quyền micro. Hãy cho phép truy cập micro trong thanh địa chỉ rồi tải lại trang."}{" "}
          Bạn vẫn có thể tự gõ lại phần trả lời của mình vào ô bên dưới để được chấm.
        </p>
      </div>
    );
  }

  const pct = Math.min(1, seconds / maxSeconds);

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/6 p-5">
      <div className="flex h-16 items-end justify-center gap-[3px]">
        {levels.map((l, i) => (
          <span
            key={i}
            className={cn(
              "w-1.5 rounded-full transition-[height] duration-75",
              state === "recording" ? "bg-emerald-400" : "bg-white/12"
            )}
            style={{ height: `${l * 100}%` }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        {state === "idle" && (
          <Button variant="success" size="lg" onClick={() => void start()} disabled={disabled}>
            <Mic className="size-5" />
            Bắt đầu ghi âm
          </Button>
        )}

        {state === "recording" && (
          <>
            <span className="font-display animate-pulse-ring rounded-full bg-rose-500/20 px-4 py-2 text-lg font-semibold text-rose-200 tabular-nums">
              {formatClock(seconds)}
            </span>
            <Button variant="danger" size="lg" onClick={stop}>
              <Square className="size-4" fill="currentColor" />
              Dừng
            </Button>
          </>
        )}

        {state === "recorded" && url && (
          <div className="flex w-full flex-col items-center gap-3">
            <audio src={url} controls className="w-full max-w-md" />
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Đã ghi {formatClock(seconds)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setState("idle");
                  setSeconds(0);
                  setUrl(null);
                }}
              >
                <RotateCcw className="size-4" />
                Ghi lại
              </Button>
            </div>
          </div>
        )}
      </div>

      {state === "recording" && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-400 to-teal-400 transition-[width] duration-300"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      )}

      {state === "idle" && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.75rem] text-slate-400">
          <Play className="size-3" />
          Tối đa {formatClock(maxSeconds)}, sẽ tự dừng khi hết giờ
        </p>
      )}
    </div>
  );
}
