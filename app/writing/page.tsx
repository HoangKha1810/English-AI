import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { SkillHeader } from "@/components/SkillHeader";
import { TestListCard } from "@/components/TestListCard";
import { WRITING_TESTS } from "@/lib/tests";
import { SKILL_MAP } from "@/lib/skills";

export const metadata: Metadata = {
  title: "Luyện Writing",
  description: "Viết Task 1 và Task 2, được AI chấm theo 4 tiêu chí band descriptors.",
};

export default function WritingListPage() {
  const skill = SKILL_MAP.writing;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SkillHeader
        eyebrow="IELTS Academic Writing"
        title="Luyện kỹ năng Viết"
        description={skill.description}
        accent={skill.color}
        icon={<PenLine className="size-7 text-white" />}
        tips={[
          "Dành 5 phút đầu lập dàn ý — bài có cấu trúc rõ luôn được điểm Coherence cao hơn.",
          "Task 2 chiếm 2/3 số điểm Writing, nên làm Task 2 trước nếu bạn hay thiếu giờ.",
          "Viết dưới 150/250 từ là bị trừ điểm ngay, dù ý hay tới đâu.",
          "Task 1 chỉ mô tả số liệu, tuyệt đối không nêu ý kiến hay giải thích nguyên nhân.",
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WRITING_TESTS.map((t, i) => {
          const t2 = t.tasks.find((x) => x.taskNumber === 2);
          return (
            <TestListCard
              key={t.id}
              index={i}
              href={`/writing/${t.id}`}
              title={t.title}
              difficulty={t.difficulty}
              duration="20 + 40 phút"
              questions={t.tasks.map((x) => x.type).join(" · ")}
              topics={t.topics}
              accent={skill.color}
              footer={
                t2 ? (
                  <p className="mt-4 line-clamp-3 text-[0.8rem] leading-relaxed text-ink-500 italic">
                    “{t2.prompt}”
                  </p>
                ) : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}
