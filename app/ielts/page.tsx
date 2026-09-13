import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { SkillHeader } from "@/components/SkillHeader";
import { TestListCard } from "@/components/TestListCard";
import { IELTS_TESTS } from "@/lib/tests";

export const metadata: Metadata = {
  title: "Đề IELTS hoàn chỉnh",
  description: "Làm một đề IELTS gồm Listening, Reading, Writing và Speaking.",
};

export default function IELTSListPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SkillHeader
        eyebrow="IELTS Full Test"
        title="Đề IELTS hoàn chỉnh"
        description="Một lượt thi gồm đủ bốn kỹ năng, có thời gian riêng cho từng phần và band tổng sau khi hoàn tất."
        accent="#c4b5fd"
        icon={<ClipboardCheck className="size-7 text-white" />}
        tips={[
          "Listening, Reading và Writing chạy theo đồng hồ riêng của từng phần.",
          "Speaking gồm đủ Part 1, Part 2 và Part 3.",
          "Bài đang làm được lưu lại để bạn quay lại tiếp tục.",
          "Band tổng được làm tròn theo quy tắc IELTS từ bốn kỹ năng.",
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {IELTS_TESTS.map((test, index) => (
          <TestListCard
            key={test.id}
            index={index}
            href={`/ielts/${test.id}`}
            title={test.title}
            difficulty={test.difficulty}
            duration={`${test.durationMinutes} phút`}
            questions="Đủ 4 kỹ năng · 1 band tổng"
            topics={test.topics}
            accent="#c4b5fd"
          />
        ))}
      </div>
    </div>
  );
}
