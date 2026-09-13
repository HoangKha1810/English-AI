import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Headphones,
  Mic,
  PenLine,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SKILLS } from "@/lib/skills";
import { HomeWorkspace } from "@/components/HomeWorkspace";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Luyện IELTS 4 kỹ năng với AI",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "vi-VN",
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      areaServed: "VN",
      knowsAbout: ["IELTS Listening", "IELTS Reading", "IELTS Writing", "IELTS Speaking"],
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      description: SITE_DESCRIPTION,
    },
  ],
};

const ICONS = {
  listening: Headphones,
  reading: BookOpenCheck,
  writing: PenLine,
  speaking: Mic,
} as const;

const STATS = [
  { value: "4", label: "kỹ năng đầy đủ" },
  { value: "40", label: "câu hỏi mỗi đề" },
  { value: "9.0", label: "thang band chuẩn" },
  { value: "0đ", label: "chi phí" },
];

const STEPS = [
  {
    icon: Target,
    title: "Chọn kỹ năng và đề",
    text: "Mỗi đề được thiết kế đúng cấu trúc và thời gian của kỳ thi thật, có phân mức độ khó.",
  },
  {
    icon: Clock3,
    title: "Làm bài có bấm giờ",
    text: "Đồng hồ đếm ngược, đánh dấu câu cần xem lại, tự động lưu bài khi bạn rời trang.",
  },
  {
    icon: Wand2,
    title: "Nhận band score & nhận xét",
    text: "Reading và Listening chấm ngay lập tức. Writing và Speaking được AI chấm theo 4 tiêu chí chính thức.",
  },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI chấm theo band descriptors",
    text: "Không chỉ cho điểm, AI chỉ ra từng câu sai, giải thích lý do và đề xuất cách viết hay hơn.",
  },
  {
    icon: BarChart3,
    title: "Theo dõi tiến bộ theo thời gian",
    text: "Biểu đồ band score từng kỹ năng, chuỗi ngày học liên tiếp và khoảng cách tới mục tiêu của bạn.",
  },
  {
    icon: CheckCircle2,
    title: "Nội dung gốc, an toàn bản quyền",
    text: "Toàn bộ bài đọc, audio và đề viết đều được biên soạn riêng, không sao chép từ sách luyện thi.",
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeWorkspace />

      {/* ---------------- Hero ---------------- */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="animate-fade-up">
            <Badge tone="violet" className="mb-6">
              <Sparkles className="size-3.5" />
              Miễn phí toàn bộ · Không cần thẻ
            </Badge>

            <h1 className="font-display text-[2.4rem] leading-[1.3] font-semibold tracking-tight sm:text-[3.4rem] sm:leading-[1.22]">
              Luyện IELTS đủ 4 kỹ năng,
              <br />
              <span className="gradient-text">chấm điểm bằng AI</span>
            </h1>

            <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-slate-400">
              Đề mô phỏng đúng format thi thật. Reading và Listening chấm tự động ra band
              score. Writing và Speaking được AI nhận xét theo đúng 4 tiêu chí mà giám khảo
              dùng — chỉ ra bạn đang mất điểm ở đâu và sửa thế nào.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/login?mode=signup" size="lg" className="group">
                Bắt đầu luyện ngay
                <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink href="/reading" variant="secondary" size="lg">
                Thử một đề Reading
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-4 gap-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-2xl font-semibold text-white sm:text-[1.7rem]">
                    {s.value}
                  </dt>
                  <dd className="mt-0.5 text-[0.7rem] leading-tight text-slate-500">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mockup card */}
          <div className="animate-fade-up relative [animation-delay:150ms]">
            <div className="animate-float">
              <GlassCard strong className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Kết quả gần nhất</p>
                    <p className="font-display mt-1 text-lg font-semibold text-white">
                      Academic Reading · Đề 1
                    </p>
                  </div>
                  <Badge tone="sky">32/40 câu</Badge>
                </div>

                <div className="my-6 flex items-end gap-5">
                  <div>
                    <p className="text-xs text-slate-400">Band</p>
                    <p className="font-display text-5xl leading-none font-semibold text-sky-300">
                      7.5
                    </p>
                  </div>
                  <div className="flex-1 space-y-2.5 pb-1">
                    {[
                      { label: "True/False/Not Given", v: 86, c: "#38bdf8" },
                      { label: "Matching headings", v: 71, c: "#a78bfa" },
                      { label: "Sentence completion", v: 92, c: "#34d399" },
                    ].map((r) => (
                      <div key={r.label}>
                        <div className="mb-1 flex justify-between text-[0.68rem] text-slate-400">
                          <span>{r.label}</span>
                          <span className="tabular-nums">{r.v}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${r.v}%`,
                              background: r.c,
                              boxShadow: `0 0 8px ${r.c}88`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-violet-400/20 bg-violet-500/8 p-3.5">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-violet-200">
                    <BrainCircuit className="size-3.5" />
                    Nhận xét từ AI
                  </p>
                  <p className="mt-1.5 text-[0.82rem] leading-relaxed text-slate-300">
                    Bạn mất nhiều điểm nhất ở dạng Matching headings. Thử đọc câu đầu và câu
                    cuối mỗi đoạn trước khi xét toàn bộ đoạn văn.
                  </p>
                </div>
              </GlassCard>
            </div>

            <div className="animate-float absolute -bottom-10 left-1/2 -translate-x-1/2 [animation-delay:-3s] sm:left-auto sm:-right-6 sm:translate-x-0">
              <GlassCard strong className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-9 place-items-center rounded-lg bg-linear-to-br from-amber-400 to-orange-500">
                  <PenLine className="size-4.5 text-white" />
                </span>
                <div>
                  <p className="text-[0.68rem] text-slate-400">Writing Task 2</p>
                  <p className="font-display text-sm font-semibold text-amber-200">
                    Band 6.5 → 7.0
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Skills ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Bốn kỹ năng, một nơi luyện
          </h2>
          <p className="mt-3 text-slate-400">
            Mỗi module mô phỏng đúng cấu trúc, thời gian và cách chấm của kỳ thi thật.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {SKILLS.map((s, i) => {
            const Icon = ICONS[s.key];
            return (
              <Link key={s.key} href={s.href} className="group">
                <GlassCard
                  hover
                  glowColor={s.color}
                  className="animate-fade-up h-full overflow-hidden p-6"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`grid size-12 shrink-0 place-items-center rounded-xl bg-linear-to-br ${s.gradient} shadow-lg`}
                      style={{ boxShadow: `0 8px 26px -8px ${s.color}` }}
                    >
                      <Icon className="size-6 text-white" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl font-semibold text-white">
                          {s.name}
                        </h3>
                        <span className="text-sm text-slate-500">· {s.nameVi}</span>
                        <Badge tone={s.tone} className="ml-auto shrink-0">
                          {s.duration}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        {s.description}
                      </p>
                      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-1.5 text-xs text-slate-500"
                          >
                            <CheckCircle2
                              className="size-3.5"
                              style={{ color: s.color }}
                            />
                            {b}
                          </li>
                        ))}
                      </ul>
                      <span
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-transform group-hover:translate-x-1"
                        style={{ color: s.color }}
                      >
                        Vào luyện <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ba bước, mười phút
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <GlassCard key={s.title} className="relative p-6">
              <span className="font-display absolute top-5 right-6 text-5xl font-semibold text-white/6">
                {i + 1}
              </span>
              <span className="grid size-11 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/12">
                <s.icon className="size-5 text-violet-300" />
              </span>
              <h3 className="font-display mt-4 text-lg font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <GlassCard key={f.title} hover className="p-6">
              <f.icon className="size-6 text-sky-300" />
              <h3 className="font-display mt-4 text-lg font-semibold text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-4 sm:px-6">
        <GlassCard
          strong
          className="relative overflow-hidden px-6 py-14 text-center sm:px-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(600px circle at 50% 0%, rgba(124,58,237,0.22), transparent 65%)",
            }}
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Bắt đầu từ hôm nay, <span className="gradient-text">miễn phí</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Tạo tài khoản trong 10 giây để lưu lại tiến độ và xem band score của bạn thay
              đổi qua từng tuần.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/login?mode=signup" size="lg" className="group">
                Tạo tài khoản
                <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink href="/listening" variant="secondary" size="lg">
                Xem đề Listening
              </ButtonLink>
            </div>
          </div>
        </GlassCard>
      </section>
    </>
  );
}
