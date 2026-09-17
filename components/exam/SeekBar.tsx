"use client";

import { useCallback, useRef, useState } from "react";
import { cn, formatClock } from "@/lib/utils";

/**
 * Thanh tua kieu YouTube: bam de nhay toi, keo de tua, ro chuot de xem
 * truoc moc thoi gian. Dung chung cho ca che do MP3 va che do doc bang
 * giong trinh duyet (luc do "thoi gian" la chi so cau trong transcript).
 */
export function SeekBar({
  value,
  max,
  buffered = 0,
  onSeek,
  onScrubStart,
  onScrubEnd,
  formatLabel = formatClock,
  disabled,
  ariaLabel = "Thanh tua",
}: {
  /** Vi tri hien tai (giay, hoac chi so) */
  value: number;
  /** Tong do dai */
  max: number;
  /** Da tai truoc toi giay thu may */
  buffered?: number;
  onSeek: (next: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: (next: number) => void;
  formatLabel?: (v: number) => string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  const ratioFromEvent = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  }, []);

  const playedRatio =
    dragRatio !== null ? dragRatio : max > 0 ? Math.min(1, value / max) : 0;
  const bufferedRatio = max > 0 ? Math.min(1, buffered / max) : 0;
  const shown = dragRatio !== null ? dragRatio * max : value;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || max <= 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = ratioFromEvent(e.clientX);
    setDragRatio(r);
    onScrubStart?.();
    onSeek(r * max);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || max <= 0) return;
    const r = ratioFromEvent(e.clientX);
    setHoverRatio(r);
    if (dragRatio !== null) {
      setDragRatio(r);
      onSeek(r * max);
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRatio === null) return;
    const r = ratioFromEvent(e.clientX);
    setDragRatio(null);
    onScrubEnd?.(r * max);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || max <= 0) return;
    const step = max > 120 ? 5 : 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = Math.min(max, value + step);
    else if (e.key === "ArrowLeft") next = Math.max(0, value - step);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = max;
    if (next !== null) {
      e.preventDefault();
      onSeek(next);
      onScrubEnd?.(next);
    }
  };

  return (
    <div
      className="group/seek relative cursor-pointer touch-none py-2.5"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setHoverRatio(null)}
      onKeyDown={handleKey}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={formatLabel(shown)}
    >
      {/* Bong xem truoc moc thoi gian */}
      {hoverRatio !== null && max > 0 && (
        <div
          className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 rounded-lg bg-ink-900 px-2 py-1 text-[0.68rem] font-semibold text-white shadow-lg tabular-nums"
          style={{ left: `${hoverRatio * 100}%` }}
        >
          {formatLabel(hoverRatio * max)}
        </div>
      )}

      <div
        ref={trackRef}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-pink-100 transition-[height] duration-150",
          dragRatio !== null ? "h-2.5" : "h-1.5 group-hover/seek:h-2.5"
        )}
      >
        {/* Phan da tai truoc */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-pink-200"
          style={{ width: `${bufferedRatio * 100}%` }}
        />
        {/* Phan da nghe */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-violet-400 to-pink-500",
            dragRatio === null && "transition-[width] duration-150"
          )}
          style={{ width: `${playedRatio * 100}%` }}
        />
      </div>

      {/* Nut keo */}
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_5px_rgba(219,39,119,0.5)] ring-2 ring-pink-500 transition-transform duration-150",
          dragRatio !== null
            ? "scale-125"
            : "scale-0 group-hover/seek:scale-100 group-focus-visible/seek:scale-100"
        )}
        style={{ left: `${playedRatio * 100}%` }}
      />
    </div>
  );
}
