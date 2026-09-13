import { bandColor, bandLabel } from "@/lib/band";
import { cn } from "@/lib/utils";

export function BandRing({
  band,
  size = 148,
  stroke = 11,
  showLabel = true,
  caption,
  className,
}: {
  band: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
  caption?: string;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, band / 9));
  const color = bandColor(band);
  const gid = `band-grad-${Math.round(band * 10)}-${size}`;

  return (
    <div className={cn("relative inline-grid place-items-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)",
            filter: `drop-shadow(0 0 10px ${color}55)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className="font-display text-[2.1rem] leading-none font-semibold tabular-nums"
            style={{ color }}
          >
            {band.toFixed(1)}
          </div>
          {showLabel && (
            <div className="mt-1 text-[0.68rem] tracking-wide text-slate-400">
              {caption ?? bandLabel(band)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
