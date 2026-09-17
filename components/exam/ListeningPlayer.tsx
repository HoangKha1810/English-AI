"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Info,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { TranscriptLine } from "@/lib/types";
import { cn, formatClock } from "@/lib/utils";
import { isAbortError } from "@/lib/errors";
import { SeekBar } from "./SeekBar";

type Mode = "checking" | "audio" | "speech";

const SKIP = 5;

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

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
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
  const [buffered, setBuffered] = useState(0);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [hovered, setHovered] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const idxRef = useRef(0);
  const stoppedRef = useRef(false);
  const wasPlayingRef = useRef(false);
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
        u.volume = muted ? 0 : volume;
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
    [transcript, voiceFor, rate, volume, muted, onEnded]
  );

  const stopSpeech = useCallback(() => {
    stoppedRef.current = true;
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  /* --------------------------- Dieu khien chung --------------------------- */

  const toggle = useCallback(() => {
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
  }, [mode, playing, playAudio, speakFrom, stopSpeech]);

  /** Nhay toi mot moc bat ky. Voi che do doc, "giay" chinh la chi so cau. */
  const seekTo = useCallback(
    (next: number) => {
      if (mode === "audio") {
        const a = audioRef.current;
        if (!a || !Number.isFinite(a.duration)) return;
        const v = Math.max(0, Math.min(a.duration, next));
        a.currentTime = v;
        setTime(v);
        return;
      }
      const i = Math.max(0, Math.min(transcript.length - 1, Math.round(next)));
      idxRef.current = i;
      setLineIdx(i);
    },
    [mode, transcript.length]
  );

  /** Sau khi tha chuot: neu dang phat thi doc tiep tu cho moi */
  const commitSeek = useCallback(
    (next: number) => {
      if (mode !== "speech") return;
      const i = Math.max(0, Math.min(transcript.length - 1, Math.round(next)));
      idxRef.current = i;
      setLineIdx(i);
      if (playing) {
        stopSpeech();
        setTimeout(() => speakFrom(i), 80);
      }
    },
    [mode, transcript.length, playing, speakFrom, stopSpeech]
  );

  const skip = useCallback(
    (delta: number) => {
      if (mode === "audio") {
        const a = audioRef.current;
        if (!a) return;
        seekTo(a.currentTime + delta);
      } else {
        const step = delta > 0 ? 1 : -1;
        commitSeek(idxRef.current + step);
      }
    },
    [mode, seekTo, commitSeek]
  );

  const restart = useCallback(() => {
    if (mode === "audio") {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = 0;
      setTime(0);
      playAudio(a);
      return;
    }
    stopSpeech();
    idxRef.current = 0;
    setLineIdx(0);
    setPlaying(true);
    setTimeout(() => speakFrom(0), 120);
  }, [mode, playAudio, speakFrom, stopSpeech]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  useEffect(() => {
    if (autoPlay && mode === "audio" && audioRef.current) {
      playAudio(audioRef.current);
    }
  }, [autoPlay, mode, playAudio]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = volume;
      a.muted = muted;
    }
  }, [volume, muted]);

  /* Phim tat - chi hoat dong khi con tro dang o tren trinh phat,
     va khong bao gio cuop phim khi nguoi dung dang go dap an. */
  useEffect(() => {
    if (!hovered) return;
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          toggle();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-SKIP);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(SKIP);
          break;
        case "j":
        case "J":
          e.preventDefault();
          skip(-10);
          break;
        case "l":
        case "L":
          e.preventDefault();
          skip(10);
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "0":
          e.preventDefault();
          restart();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hovered, toggle, skip, toggleMute, restart]);

  /* --------------------------------- Giao dien --------------------------------- */

  const isSpeech = mode === "speech";
  const seekMax = isSpeech ? Math.max(0, transcript.length - 1) : duration;
  const seekValue = isSpeech ? lineIdx : time;
  const label = isSpeech
    ? (v: number) => `Câu ${Math.round(v) + 1}`
    : formatClock;

  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      className="rounded-2xl border border-violet-400/20 bg-violet-500/6 p-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Dong tieu de + thoi gian */}
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <AudioLines
            className={cn("size-3.5", playing && "animate-pulse text-violet-600")}
          />
          {mode === "audio"
            ? "Audio bài nghe"
            : isSpeech
              ? "Đọc bằng giọng trình duyệt"
              : "Đang kiểm tra..."}
        </span>
        <span className="font-semibold tabular-nums">
          {mode === "audio"
            ? `${formatClock(time)} / ${formatClock(duration)}`
            : `${Math.min(lineIdx + 1, transcript.length)}/${transcript.length} câu`}
        </span>
      </div>

      {/* Thanh tua */}
      <SeekBar
        value={seekValue}
        max={seekMax}
        buffered={isSpeech ? seekMax : buffered}
        onSeek={seekTo}
        onScrubStart={() => {
          wasPlayingRef.current = playing;
          if (mode === "audio" && playing) audioRef.current?.pause();
        }}
        onScrubEnd={(v) => {
          if (mode === "audio") {
            if (wasPlayingRef.current && audioRef.current) playAudio(audioRef.current);
          } else {
            commitSeek(v);
          }
        }}
        formatLabel={label}
        disabled={mode === "checking" || seekMax <= 0}
        ariaLabel={isSpeech ? "Tua theo câu" : "Tua theo thời gian"}
      />

      {/* Hang dieu khien */}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          onClick={toggle}
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full text-white transition-all active:scale-95",
            playing
              ? "bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_22px_-4px_rgba(167,139,250,0.85)]"
              : "bg-linear-to-br from-violet-600 to-pink-500"
          )}
          aria-label={playing ? "Tạm dừng" : "Phát"}
          title={playing ? "Tạm dừng (K)" : "Phát (K)"}
        >
          {playing ? (
            <Pause className="size-5" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 size-5" fill="currentColor" />
          )}
        </button>

        <button
          onClick={() => skip(-SKIP)}
          className="relative grid size-9 shrink-0 place-items-center rounded-full border border-rose-200/80 bg-white/70 text-ink-700 transition-colors hover:bg-white active:scale-95"
          title={isSpeech ? "Lùi 1 câu (←)" : `Tua lùi ${SKIP} giây (←)`}
          aria-label={isSpeech ? "Lùi một câu" : `Tua lùi ${SKIP} giây`}
        >
          <RotateCcw className="size-4" />
          {!isSpeech && (
            <span className="absolute inset-0 grid place-items-center pt-0.5 text-[0.5rem] font-bold">
              {SKIP}
            </span>
          )}
        </button>

        <button
          onClick={() => skip(SKIP)}
          className="relative grid size-9 shrink-0 place-items-center rounded-full border border-rose-200/80 bg-white/70 text-ink-700 transition-colors hover:bg-white active:scale-95"
          title={isSpeech ? "Tới 1 câu (→)" : `Tua tới ${SKIP} giây (→)`}
          aria-label={isSpeech ? "Tới một câu" : `Tua tới ${SKIP} giây`}
        >
          <RotateCw className="size-4" />
          {!isSpeech && (
            <span className="absolute inset-0 grid place-items-center pt-0.5 text-[0.5rem] font-bold">
              {SKIP}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Am luong */}
          <div className="group/vol flex items-center">
            <button
              onClick={toggleMute}
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-600 transition-colors hover:bg-white/70"
              title={muted ? "Bật tiếng (M)" : "Tắt tiếng (M)"}
              aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
            >
              <VolIcon className="size-4" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (Number(e.target.value) > 0) setMuted(false);
              }}
              aria-label="Âm lượng"
              className="h-1 w-0 cursor-pointer accent-pink-500 opacity-0 transition-all duration-200 group-hover/vol:w-16 group-hover/vol:opacity-100 focus:w-16 focus:opacity-100"
            />
          </div>

          <button
            onClick={restart}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-rose-200/80 bg-white/70 text-ink-700 transition-colors hover:bg-white active:scale-95"
            title="Nghe lại từ đầu (0)"
            aria-label="Nghe lại từ đầu"
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
            aria-label="Tốc độ phát"
          >
            {[0.75, 0.9, 1, 1.15, 1.3].map((r) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {hovered && mode === "audio" && (
        <p className="mt-2 text-[0.65rem] text-ink-400">
          Phím tắt: Space phát/dừng · ← → tua {SKIP} giây · J L tua 10 giây · M tắt
          tiếng · 0 nghe lại
        </p>
      )}

      {mode === "audio" && (
        <audio
          ref={audioRef}
          src={src}
          preload="auto"
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onProgress={(e) => {
            const a = e.currentTarget;
            if (a.buffered.length > 0) {
              setBuffered(a.buffered.end(a.buffered.length - 1));
            }
          }}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.playbackRate = rate;
            e.currentTarget.volume = volume;
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            onEnded?.();
          }}
          className="hidden"
        />
      )}

      {isSpeech && (
        <div className="mt-3 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-500/8 p-2.5">
          <Info className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
          <p className="text-[0.72rem] leading-relaxed text-amber-800">
            Chưa có file MP3 nên bài nghe đang được đọc bằng giọng của trình duyệt. Thanh
            tua sẽ nhảy theo từng câu thay vì theo giây. Chạy{" "}
            <code className="rounded bg-rose-100 px-1 whitespace-nowrap">
              npm run gen:audio
            </code>{" "}
            để tạo audio thật với giọng bản xứ.
          </p>
        </div>
      )}

      {isSpeech && playing && transcript[lineIdx] && (
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
