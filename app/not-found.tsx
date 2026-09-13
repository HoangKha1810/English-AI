import { Compass } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ButtonLink } from "@/components/ui/Button";
import { SKILLS } from "@/lib/skills";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4">
      <GlassCard strong className="w-full p-10 text-center">
        <Compass className="mx-auto size-10 text-violet-300" />
        <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight">
          Không tìm thấy trang này
        </h1>
        <p className="mt-2 text-slate-400">
          Có thể đường dẫn đã thay đổi, hoặc đề thi bạn tìm không tồn tại.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Về trang chủ</ButtonLink>
          {SKILLS.map((s) => (
            <ButtonLink key={s.key} href={s.href} variant="secondary" size="md">
              {s.name}
            </ButtonLink>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
