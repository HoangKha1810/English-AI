import { NextResponse } from "next/server";
import { FEEDBACK_SCHEMA, GeminiNotConfigured, geminiJson } from "@/lib/gemini";
import { roundBand } from "@/lib/band";
import type { AiFeedback } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Bạn là giám khảo IELTS Speaking có chứng chỉ. Bạn nhận được bản ghi lời nói (transcript)
của thí sinh cho một phần thi Speaking, kèm thời lượng nói thực tế.

Quy tắc bắt buộc:
- Chấm theo ĐÚNG IELTS Speaking band descriptors, 4 tiêu chí, dùng đúng key và label sau:
  fluency / "Fluency & Coherence"
  lexical / "Lexical Resource"
  grammar / "Grammatical Range & Accuracy"
  pronunciation / "Pronunciation"
- Điểm theo nấc 0.5. overallBand là trung bình 4 tiêu chí, làm tròn theo quy tắc IELTS.
- QUAN TRỌNG: bạn chỉ có transcript, KHÔNG nghe được âm thanh. Với tiêu chí Pronunciation,
  hãy nói rõ trong comment rằng đây là ước lượng gián tiếp dựa trên độ trôi chảy, tốc độ nói
  (số từ mỗi phút) và độ phức tạp của từ vựng; đừng khẳng định về trọng âm hay ngữ điệu cụ thể.
- Dùng tốc độ nói để đánh giá fluency: dưới 100 từ/phút là chậm, 120-160 từ/phút là tự nhiên.
- comment viết bằng TIẾNG VIỆT, 2-3 câu. evidence là 1-3 trích dẫn nguyên văn tiếng Anh từ transcript.
- corrections: 3-6 lỗi ngữ pháp hoặc cách dùng từ thực sự có trong transcript; reason bằng TIẾNG VIỆT.
- upgradedVocabulary: 5-8 cặp từ thí sinh đã dùng và cách nói tự nhiên hơn ở band 7-8.
- strengths, improvements: TIẾNG VIỆT, 3-4 mục mỗi danh sách.
- modelAnswer: một câu trả lời mẫu band 8 bằng TIẾNG ANH cho đúng câu hỏi/cue card này.
- Nếu transcript quá ngắn so với thời gian yêu cầu, hạ điểm Fluency và nói rõ lý do.`;

export async function POST(req: Request) {
  let payload: {
    part?: number;
    questions?: string[];
    cueCard?: { topic: string; bullets: string[] } | null;
    transcript?: string;
    spokenSeconds?: number;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const { part = 1, questions = [], cueCard, transcript = "", spokenSeconds = 0 } = payload;
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;

  if (words < 15) {
    return NextResponse.json(
      { error: "Phần nói quá ngắn để chấm. Hãy nói ít nhất vài câu." },
      { status: 400 }
    );
  }

  const wpm = spokenSeconds > 0 ? Math.round((words / spokenSeconds) * 60) : 0;

  const user = [
    `IELTS SPEAKING PART ${part}`,
    cueCard
      ? `CUE CARD: ${cueCard.topic}\n${cueCard.bullets.map((b) => `- ${b}`).join("\n")}`
      : `CÂU HỎI:\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
    `\nTHỜI GIAN NÓI: ${spokenSeconds} giây · ${words} từ · khoảng ${wpm} từ/phút`,
    `\nTRANSCRIPT:\n${transcript}`,
  ].join("\n");

  try {
    const feedback = await geminiJson<AiFeedback>({
      system: SYSTEM,
      user,
      schema: FEEDBACK_SCHEMA,
    });
    return NextResponse.json({ feedback: { ...feedback, transcript }, mode: "ai" });
  } catch (err) {
    if (err instanceof GeminiNotConfigured) {
      const fluency = wpm >= 120 ? 6.5 : wpm >= 95 ? 6 : wpm >= 70 ? 5.5 : 5;
      const unique = new Set(
        transcript.toLowerCase().match(/[a-z']+/g) ?? []
      ).size;
      const lexical = unique > 110 ? 6.5 : unique > 70 ? 6 : 5.5;
      const band = roundBand((fluency + lexical + 5.5 + 5.5) / 4);
      const fallback: AiFeedback = {
        overallBand: band,
        transcript,
        criteria: [
          {
            key: "fluency",
            label: "Fluency & Coherence",
            band: fluency,
            comment: `Bạn nói khoảng ${wpm} từ/phút trong ${spokenSeconds} giây. Tốc độ tự nhiên của band 7 thường rơi vào 120-160 từ/phút.`,
          },
          {
            key: "lexical",
            label: "Lexical Resource",
            band: lexical,
            comment: `Bạn dùng ${unique} từ khác nhau. Đây chỉ là ước lượng theo số liệu, chưa đánh giá được độ chính xác khi dùng từ.`,
          },
          {
            key: "grammar",
            label: "Grammatical Range & Accuracy",
            band: 5.5,
            comment:
              "Chưa cấu hình AI nên không phân tích được ngữ pháp. Hãy thêm GEMINI_API_KEY để có nhận xét thật.",
          },
          {
            key: "pronunciation",
            label: "Pronunciation",
            band: 5.5,
            comment:
              "Không thể đánh giá phát âm nếu chưa bật AI. Đây chỉ là giá trị mặc định, không phải điểm thật.",
          },
        ],
        strengths: [`Bạn đã nói liên tục ${spokenSeconds} giây và tạo ra ${words} từ.`],
        improvements: [
          "Thêm GEMINI_API_KEY vào .env.local để nhận nhận xét chi tiết theo band descriptors.",
        ],
      };
      return NextResponse.json({ feedback: fallback, mode: "heuristic" });
    }
    console.error("score-speaking:", err);
    return NextResponse.json(
      {
        error:
          "Không gọi được AI chấm bài. Kiểm tra GEMINI_API_KEY hoặc thử lại sau ít phút (free tier có giới hạn số lượt/phút).",
      },
      { status: 502 }
    );
  }
}
