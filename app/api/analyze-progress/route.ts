import { NextResponse } from "next/server";
import { GeminiNotConfigured, geminiJson } from "@/lib/gemini";
import type { Attempt, ProgressAnalysis, Skill } from "@/lib/types";
import { SKILL_MAP } from "@/lib/skills";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    prioritySkill: { type: "string" },
    recommendation: { type: "string" },
    reason: { type: "string" },
    nextActions: { type: "array", items: { type: "string" } },
    recommendedHref: { type: "string" },
  },
  required: [
    "summary",
    "prioritySkill",
    "recommendation",
    "reason",
    "nextActions",
    "recommendedHref",
  ],
} as Record<string, unknown>;

const SYSTEM = `Bạn là cố vấn học IELTS. Phân tích các bài làm gần đây của một học viên.
Viết toàn bộ câu trả lời bằng tiếng Việt, ngắn gọn và thực tế.
Ưu tiên kỹ năng có điểm thấp hoặc đang giảm. Đề xuất đúng một hành động tiếp theo:
Reading, Listening, Writing, Speaking hoặc một đề IELTS đầy đủ tại /ielts.
Không bịa dữ liệu, không đưa lời khuyên chung chung.`;

function fallback(attempts: Attempt[]): ProgressAnalysis {
  const grouped = new Map<Skill, number[]>();
  for (const attempt of attempts) {
    const values = grouped.get(attempt.skill) ?? [];
    values.push(attempt.band);
    grouped.set(attempt.skill, values);
  }
  const lowest = [...grouped.entries()]
    .map(([skill, values]) => ({
      skill,
      average: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.average - b.average)[0]?.skill ?? "reading";
  const meta = SKILL_MAP[lowest];
  return {
    summary: `Dữ liệu gần đây cho thấy bạn nên ưu tiên ${meta.name} để kéo band tổng lên đều hơn.`,
    prioritySkill: lowest,
    recommendation: `Làm thêm một đề ${meta.name} trong hôm nay.`,
    reason: `Đây là kỹ năng có mức điểm trung bình thấp nhất trong các bài đã lưu.`,
    nextActions: [
      `Làm một đề ${meta.name} mới.`,
      "Xem lại các câu sai ngay sau khi nộp.",
      "Ghi lại một lỗi lặp lại để sửa trong bài kế tiếp.",
    ],
    recommendedHref: meta.href,
    mode: "heuristic",
  };
}

export async function POST(req: Request) {
  let payload: { attempts?: Partial<Attempt>[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const attempts = (payload.attempts ?? []).slice(0, 20);
  if (attempts.length === 0) {
    return NextResponse.json(fallback([]));
  }

  const user = attempts
    .map(
      (attempt) =>
        `${attempt.skill} | ${attempt.testTitle} | band ${attempt.band} | ` +
        `${attempt.correct ?? "-"} / ${attempt.total ?? "-"} | ${attempt.createdAt}`
    )
    .join("\n");

  try {
    const analysis = await geminiJson<Omit<ProgressAnalysis, "mode">>({
      system: SYSTEM,
      user: `Các bài làm gần đây:\n${user}`,
      schema: ANALYSIS_SCHEMA,
    });
    const prioritySkill =
      analysis.prioritySkill === "listening" ||
      analysis.prioritySkill === "reading" ||
      analysis.prioritySkill === "writing" ||
      analysis.prioritySkill === "speaking" ||
      analysis.prioritySkill === "full"
        ? analysis.prioritySkill
        : "reading";
    return NextResponse.json({
      ...analysis,
      prioritySkill,
      mode: "ai",
    });
  } catch (err) {
    if (!(err instanceof GeminiNotConfigured)) {
      console.error("analyze-progress:", err);
    }
    return NextResponse.json(fallback(attempts as Attempt[]));
  }
}
