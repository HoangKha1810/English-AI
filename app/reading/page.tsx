import type { Metadata } from "next";
import { BookOpenCheck } from "lucide-react";
import { SkillHeader } from "@/components/SkillHeader";
import { TestListCard } from "@/components/TestListCard";
import { READING_TESTS, countQuestions } from "@/lib/tests";
import { SKILL_MAP } from "@/lib/skills";

export const metadata: Metadata = {
  title: "Luyện Reading",
  description: "Đề đọc học thuật mô phỏng IELTS, chấm tự động ra band score.",
};

export default function ReadingListPage() {
  const skill = SKILL_MAP.reading;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SkillHeader
        eyebrow="IELTS Academic Reading"
        title="Luyện kỹ năng Đọc"
        description={skill.description}
        accent={skill.color}
        icon={<BookOpenCheck className="size-7 text-white" />}
        tips={[
          "Đọc câu hỏi trước, xác định từ khóa rồi mới quét bài đọc.",
          "Bôi vàng đoạn chứa đáp án để dễ kiểm tra lại khi còn thời gian.",
          "Không bỏ trống câu nào — sai không bị trừ điểm.",
          "Chú ý giới hạn từ: viết quá số từ cho phép là mất điểm dù đúng ý.",
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {READING_TESTS.map((t, i) => (
          <TestListCard
            key={t.id}
            index={i}
            href={`/reading/${t.id}`}
            title={t.title}
            difficulty={t.difficulty}
            duration={`${t.durationMinutes} phút`}
            questions={`${countQuestions(t)} câu · ${t.passages.length} bài đọc`}
            topics={t.topics}
            accent={skill.color}
          />
        ))}
      </div>
    </div>
  );
}
