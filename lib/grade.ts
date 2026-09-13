import type { Question, QuestionGroup } from "./types";
import { answersMatch, normalizeAnswer } from "./utils";

export type AnswerMap = Record<string, string | string[]>;

export function isAnswered(value: string | string[] | undefined): boolean {
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

export function gradeQuestion(
  q: Question,
  given: string | string[] | undefined
): boolean {
  if (!isAnswered(given)) return false;

  if (q.type === "multiple_select") {
    const expected = (Array.isArray(q.answer) ? q.answer : [q.answer]).map(
      normalizeAnswer
    );
    const got = (Array.isArray(given) ? given : given ? [given] : []).map(
      normalizeAnswer
    );
    if (got.length !== expected.length) return false;
    return expected.every((e) => got.includes(e));
  }

  const value = Array.isArray(given) ? given[0] : given;
  return answersMatch(value, q.answer);
}

export interface GradeResult {
  correct: number;
  total: number;
  perQuestion: Record<number, boolean>;
}

export function gradeGroups(
  groups: QuestionGroup[],
  answers: AnswerMap
): GradeResult {
  const perQuestion: Record<number, boolean> = {};
  let correct = 0;
  let total = 0;
  for (const g of groups) {
    for (const q of g.questions) {
      total += 1;
      const ok = gradeQuestion(q, answers[String(q.id)]);
      perQuestion[q.id] = ok;
      if (ok) correct += 1;
    }
  }
  return { correct, total, perQuestion };
}

/** Ty le dung theo tung dang cau hoi, dung de goi y diem yeu */
export function accuracyByType(
  groups: QuestionGroup[],
  perQuestion: Record<number, boolean>
): { type: string; correct: number; total: number }[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const g of groups) {
    for (const q of g.questions) {
      const cur = map.get(q.type) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (perQuestion[q.id]) cur.correct += 1;
      map.set(q.type, cur);
    }
  }
  return [...map.entries()]
    .map(([type, v]) => ({ type, ...v }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total);
}

export const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Trắc nghiệm",
  multiple_select: "Chọn nhiều đáp án",
  true_false_notgiven: "True / False / Not Given",
  yes_no_notgiven: "Yes / No / Not Given",
  matching_headings: "Nối tiêu đề đoạn",
  matching_information: "Tìm thông tin trong đoạn",
  matching_features: "Nối đặc điểm",
  sentence_completion: "Hoàn thành câu",
  summary_completion: "Hoàn thành tóm tắt",
  short_answer: "Trả lời ngắn",
  form_completion: "Điền vào biểu mẫu",
  note_completion: "Hoàn thành ghi chú",
  map_labelling: "Điền nhãn bản đồ",
};
