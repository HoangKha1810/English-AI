"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Info,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";
import type { TranscriptLine } from "@/lib/types";
import { cn, formatClock } from "@/lib/utils";
import { isAbortError } from "@/lib/errors";

type Mode = "checking" | "audio" | "speech";

/** Chon giong trinh duyet gan nhat voi ten giong edge-tts (vd en-GB-SoniaNeural) */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  edgeName: string | undefined,
  fallbackIndex: number
): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (english.length === 0) return undefined;
  if (edgeName) {
    const lang = edgeName.slice(0, 5).toLowerCase();
    const exact = english.filter((v) => v.lang.toLowerCase().replace("_", "-") === lang);
    if (exact.length > 0) return exact[fallbackIndex % exact.length];
  }
  return english[fallbackIndex % english.length];
}

export function ListeningPlayer({
  src,
  transcript,
  voices,
  autoPlay,
  onEnded,
}: {
  src: string;
  transcript: TranscriptLine[];
  voices?: Record<string, string>;
  autoPlay?: boolean;
  onEnded?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("checking");
  const [playing, setPlaying] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const idxRef = useRef(0);
  const stoppedRef = useRef(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  /* Kiem tra file audio co ton tai khong */
  useEffect(() => {
    let alive = true;
    fetch(src, { method: "HEAD" })
      .then((r) => {
        if (!alive) return;
        setMode(r.ok ? "audio" : "speech");
      })
      .catch(() => alive && setMode("speech"));
    return () => {
      alive = false;
    };
  }, [src]);

  /* Danh sach giong cua trinh duyet */
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => setBrowserVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speakers = useMemo(
    () => [...new Set(transcript.map((l) => l.speaker ?? "Narrator"))],
    [transcript]
  );

  const voiceFor = useCallback(
    (speaker: string) =>
      pickVoice(browserVoices, voices?.[speaker], speakers.indexOf(speaker)),
    [browserVoices, voices, speakers]
  );

  const playAudio = useCallback((audio: HTMLAudioElement) => {
    audio.play().then(
      () => setPlaying(true),
      (err) => {
        if (!isAbortError(err)) {
          console.warn("[IELTS Lab] Không phát được audio:", err);
        }
        setPlaying(false);
      }
    );
  }, []);

  /* ------------------------- Che do doc bang trinh duyet ------------------------- */
  const speakFrom = useCallback(
    (start: number) => {
      if (!window.speechSynthesis) return;
      stoppedRef.current = false;
      window.speechSynthesis.cancel();
      idxRef.current = start;

      const next = () => {
        if (stoppedRef.current) return;
        const i = idxRef.current;
        if (i >= transcript.length) {
          setPlaying(false);
          setLineIdx(0);
          idxRef.current = 0;
          onEnded?.();
          return;
        }
        const line = transcript[i];
        setLineIdx(i);
        const u = new SpeechSynthesisUtterance(line.text);
        const v = voiceFor(line.speaker ?? "Narrator");
        if (v) u.voice = v;
        u.rate = rate * 0.95;
        u.pitch = 1;
        u.onend = () => {
          idxRef.current += 1;
          setTimeout(next, 180);
        };
        u.onerror = () => {
          idxRef.current += 1;
          setTimeout(next, 180);
        };
        window.speechSynthesis.speak(u);
      };
      next();
    },
    [transcript, voiceFor, rate, onEnded]
  );

  const stopSpeech = useCallback(() => {
    stoppedRef.current = true;
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const toggle = () => {
    if (mode === "audio") {
      const a = audioRef.current;
      if (!a) return;
      if (playing) {
        a.pause();
        setPlaying(false);
      } else {
        playAudio(a);
      }
      return;
    }
    if (playing) {
      stopSpeech();
      setPlaying(false);
    } else {
      setPlaying(true);
      speakFrom(idxRef.current);
    }
  };

  const restart = () => {
    if (mode === "audio") {
      const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    playAudio(a);
    return;
    }
    stopSpeech();
    idxRef.current = 0;
    setLineIdx(0);
    setPlaying(true);
    setTimeout(() => speakFrom(0), 120);
  };

  useEffect(() => {
    if (autoPlay && mode === "audio" && audioRef.current) {
      playAudio(audioRef.current);
    }
  }, [autoPlay, mode, playAudio]);

  const progress =
    mode === "audio"
      ? duration > 0
        ? time / duration
        : 0
      : transcript.length > 0
        ? lineIdx / transcript.length
        : 0;

  return (
    <div className="rounded-2xl border border-violet-400/20 bg-violet-500/6 p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full text-white transition-all active:scale-95",
            playing
              ? "bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_24px_-4px_rgba(167,139,250,0.8)]"
              : "bg-linear-to-br from-violet-600 to-pink-500"
          )}
          aria-label={playing ? "Tạm dừng" : "Phát"}
        >
          {playing ? (
            <Pause className="size-5" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 size-5" fill="currentColor" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <AudioLines
                className={cn("size-3.5", playing && "animate-pulse text-violet-600")}
              />
              {mode === "audio"
                ? "Audio bài nghe"
                : mode === "speech"
                  ? "Đọc bằng giọng trình duyệt"
                  : "Đang kiểm tra..."}
            </span>
            <span className="tabular-nums">
              {mode === "audio"
                ? `${formatClock(time)} / ${formatClock(duration)}`
                : `${Math.min(lineIdx + 1, transcript.length)}/${transcript.length} câu`}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pink-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-400 to-pink-400 transition-[width] duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={restart}
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-rose-200/80 bg-white/65 text-ink-700 transition-colors hover:bg-white/85"
          title="Nghe lại từ đầu"
        >
          <RotateCcw className="size-4" />
        </button>

        <select
          value={rate}
          onChange={(e) => {
            const r = Number(e.target.value);
            setRate(r);
            if (audioRef.current) audioRef.current.playbackRate = r;
          }}
          className="h-9 shrink-0 px-2 text-xs"
          title="Tốc độ phát"
        >
          {[0.75, 0.9, 1, 1.15, 1.3].map((r) => (
            <option key={r} value={r}>
              {r}x
            </option>
          ))}
        </select>
      </div>

      {mode === "audio" && (
        <audio
          ref={audioRef}
          src={src}
          preload="auto"
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.playbackRate = rate;
          }}
          onEnded={() => {
            setPlaying(false);
            onEnded?.();
          }}
          className="hidden"
        />
      )}

      {mode === "speech" && (
        <div className="mt-3 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-500/8 p-2.5">
          <Info className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
          <p className="text-[0.72rem] leading-relaxed text-amber-800">
            Chưa có file MP3 nên bài nghe đang được đọc bằng giọng của trình duyệt. Chạy{" "}
            <code className="rounded bg-rose-100 px-1 whitespace-nowrap">
              npm run gen:audio
            </code>{" "}
            để tạo audio thật với giọng bản xứ.
          </p>
        </div>
      )}

      {mode === "speech" && playing && transcript[lineIdx] && (
        <p className="mt-3 flex items-start gap-2 text-[0.78rem] leading-relaxed text-ink-500">
          <Volume2 className="mt-0.5 size-3.5 shrink-0 text-violet-600" />
          <span>
            {transcript[lineIdx].speaker && (
              <span className="font-medium text-violet-600">
                {transcript[lineIdx].speaker}:{" "}
              </span>
            )}
            {transcript[lineIdx].text}
          </span>
        </p>
      )}
    </div>
  );
}
