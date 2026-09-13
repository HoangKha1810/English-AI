import { GlassCard } from "./ui/GlassCard";

export function SkillHeader({
  eyebrow,
  title,
  description,
  accent,
  icon,
  tips,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
  tips?: string[];
}) {
  return (
    <header className="mb-10">
      <div className="flex items-start gap-4">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
            boxShadow: `0 10px 30px -10px ${accent}`,
          }}
        >
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: accent }}>
            {eyebrow}
          </p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2.5 max-w-2xl text-[0.95rem] leading-relaxed text-ink-500">
            {description}
          </p>
        </div>
      </div>

      {tips && tips.length > 0 && (
        <GlassCard className="mt-6 p-4">
          <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Mẹo làm bài
          </p>
          <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {tips.map((t) => (
              <li key={t} className="flex gap-2 text-[0.85rem] leading-relaxed text-ink-700">
                <span style={{ color: accent }}>•</span>
                {t}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </header>
  );
}
