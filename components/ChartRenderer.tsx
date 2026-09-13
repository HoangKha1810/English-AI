"use client";

import { useId, useMemo, useState } from "react";
import { Table2 } from "lucide-react";
import type { ChartSpec } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Bang mau categorical da qua kiem tra do tuong phan va mu mau
 * tren nen toi (OKLCH L 0.48-0.67, CVD Delta E >= 8, contrast >= 3:1).
 */
const SERIES = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#9085e9",
];

const INK = "#e2e8f0";
const INK_MUTED = "#94a3b8";
const GRID = "rgba(255,255,255,0.09)";

const W = 640;
const H = 320;
const PAD = { top: 18, right: 72, bottom: 38, left: 48 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/**
 * Chon tran truc y "dep" nhat va sat du lieu: thu cac buoc 1/2/2.5/5 nhan
 * luy thua 10, voi 4 hoac 5 khoang, roi lay tran nho nhat van chua het du lieu.
 */
function niceScale(v: number): { max: number; ticks: number[] } {
  if (v <= 0) return { max: 10, ticks: [0, 2.5, 5, 7.5, 10] };
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  let best: { max: number; step: number } | null = null;
  for (const k of [mag / 100, mag / 10, mag, mag * 10]) {
    for (const s of [1, 2, 2.5, 5]) {
      const step = s * k;
      for (const parts of [4, 5]) {
        const max = step * parts;
        if (max >= v && (best === null || max < best.max)) best = { max, step };
      }
    }
  }
  if (!best) return { max: Math.ceil(v / mag) * mag, ticks: [] };
  const ticks: number[] = [];
  for (let t = 0; t <= best.max + 1e-9; t += best.step) {
    ticks.push(Number(t.toFixed(6)));
  }
  return { max: best.max, ticks };
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

export function ChartRenderer({ chart }: { chart: ChartSpec }) {
  const [showTable, setShowTable] = useState(chart.kind === "table");
  const colors = chart.series.map((_, i) => SERIES[i % SERIES.length]);
  const multi = chart.series.length > 1;

  return (
    <figure className="rounded-2xl border border-white/10 bg-ink-850/70 p-4 sm:p-5">
      <figcaption className="mb-1">
        <h3 className="font-display text-[0.98rem] leading-snug font-semibold text-slate-100">
          {chart.title}
        </h3>
        {chart.unit && (
          <p className="mt-0.5 text-[0.72rem] text-slate-400">Đơn vị: {chart.unit}</p>
        )}
      </figcaption>

      {multi && (
        <ul className="my-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {chart.series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-1.5 text-[0.76rem] text-slate-300">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: colors[i] }}
              />
              {s.name}
            </li>
          ))}
        </ul>
      )}

      {chart.kind !== "table" && (
        <div className="overflow-x-auto">
          {chart.kind === "line" && <LineChart chart={chart} colors={colors} />}
          {chart.kind === "bar" && <BarChart chart={chart} colors={colors} />}
          {chart.kind === "pie" && <PieChart chart={chart} />}
        </div>
      )}

      {chart.note && (
        <p className="mt-3 text-[0.74rem] leading-relaxed text-slate-400">{chart.note}</p>
      )}

      {chart.kind !== "table" && (
        <button
          onClick={() => setShowTable((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-[0.74rem] text-slate-400 transition-colors hover:text-slate-200"
        >
          <Table2 className="size-3.5" />
          {showTable ? "Ẩn bảng số liệu" : "Xem bảng số liệu"}
        </button>
      )}

      {showTable && <DataTable chart={chart} colors={colors} />}
    </figure>
  );
}

/* ------------------------------ Line ------------------------------ */

function LineChart({ chart, colors }: { chart: ChartSpec; colors: string[] }) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const { max, ticks } = useMemo(
    () => niceScale(Math.max(...chart.series.flatMap((s) => s.values)) * 1.08),
    [chart]
  );
  const n = chart.categories.length;
  const x = (i: number) => PAD.left + (n <= 1 ? PLOT_W / 2 : (i * PLOT_W) / (n - 1));
  const y = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[520px]"
        role="img"
        aria-label={chart.title}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - PAD.left) / PLOT_W) * (n - 1));
          setHover(i >= 0 && i < n ? i : null);
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + PLOT_W} y1={y(t)} y2={y(t)} stroke={GRID} />
            <text
              x={PAD.left - 10}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill={INK_MUTED}
            >
              {fmt(t)}
            </text>
          </g>
        ))}

        {chart.categories.map((c, i) => (
          <text key={c} x={x(i)} y={H - 14} textAnchor="middle" fontSize="11" fill={INK_MUTED}>
            {c}
          </text>
        ))}

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            stroke="rgba(255,255,255,0.28)"
            strokeDasharray="3 3"
          />
        )}

        {chart.series.map((s, si) => {
          const d = s.values
            .map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`)
            .join(" ");
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={colors[si]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r={hover === i ? 5.5 : 4}
                  fill={colors[si]}
                  stroke="#12122a"
                  strokeWidth="2"
                />
              ))}
              <text
                x={x(n - 1) + 10}
                y={y(s.values[n - 1]) + 4}
                fontSize="11"
                fill={INK}
                id={`${uid}-lbl-${si}`}
              >
                {s.values[n - 1]}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <Tooltip
          label={chart.categories[hover]}
          rows={chart.series.map((s, i) => ({
            name: s.name,
            value: s.values[hover],
            color: colors[i],
          }))}
          unit={chart.unit}
          leftPct={(x(hover) / W) * 100}
        />
      )}
    </div>
  );
}

/* ------------------------------- Bar ------------------------------- */

function BarChart({ chart, colors }: { chart: ChartSpec; colors: string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const { max, ticks } = useMemo(
    () => niceScale(Math.max(...chart.series.flatMap((s) => s.values)) * 1.08),
    [chart]
  );
  const n = chart.categories.length;
  const groupW = PLOT_W / n;
  const inner = groupW * 0.68;
  const barW = Math.max(6, inner / chart.series.length - 2);
  const y = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[520px]"
        role="img"
        aria-label={chart.title}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + PLOT_W} y1={y(t)} y2={y(t)} stroke={GRID} />
            <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill={INK_MUTED}>
              {fmt(t)}
            </text>
          </g>
        ))}

        {chart.categories.map((c, gi) => {
          const gx = PAD.left + gi * groupW;
          const startX = gx + (groupW - inner) / 2;
          return (
            <g
              key={c}
              onMouseEnter={() => setHover(gi)}
            >
              <rect
                x={gx}
                y={PAD.top}
                width={groupW}
                height={PLOT_H}
                fill={hover === gi ? "rgba(255,255,255,0.04)" : "transparent"}
              />
              {chart.series.map((s, si) => {
                const v = s.values[gi];
                const bx = startX + si * (barW + 2);
                const by = y(v);
                return (
                  <g key={s.name}>
                    <rect
                      x={bx}
                      y={by}
                      width={barW}
                      height={Math.max(1, PAD.top + PLOT_H - by)}
                      rx="4"
                      fill={colors[si]}
                    />
                    <rect
                      x={bx}
                      y={PAD.top + PLOT_H - 5}
                      width={barW}
                      height={5}
                      fill={colors[si]}
                    />
                  </g>
                );
              })}
              <text
                x={gx + groupW / 2}
                y={H - 14}
                textAnchor="middle"
                fontSize="10.5"
                fill={INK_MUTED}
              >
                {c.length > 16 ? `${c.slice(0, 15)}…` : c}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <Tooltip
          label={chart.categories[hover]}
          rows={chart.series.map((s, i) => ({
            name: s.name,
            value: s.values[hover],
            color: colors[i],
          }))}
          unit={chart.unit}
          leftPct={((PAD.left + (hover + 0.5) * groupW) / W) * 100}
        />
      )}
    </div>
  );
}

/* ------------------------------- Pie ------------------------------- */

function PieChart({ chart }: { chart: ChartSpec }) {
  const values = chart.series[0]?.values ?? [];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = 200;
  const cy = 160;
  const r = 108;

  let angle = -Math.PI / 2;
  const slices = values.map((v, i) => {
    const frac = v / total;
    const start = angle;
    const end = angle + frac * Math.PI * 2;
    angle = end;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const mid = (start + end) / 2;
    return {
      d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`,
      labelX: cx + (r + 26) * Math.cos(mid),
      labelY: cy + (r + 26) * Math.sin(mid),
      anchor: (Math.cos(mid) >= 0 ? "start" : "end") as "start" | "end",
      pct: Math.round(frac * 100),
      name: chart.categories[i] ?? "",
      color: SERIES[i % SERIES.length],
    };
  });

  return (
    <svg viewBox="0 0 640 320" className="w-full min-w-[520px]" role="img" aria-label={chart.title}>
      {slices.map((s) => (
        <path key={s.name} d={s.d} fill={s.color} stroke="#12122a" strokeWidth="2" />
      ))}
      {slices.map((s) => (
        <text
          key={`t-${s.name}`}
          x={s.labelX}
          y={s.labelY}
          textAnchor={s.anchor}
          fontSize="11"
          fill={INK}
        >
          {s.pct}%
        </text>
      ))}
      <g>
        {slices.map((s, i) => (
          <g key={`l-${s.name}`} transform={`translate(430, ${64 + i * 26})`}>
            <rect width="11" height="11" rx="3" y="-9" fill={s.color} />
            <text x="18" fontSize="11.5" fill={INK}>
              {s.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ------------------------------ Table ------------------------------ */

function DataTable({ chart, colors }: { chart: ChartSpec; colors: string[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-[0.8rem]">
        <thead>
          <tr className="border-b border-white/12">
            <th className="py-2 pr-3 text-left font-medium text-slate-400"> </th>
            {chart.categories.map((c) => (
              <th key={c} className="px-3 py-2 text-right font-medium whitespace-nowrap text-slate-300">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.series.map((s, i) => (
            <tr key={s.name} className="border-b border-white/6">
              <td className="py-2 pr-3 text-slate-300">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ background: colors[i] }}
                  />
                  {s.name}
                </span>
              </td>
              {s.values.map((v, j) => (
                <td key={j} className="px-3 py-2 text-right text-slate-200 tabular-nums">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------- Tooltip ----------------------------- */

function Tooltip({
  label,
  rows,
  unit,
  leftPct,
}: {
  label: string;
  rows: { name: string; value: number; color: string }[];
  unit?: string;
  leftPct: number;
}) {
  const flip = leftPct > 62;
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-2 z-10 rounded-lg border border-white/12 bg-ink-900/95 px-3 py-2 shadow-xl backdrop-blur-sm"
      )}
      style={{
        left: `${leftPct}%`,
        transform: flip ? "translateX(-104%)" : "translateX(4%)",
      }}
    >
      <p className="mb-1 text-[0.7rem] font-medium whitespace-nowrap text-slate-200">{label}</p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-2 text-[0.7rem] whitespace-nowrap text-slate-300">
          <span className="size-2 rounded-[2px]" style={{ background: r.color }} />
          {r.name}
          <span className="ml-auto pl-3 font-medium text-white tabular-nums">{r.value}</span>
        </p>
      ))}
      {unit && <p className="mt-1 text-[0.62rem] text-slate-500">{unit}</p>}
    </div>
  );
}
