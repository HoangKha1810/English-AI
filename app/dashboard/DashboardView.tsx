"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  Flame,
  Headphones,
  Info,
  Mic,
  PenLine,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { BandRing } from "@/components/ui/BandRing";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { ProgressChart } from "@/components/ProgressChart";
import { useAuth } from "@/lib/auth-context";
import { getAttempts } from "@/lib/storage";
import { SKILLS } from "@/lib/skills";
import { bandLabel, overallBand } from "@/lib/band";
import type { Attempt, Skill } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const ICONS = {
  listening: Headphones,
  reading: BookOpenCheck,
  writing: PenLine,
  speaking: Mic,
} as const;

const TARGETS = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0];

export function DashboardView() {
  const { user, profile, loading, configured, storageId, setTargetBand } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [chartSkill, setChartSkill] = useState<Skill>("reading");

  useEffect(() => {
    if (loading) return;
    let alive = true;
    getAttempts(storageId, { max: 200 })
      .then((a) => alive && setAttempts(a))
      .catch(() => alive && setAttempts([]));
    return () => {
      alive = false;
    };
  }, [loading, storageId]);

  const bySkill = useMemo(() => {
    const map = {} as Record<Skill, Attempt[]>;
    for (const s of SKILLS) map[s.key] = [];
    for (const a of attempts ?? []) map[a.skill]?.push(a);
    for (const s of SKILLS) map[s.key].sort((x, y) => x.createdAt - y.createdAt);
    return map;
  }, [attempts]);

  const latest = useMemo(() => {
    const out = {} as Record<Skill, number | undefined>;
    for (const s of SKILLS) {
      const list = bySkill[s.key];
      out[s.key] = list.length > 0 ? list[list.length - 1].band : undefined;
    }
    return out;
  }, [bySkill]);

  const overall = overallBand(SKILLS.map((s) => latest[s.key]));
  const total = attempts?.length ?? 0;
  const best = attempts && attempts.length > 0 ? Math.max(...attempts.map((a) => a.band)) : 0;

  if (loading || attempts === null) return <PageLoader label="Đang tải tiến độ..." />;

  const chartPoints = bySkill[chartSkill].map((a) => ({
    t: a.createdAt,
    band: a.band,
    title: a.testTitle,
  }));
  const chartMeta = SKILLS.find((s) => s.key === chartSkill)!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-500">
            {user ? `Xin chào, ${profile?.displayName ?? user.email}` : "Chế độ khách"}
          </p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tiến độ của bạn
          </h1>
        </div>
        {(profile?.streak ?? 0) > 0 && (
          <Badge tone="amber" className="px-3 py-1.5 text-sm">
            <Flame className="size-4" />
            Chuỗi {profile?.streak} ngày
          </Badge>
        )}
      </div>

      {!user && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4">
          <Info className="size-5 shrink-0 text-violet-600" />
          <p className="min-w-0 flex-1 text-[0.88rem] leading-relaxed text-violet-800">
            {configured
              ? "Bạn đang xem tiến độ lưu tạm trong trình duyệt này. Đăng nhập để đồng bộ giữa các thiết bị và không bị mất dữ liệu."
              : "Chưa cấu hình Firebase nên tiến độ chỉ lưu trong trình duyệt này."}
          </p>
          {configured && (
            <ButtonLink href="/login" size="sm">
              Đăng nhập
            </ButtonLink>
          )}
        </div>
      )}

      {total === 0 ? (
        <GlassCard strong className="p-10 text-center">
          <Sparkles className="mx-auto size-9 text-violet-600" />
          <h2 className="font-display mt-4 text-xl font-semibold text-ink-900">
            Bạn chưa làm bài nào
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            Làm thử một đề bất kỳ, kết quả sẽ hiện ở đây kèm biểu đồ tiến bộ theo thời gian.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {SKILLS.map((s) => (
              <ButtonLink key={s.key} href={s.href} variant="secondary" size="sm">
                {s.name}
              </ButtonLink>
            ))}
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Tong quan */}
          <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
            <GlassCard strong className="flex flex-col items-center p-7">
              <p className="text-xs tracking-wide text-ink-500 uppercase">Band tổng</p>
              <div className="mt-4">
                {overall !== null ? (
                  <BandRing band={overall} size={164} caption={bandLabel(overall)} />
                ) : (
                  <p className="text-ink-450">Chưa đủ dữ liệu</p>
                )}
              </div>
              <p className="mt-4 max-w-[15rem] text-center text-[0.75rem] leading-relaxed text-ink-450">
                Tính từ kết quả gần nhất của mỗi kỹ năng, làm tròn theo quy tắc IELTS.
              </p>

              <div className="mt-6 w-full border-t border-rose-200/70 pt-5">
                <p className="flex items-center gap-1.5 text-xs text-ink-500">
                  <Target className="size-3.5" />
                  Mục tiêu của bạn
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {TARGETS.map((t) => (
                    <button
                      key={t}
                      onClick={() => void setTargetBand(t)}
                      className={cn(
                        "rounded-xl border px-2.5 py-1.5 text-xs font-medium tabular-nums transition-colors",
                        profile?.targetBand === t
                          ? "border-violet-400/55 bg-violet-500/20 text-ink-900"
                          : "border-rose-200/80 bg-white/60 text-ink-500 hover:bg-white/75"
                      )}
                    >
                      {t.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="grid gap-4 sm:grid-cols-2">
              {SKILLS.map((s) => {
                const Icon = ICONS[s.key];
                const list = bySkill[s.key];
                const band = latest[s.key];
                const prev = list.length > 1 ? list[list.length - 2].band : undefined;
                const delta = band !== undefined && prev !== undefined ? band - prev : 0;
                return (
                  <Link key={s.key} href={s.href} className="group">
                    <GlassCard
                      hover
                      glowColor={s.color}
                      className="flex h-full flex-col p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-10 place-items-center rounded-2xl bg-linear-to-br ${s.gradient}`}
                        >
                          <Icon className="size-5 text-white" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-semibold text-ink-900">{s.name}</p>
                          <p className="text-[0.7rem] text-ink-450">
                            {list.length} lần làm bài
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <p
                            className="font-display text-2xl leading-none font-semibold tabular-nums"
                            style={{ color: band !== undefined ? s.color : "#9b7789" }}
                          >
                            {band !== undefined ? band.toFixed(1) : "--"}
                          </p>
                          {delta !== 0 && (
                            <p
                              className={cn(
                                "mt-1 text-[0.68rem] font-medium tabular-nums",
                                delta > 0 ? "text-emerald-600" : "text-rose-600"
                              )}
                            >
                              {delta > 0 ? "+" : ""}
                              {delta.toFixed(1)}
                            </p>
                          )}
                        </div>
                      </div>

                      {list.length > 1 ? (
                        <Sparkline
                          values={list.slice(-8).map((a) => a.band)}
                          color={s.color}
                        />
                      ) : (
                        <p className="mt-auto pt-5 text-[0.72rem] text-ink-450">
                          {list.length === 1
                            ? "Làm thêm một đề nữa để thấy đường tiến bộ."
                            : "Chưa làm đề nào ở kỹ năng này."}
                        </p>
                      )}
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Bieu do tien bo */}
          <GlassCard className="mt-5 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Band theo thời gian
              </h2>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {SKILLS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setChartSkill(s.key)}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                      chartSkill === s.key
                        ? "border-rose-300/90 bg-white/90 text-ink-900"
                        : "border-rose-200/70 bg-white/55 text-ink-500 hover:bg-white/72"
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <ProgressChart
              points={chartPoints}
              color={chartMeta.color}
              label={chartMeta.name}
              targetBand={profile?.targetBand}
            />
          </GlassCard>

          {/* Thong ke nhanh */}
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Stat icon={CalendarDays} label="Tổng số bài đã làm" value={String(total)} />
            <Stat icon={Trophy} label="Band cao nhất" value={best.toFixed(1)} />
            <Stat
              icon={Flame}
              label="Chuỗi ngày học"
              value={`${profile?.streak ?? 0} ngày`}
            />
          </div>

          {/* Lich su */}
          <GlassCard className="mt-5 overflow-hidden">
            <h2 className="font-display border-b border-rose-200/70 px-5 py-4 text-lg font-semibold text-ink-900">
              Lịch sử làm bài
            </h2>
            <ul className="divide-y divide-rose-200/60">
              {(attempts ?? [])
                .slice()
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 20)
                .map((a) => {
                  const meta = SKILLS.find((s) => s.key === a.skill)!;
                  const Icon = ICONS[a.skill];
                  return (
                    <li
                      key={a.id ?? `${a.testId}-${a.createdAt}`}
                      className="flex items-center gap-3.5 px-5 py-3.5"
                    >
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-xl"
                        style={{ background: `${meta.color}22` }}
                      >
                        <Icon className="size-4.5" style={{ color: meta.color }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.9rem] font-medium text-ink-900">
                          {a.testTitle}
                        </p>
                        <p className="text-[0.72rem] text-ink-450">
                          {formatDate(a.createdAt)}
                          {a.total ? ` · ${a.correct}/${a.total} câu` : ""}
                        </p>
                      </div>
                      <span
                        className="font-display shrink-0 text-lg font-semibold tabular-nums"
                        style={{ color: meta.color }}
                      >
                        {a.band.toFixed(1)}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </GlassCard>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <GlassCard className="flex items-center gap-4 p-5">
      <span className="grid size-11 place-items-center rounded-2xl border border-rose-200/80 bg-white/65">
        <Icon className="size-5 text-violet-600" />
      </span>
      <div>
        <p className="text-xs text-ink-500">{label}</p>
        <p className="font-display mt-0.5 text-xl font-semibold text-ink-900 tabular-nums">
          {value}
        </p>
      </div>
    </GlassCard>
  );
}


/** Duong band thu nho trong the ky nang */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 240;
  const h = 46;
  const min = Math.min(...values, 4);
  const max = Math.max(...values, min + 1);
  const x = (i: number) =>
    values.length <= 1 ? w / 2 : (i * w) / (values.length - 1);
  const y = (v: number) => h - 5 - ((v - min) / (max - min)) * (h - 12);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-auto h-14 w-full pt-5"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} fillOpacity="0.14" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="3.5" fill={color} />
    </svg>
  );
}
