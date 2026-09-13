import type { Skill } from "./types";

export interface SkillMeta {
  key: Skill;
  name: string;
  nameVi: string;
  href: string;
  color: string;
  gradient: string;
  tone: "pink" | "sky" | "violet" | "amber" | "emerald";
  description: string;
  bullets: string[];
  duration: string;
}

export const SKILLS: SkillMeta[] = [
  {
    key: "listening",
    name: "Listening",
    nameVi: "Nghe",
    href: "/listening",
    color: "#7c3aed",
    gradient: "from-violet-400 to-fuchsia-400",
    tone: "violet",
    description:
      "4 section theo đúng format thi thật, audio giọng Anh - Úc - Mỹ, chấm điểm và xem transcript ngay sau khi nộp.",
    bullets: ["4 section · 40 câu", "Nghe lại từng câu", "Transcript song song"],
    duration: "30 phút",
  },
  {
    key: "reading",
    name: "Reading",
    nameVi: "Đọc",
    href: "/reading",
    color: "#db2777",
    gradient: "from-pink-400 to-rose-400",
    tone: "pink",
    description:
      "3 bài đọc học thuật với đủ dạng câu hỏi IELTS. Highlight trực tiếp trên bài, chấm tự động ra band score.",
    bullets: ["3 passage · 40 câu", "Highlight & ghi chú", "Giải thích từng câu"],
    duration: "60 phút",
  },
  {
    key: "writing",
    name: "Writing",
    nameVi: "Viết",
    href: "/writing",
    color: "#b45309",
    gradient: "from-amber-300 to-orange-400",
    tone: "amber",
    description:
      "Task 1 + Task 2 được AI chấm theo đúng 4 tiêu chí band descriptors, kèm sửa lỗi ngữ pháp và gợi ý từ vựng hay hơn.",
    bullets: ["Chấm theo 4 tiêu chí", "Sửa lỗi từng câu", "Bài mẫu band 8"],
    duration: "60 phút",
  },
  {
    key: "speaking",
    name: "Speaking",
    nameVi: "Nói",
    href: "/speaking",
    color: "#047857",
    gradient: "from-emerald-300 to-teal-400",
    tone: "emerald",
    description:
      "Ghi âm trực tiếp trong trình duyệt cho cả 3 part. AI chuyển giọng nói thành văn bản rồi chấm fluency, từ vựng và phát âm.",
    bullets: ["Đủ 3 part", "Ghi âm & nghe lại", "Nhận xét chi tiết"],
    duration: "11-14 phút",
  },
];

export const SKILL_MAP: Record<Skill, SkillMeta> = SKILLS.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }),
  {} as Record<Skill, SkillMeta>
);
