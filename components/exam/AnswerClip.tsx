"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Headphones, Square } from "lucide-react";
import type { ListeningSection } from "@/lib/types";
import {
  buildCueMap,
  estimateTimings,
  type Cue,
  type LineTiming,
} from "@/lib/audio-cues";
import { isAbortError } from "@/lib/errors";
import { cn, formatClock } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 *  Doc moc thoi gian cua mot section
 * ------------------------------------------------------------------ */

interface SectionAudio {
  duration: number;
  timings: LineTiming[] | null;
  /** true khi moc thoi gian la uoc luong theo do dai cau chu khong phai do that */
  estimated: boolean;
  ready: boolean;
  available: boolean;
}

export function useSectionAudio(section: ListeningSection): SectionAudio {
  const [state, setState] = useState<SectionAudio>({
    duration: 0,
    timings: null,
    estimated: true,
    ready: false,
    available: false,
  });

  useEffect(() => {
    let alive = true;
    const src = section.audioSrc;
    const timingsUrl = src.replace(/\.mp3$/, ".timings.json");

    const durationOf = () =>
      new Promise<number>((resolve) => {
        const a = new Audio();
        a.preload = "metadata";
        a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : 0);
        a.onerror = () => resolve(0);
        a.src = src;
      });

    const timingsOf = () =>
      fetch(timingsUrl)
        .then((r) => (r.ok ? (r.json() as Promise<LineTiming[]>) : null))
        .catch(() => null);

    Promise.all([durationOf(), timingsOf()]).then(([duration, timings]) => {
      if (!alive) return;
      const usable =
        Array.isArray(timings) && timings.length === section.transcript.length
          ? timings
          : null;
      setState({
        duration,
        timings: usable,
        estimated: usable === null,
        ready: true,
        available: duration > 0,
      });
    });

    return () => {
      alive = false;
    };
  }, [section.audioSrc, section.transcript.length]);

  return state;
}

/** Bang tra: moi cau hoi -> doan audio chua dap an */
export function useCueMap(section: ListeningSection, audio: SectionAudio) {
  return useMemo(() => {
    if (!audio.ready || !audio.available || audio.duration <= 0) return {};
    const timings = audio.timings ?? estimateTimings(section, audio.duration);
    return buildCueMap(section, timings, audio.duration, {
      estimated: audio.estimated,
    });
  }, [section, audio]);
}

/* ------------------------------------------------------------------ *
 *  Mot the audio dung chung cho toan bo cac doan trich
 * ------------------------------------------------------------------ */

interface ClipCtx {
  activeId: number | null;
  position: number;
  play: (id: number, start: number, end: number) => void;
  stop: () => void;
}

const ClipContext = createContext<ClipCtx | null>(null);

export function AnswerClipProvider({
  src,
  children,
}: {
  src: string;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rangeRef = useRef<{ start: number; end: number } | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const a = new Audio(src);
    a.preload = "metadata";
    audioRef.current = a;

    const onTime = () => {
      const r = rangeRef.current;
      if (!r) return;
      setPosition(a.currentTime);
      if (a.currentTime >= r.end) {
        a.pause();
        rangeRef.current = null;
        setActiveId(null);
      }
    };
    const onEnd = () => {
      rangeRef.current = null;
      setActiveId(null);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.pause();
      audioRef.current = null;
    };
  }, [src]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    rangeRef.current = null;
    setActiveId(null);
  }, []);

  const play = useCallback(
    (id: number, start: number, end: number) => {
      const a = audioRef.current;
      if (!a) return;
      rangeRef.current = { start, end };
      a.currentTime = start;
      setPosition(start);
      setActiveId(id);
      a.play().catch((err) => {
        if (!isAbortError(err)) {
          console.warn("[IELTS Lab] Không phát được đoạn trích:", err);
        }
        rangeRef.current = null;
        setActiveId(null);
      });
    },
    []
  );

  useEffect(() => () => stop(), [stop]);

  const value = useMemo(
    () => ({ activeId, position, play, stop }),
    [activeId, position, play, stop]
  );

  return <ClipContext.Provider value={value}>{children}</ClipContext.Provider>;
}

/* ------------------------------------------------------------------ *
 *  Nut nghe lai doan chua dap an
 * ------------------------------------------------------------------ */

export function AnswerClip({ questionId, cue }: { questionId: number; cue: Cue }) {
  const ctx = useContext(ClipContext);
  if (!ctx) return null;

  const active = ctx.activeId === questionId;
  const span = Math.max(0.1, cue.end - cue.start);
  const progress = active
    ? Math.max(0, Math.min(1, (ctx.position - cue.start) / span))
    : 0;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
      <button
        onClick={() => (active ? ctx.stop() : ctx.play(questionId, cue.start, cue.end))}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-[0.75rem] font-bold transition-all active:scale-95",
          active
            ? "border-violet-400 bg-violet-500 text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.7)]"
            : "border-violet-300/70 bg-violet-100/70 text-violet-700 hover:bg-violet-200/70"
        )}
        title={
          cue.approximate
            ? "Vị trí ước lượng — có thể lệch vài giây"
            : "Nghe lại đúng đoạn có đáp án"
        }
      >
        {active ? (
          <>
            <Square className="size-3" fill="currentColor" />
            Dừng
          </>
        ) : (
          <>
            <Headphones className="size-3.5" />
            Nghe đoạn này
          </>
        )}
      </button>

      <div className="flex min-w-[7rem] flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pink-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-violet-400 to-pink-500 transition-[width] duration-150"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-[0.68rem] text-ink-400 tabular-nums">
          {formatClock(cue.start)} – {formatClock(cue.end)}
          {cue.approximate && " ~"}
        </span>
      </div>
    </div>
  );
}
