import type { Metadata } from "next";
import { Mic } from "lucide-react";
import { SkillHeader } from "@/components/SkillHeader";
import { TestListCard } from "@/components/TestListCard";
import { SPEAKING_TESTS } from "@/lib/tests";
import { SKILL_MAP } from "@/lib/skills";

export const metadata: Metadata = {
  title: "Luyện Speaking",
  description: "Ghi âm trực tiếp trong trình duyệt, AI chấm fluency, từ vựng và ngữ pháp.",
};

export default function SpeakingListPage() {
  const skill = SKILL_MAP.speaking;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SkillHeader
        eyebrow="IELTS Speaking"
        title="Luyện kỹ năng Nói"
        description={skill.description}
        accent={skill.color}
        icon={<Mic className="size-7 text-white" />}
        tips={[
          "Đừng học thuộc câu trả lời — giám khảo nhận ra ngay và sẽ hạ điểm Fluency.",
          "Part 2 nên nói đủ 2 phút; dừng sớm là dấu hiệu rõ nhất của band thấp.",
          "Trả lời Part 1 khoảng 2-3 câu, đừng chỉ nói yes hoặc no.",
          "Nói sai một chút vẫn hơn im lặng lâu — ngập ngừng bị trừ điểm nặng hơn lỗi nhỏ.",
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SPEAKING_TESTS.map((t, i) => {
          const cue = t.parts.find((p) => p.part === 2)?.cueCard;
          return (
            <TestListCard
              key={t.id}
              index={i}
              href={`/speaking/${t.id}`}
              title={t.title}
              difficulty={t.difficulty}
              duration="11-14 phút"
              questions="3 part"
              topics={[t.topic]}
              accent={skill.color}
              footer={
                cue ? (
                  <p className="mt-4 line-clamp-2 text-[0.8rem] leading-relaxed text-slate-400 italic">
                    “{cue.topic}”
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
