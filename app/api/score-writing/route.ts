import { NextResponse } from "next/server";
import { FEEDBACK_SCHEMA, GeminiNotConfigured, geminiJson } from "@/lib/gemini";
import { heuristicWritingFeedback } from "@/lib/heuristic-score";
import type { AiFeedback } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Bạn là giám khảo IELTS Writing có chứng chỉ, đã chấm hơn 10.000 bài thi.
Bạn chấm theo ĐÚNG bộ IELTS Writing band descriptors công khai, không nới tay và cũng không quá khắt khe.

Quy tắc bắt buộc:
- Cho điểm từng tiêu chí theo nấc 0.5 (ví dụ 6.0, 6.5, 7.0). overallBand là trung bình 4 tiêu chí, làm tròn theo quy tắc IELTS (.25 lên .5, .75 lên số nguyên kế tiếp).
- 4 tiêu chí, dùng đúng key và label sau:
  task / "Task Achievement" (Task 1) hoặc "Task Response" (Task 2)
  coherence / "Coherence & Cohesion"
  lexical / "Lexical Resource"
  grammar / "Grammatical Range & Accuracy"
- Trường comment viết bằng TIẾNG VIỆT, 2-3 câu, nêu rõ vì sao ở band đó và cần gì để lên nửa band.
- evidence: 1-3 đoạn TRÍCH NGUYÊN VĂN tiếng Anh từ bài của thí sinh làm dẫn chứng.
- corrections: 4-8 lỗi thực sự có trong bài. original là câu gốc nguyên văn, corrected là câu đã sửa, reason viết bằng TIẾNG VIỆT và ngắn gọn.
- upgradedVocabulary: 5-8 cặp từ/cụm từ thí sinh đã dùng và cách diễn đạt hay hơn ở band 7-8.
- strengths và improvements: viết bằng TIẾNG VIỆT, mỗi mục 1 câu, mỗi danh sách 3-4 mục.
- modelAnswer: một bài mẫu band 8 hoàn chỉnh bằng TIẾNG ANH cho đúng đề này, đúng số từ tối thiểu.
- Nếu bài không đủ số từ tối thiểu, hoặc lạc đề, hãy hạ điểm tiêu chí task đúng như giám khảo thật sẽ làm.
- Nếu bài quá ngắn hoặc không phải tiếng Anh, cho band thấp và nói rõ lý do.`;

export async function POST(req: Request) {
  let payload: {
    taskNumber?: 1 | 2;
    prompt?: string;
    essay?: string;
    minWords?: number;
    chartSummary?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const { taskNumber = 2, prompt = "", essay = "", minWords = 250, chartSummary } = payload;

  if (!essay || essay.trim().split(/\s+/).length < 20) {
    return NextResponse.json(
      { error: "Bài viết quá ngắn để chấm. Hãy viết ít nhất 20 từ." },
      { status: 400 }
    );
  }

  const taskLabel = taskNumber === 1 ? "Task Achievement" : "Task Response";

  const user = [
    `ĐỀ BÀI (IELTS Writing Task ${taskNumber}, tối thiểu ${minWords} từ):`,
    prompt,
    chartSummary ? `\nSỐ LIỆU CỦA BIỂU ĐỒ:\n${chartSummary}` : "",
    `\nBÀI LÀM CỦA THÍ SINH (${essay.trim().split(/\s+/).length} từ):`,
    essay,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const feedback = await geminiJson<AiFeedback>({
      system: SYSTEM,
      user,
      schema: FEEDBACK_SCHEMA,
    });
    return NextResponse.json({ feedback, mode: "ai" });
  } catch (err) {
    if (err instanceof GeminiNotConfigured) {
      return NextResponse.json({
        feedback: heuristicWritingFeedback(essay, minWords, taskLabel),
        mode: "heuristic",
      });
    }
    console.error("score-writing:", err);
    return NextResponse.json(
      {
        error:
          "Không gọi được AI chấm bài. Kiểm tra GEMINI_API_KEY hoặc thử lại sau ít phút (free tier có giới hạn số lượt/phút).",
      },
      { status: 502 }
    );
  }
}
