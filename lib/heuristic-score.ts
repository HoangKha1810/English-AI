import type { AiFeedback } from "./types";
import { roundBand } from "./band";

/**
 * Cham uoc luong khi chua co GEMINI_API_KEY. Chi dua tren cac chi so do duoc
 * (do dai, do da dang tu vung, do dai cau, tu noi) nen KHONG thay the duoc
 * nhan xet cua AI hay giao vien - giao dien se noi ro dieu nay.
 */
export function heuristicWritingFeedback(
  essay: string,
  minWords: number,
  taskLabelPrefix: string
): AiFeedback {
  const words = essay.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter(Boolean);
  const unique = new Set(lower).size;
  const ttr = lower.length > 0 ? unique / lower.length : 0;

  const sentences = essay.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const avgSentence = sentences.length > 0 ? wordCount / sentences.length : 0;

  const linkers = [
    "however", "moreover", "furthermore", "therefore", "in addition",
    "for instance", "for example", "on the other hand", "as a result",
    "consequently", "whereas", "although", "nevertheless", "overall",
  ];
  const linkerHits = linkers.filter((l) => essay.toLowerCase().includes(l)).length;

  const lengthScore =
    wordCount >= minWords ? Math.min(7.5, 5.5 + (wordCount - minWords) / 120) : 4.5;
  const lexScore = Math.max(4, Math.min(7.5, 3.5 + ttr * 8));
  const cohScore = Math.max(4, Math.min(7.5, 4.5 + linkerHits * 0.35));
  const grammarScore = Math.max(
    4,
    Math.min(7, 5 + (avgSentence >= 12 && avgSentence <= 24 ? 0.8 : -0.4))
  );

  const overall = roundBand((lengthScore + lexScore + cohScore + grammarScore) / 4);

  const improvements: string[] = [];
  if (wordCount < minWords)
    improvements.push(
      `Bài chỉ có ${wordCount} từ, chưa đủ ${minWords} từ tối thiểu — bài dưới chuẩn bị trừ điểm Task Response.`
    );
  if (linkerHits < 4)
    improvements.push(
      "Dùng thêm từ nối để làm rõ mạch lập luận: however, as a result, in contrast, overall."
    );
  if (ttr < 0.42)
    improvements.push(
      "Từ vựng lặp lại nhiều. Thử paraphrase các danh từ chính thay vì dùng lại nguyên văn đề bài."
    );
  if (avgSentence > 26)
    improvements.push("Câu khá dài, dễ sai ngữ pháp. Tách bớt thành câu ngắn hơn.");
  if (avgSentence < 11 && sentences.length > 3)
    improvements.push("Câu khá ngắn và đơn điệu. Thử kết hợp mệnh đề quan hệ hoặc mệnh đề trạng ngữ.");
  if (improvements.length === 0)
    improvements.push("Độ dài và cấu trúc ổn. Hãy bật chấm bằng AI để có nhận xét sâu về nội dung.");

  return {
    overallBand: overall,
    criteria: [
      {
        key: "task",
        label: `${taskLabelPrefix}`,
        band: Math.round(lengthScore * 2) / 2,
        comment: `Bài dài ${wordCount} từ (yêu cầu tối thiểu ${minWords}). Đây chỉ là ước lượng theo độ dài, chưa đánh giá được nội dung trả lời đúng đề hay chưa.`,
      },
      {
        key: "coherence",
        label: "Coherence & Cohesion",
        band: Math.round(cohScore * 2) / 2,
        comment: `Phát hiện ${linkerHits} từ nối khác nhau và ${sentences.length} câu. Bố cục thực tế cần người/AI đọc mới đánh giá được.`,
      },
      {
        key: "lexical",
        label: "Lexical Resource",
        band: Math.round(lexScore * 2) / 2,
        comment: `Tỉ lệ từ khác nhau ${(ttr * 100).toFixed(0)}%. Tỉ lệ càng cao thì từ vựng càng đa dạng.`,
      },
      {
        key: "grammar",
        label: "Grammatical Range & Accuracy",
        band: Math.round(grammarScore * 2) / 2,
        comment: `Độ dài câu trung bình ${avgSentence.toFixed(1)} từ. Ước lượng này không phát hiện được lỗi ngữ pháp cụ thể.`,
      },
    ],
    strengths: [
      wordCount >= minWords
        ? "Bài viết đủ số từ yêu cầu."
        : "Bạn đã hoàn thành bài — bước tiếp theo là viết đủ số từ.",
      `Sử dụng ${unique} từ khác nhau trong bài.`,
    ],
    improvements,
  };
}
