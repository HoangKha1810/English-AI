"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

const W = 680;
const H = 260;
const PAD = { top: 18, right: 20, bottom: 34, left: 36 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

export function ProgressChart({
  points,
  color,
  label,
  targetBand,
}: {
  points: { t: number; band: number; title: string }[];
  color: string;
  label: string;
  targetBand?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-rose-300/60 text-sm text-ink-450">
        Chưa có dữ liệu cho {label}
      </div>
    );
  }

  const n = points.length;
  const x = (i: number) => PAD.left + (n <= 1 ? PW / 2 : (i * PW) / (n - 1));
  const y = (b: number) => PAD.top + PH - (b / 9) * PH;
  const ticks = [0, 3, 5, 6, 7, 9];

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.band)}`).join(" ");
  const area = `${d} L${x(n - 1)},${PAD.top + PH} L${x(0)},${PAD.top + PH} Z`;
  const gid = `pg-${label.replace(/\W/g, "")}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Biểu đồ band ${label} theo thời gian`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - PAD.left) / PW) * (n - 1));
          setHover(i >= 0 && i < n ? i : null);
        }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={PAD.left + PW}
              y1={y(t)}
              y2={y(t)}
              stroke="rgba(219,39,119,0.13)"
            />
            <text x={PAD.left - 9} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8f6a7d">
              {t}
            </text>
          </g>
        ))}

        {targetBand && (
          <g>
            <line
              x1={PAD.left}
              x2={PAD.left + PW}
              y1={y(targetBand)}
              y2={y(targetBand)}
              stroke="#b45309"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text x={PAD.left + PW} y={y(targetBand) - 7} textAnchor="end" fontSize="10.5" fill="#b45309">
              Mục tiêu {targetBand.toFixed(1)}
            </text>
          </g>
        )}

        <path d={area} fill={`url(#${gid})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.band)}
            r={hover === i ? 6 : 4.5}
            fill={color}
            stroke="#ffffff"
            strokeWidth="2"
          />
        ))}

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + PH}
            stroke="rgba(219,39,119,0.35)"
            strokeDasharray="3 3"
          />
        )}

        <text x={PAD.left} y={H - 12} fontSize="10.5" fill="#8f6a7d">
          {new Date(points[0].t).toLocaleDateString("vi-VN")}
        </text>
        {n > 1 && (
          <text x={PAD.left + PW} y={H - 12} textAnchor="end" fontSize="10.5" fill="#8f6a7d">
            {new Date(points[n - 1].t).toLocaleDateString("vi-VN")}
          </text>
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-xl border border-rose-300/60 bg-white/95 px-3 py-2 shadow-xl"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            transform: (x(hover) / W) * 100 > 62 ? "translateX(-104%)" : "translateX(4%)",
          }}
        >
          <p className="text-[0.7rem] text-ink-500">{formatDate(points[hover].t)}</p>
          <p className="mt-0.5 max-w-52 truncate text-[0.75rem] text-ink-700">
            {points[hover].title}
          </p>
          <p className="font-display mt-1 text-lg font-semibold tabular-nums" style={{ color }}>
            Band {points[hover].band.toFixed(1)}
          </p>
        </div>
      )}
    </div>
  );
}
