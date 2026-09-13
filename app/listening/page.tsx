import type { Metadata } from "next";
import { Headphones } from "lucide-react";
import { SkillHeader } from "@/components/SkillHeader";
import { TestListCard } from "@/components/TestListCard";
import { LISTENING_TESTS, countQuestions } from "@/lib/tests";
import { SKILL_MAP } from "@/lib/skills";

export const metadata: Metadata = {
  title: "Luyện Listening",
  description: "Đề nghe mô phỏng IELTS với 4 section, chấm tự động ra band score.",
};

export default function ListeningListPage() {
  const skill = SKILL_MAP.listening;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SkillHeader
        eyebrow="IELTS Listening"
        title="Luyện kỹ năng Nghe"
        description={skill.description}
        accent={skill.color}
        icon={<Headphones className="size-7 text-white" />}
        tips={[
          "Đọc lướt câu hỏi trước khi audio bắt đầu để biết cần nghe thông tin gì.",
          "Cẩn thận với chỗ người nói tự sửa lời — đáp án là thông tin nói SAU CÙNG.",
          "Viết đúng chính tả và đúng số từ cho phép, sai chính tả là mất điểm.",
          "Nếu lỡ một câu, bỏ qua ngay để không mất luôn câu kế tiếp.",
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LISTENING_TESTS.map((t, i) => (
          <TestListCard
            key={t.id}
            index={i}
            href={`/listening/${t.id}`}
            title={t.title}
            difficulty={t.difficulty}
            duration={`${t.durationMinutes} phút`}
            questions={`${countQuestions(t)} câu · ${t.sections.length} section`}
            topics={t.topics}
            accent={skill.color}
          />
        ))}
      </div>
    </div>
  );
}
