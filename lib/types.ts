export type Skill = "reading" | "listening" | "writing" | "speaking";

export type QuestionType =
  | "multiple_choice"
  | "multiple_select"
  | "true_false_notgiven"
  | "yes_no_notgiven"
  | "matching_headings"
  | "matching_information"
  | "matching_features"
  | "sentence_completion"
  | "summary_completion"
  | "short_answer"
  | "form_completion"
  | "note_completion"
  | "map_labelling";

export interface Question {
  /** So thu tu hien thi, duy nhat trong ca bai thi */
  id: number;
  type: QuestionType;
  prompt: string;
  /** Dap an dung. Mang = chap nhan nhieu cach viet (hoac nhieu lua chon voi multiple_select) */
  answer: string | string[];
  /** Lua chon rieng cho cau nay (neu khong dung option bank cua group) */
  options?: string[];
  explanation?: string;
  /** So luong dap an can chon, chi dung voi multiple_select */
  selectCount?: number;
}

export interface QuestionGroup {
  id: string;
  type: QuestionType;
  /** Vi du: "Questions 1-6" */
  range: string;
  instruction: string;
  /** Option bank dung chung, vi du danh sach heading i-viii */
  options?: string[];
  /** Vi du: "NO MORE THAN TWO WORDS" */
  wordLimit?: string;
  /** Doan van/bang bieu phia truoc nhom cau hoi (summary, note completion...) */
  intro?: string;
  questions: Question[];
}

export interface Paragraph {
  /** Nhan doan A, B, C... dung cho dang matching information */
  label?: string;
  text: string;
}

export interface ReadingPassage {
  number: number;
  title: string;
  subtitle?: string;
  paragraphs: Paragraph[];
  groups: QuestionGroup[];
}

export interface ReadingTest {
  id: string;
  title: string;
  module: "Academic" | "General Training";
  difficulty: "Dễ" | "Trung bình" | "Khó";
  durationMinutes: number;
  topics: string[];
  passages: ReadingPassage[];
}

export interface TranscriptLine {
  speaker?: string;
  text: string;
}

export interface ListeningSection {
  number: number;
  title: string;
  context: string;
  /** Duong dan file audio trong /public, vd: /audio/lt-01-s1.mp3 */
  audioSrc: string;
  /** Giong doc cho script sinh audio bang edge-tts */
  voices?: Record<string, string>;
  transcript: TranscriptLine[];
  groups: QuestionGroup[];
}

export interface ListeningTest {
  id: string;
  title: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  durationMinutes: number;
  topics: string[];
  sections: ListeningSection[];
}

export interface ChartSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface ChartSpec {
  kind: "bar" | "line" | "pie" | "table";
  title: string;
  unit?: string;
  categories: string[];
  series: ChartSeries[];
  note?: string;
}

export interface WritingTask {
  taskNumber: 1 | 2;
  type: string;
  durationMinutes: number;
  minWords: number;
  instruction: string;
  prompt: string;
  chart?: ChartSpec;
  ideas?: string[];
  usefulLanguage?: string[];
}

export interface WritingTest {
  id: string;
  title: string;
  module: "Academic" | "General Training";
  difficulty: "Dễ" | "Trung bình" | "Khó";
  topics: string[];
  tasks: WritingTask[];
}

export interface SpeakingPart {
  part: 1 | 2 | 3;
  title: string;
  instruction: string;
  cueCard?: { topic: string; bullets: string[] };
  questions: string[];
  prepSeconds: number;
  speakSeconds: number;
}

export interface SpeakingTest {
  id: string;
  title: string;
  topic: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  parts: SpeakingPart[];
}

export interface IELTSFullTest {
  id: string;
  title: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  topics: string[];
  durationMinutes: number;
  listeningId: string;
  readingId: string;
  writingId: string;
  speakingId: string;
}

/* ---------------- Ket qua & tien do ---------------- */

export interface CriterionScore {
  key: string;
  label: string;
  band: number;
  comment: string;
  /** Vi du cu the trich tu bai lam */
  evidence?: string[];
}

export interface AiFeedback {
  overallBand: number;
  criteria: CriterionScore[];
  strengths: string[];
  improvements: string[];
  corrections?: { original: string; corrected: string; reason: string }[];
  upgradedVocabulary?: { basic: string; better: string }[];
  modelAnswer?: string;
  transcript?: string;
}

export interface Attempt {
  id?: string;
  uid: string;
  skill: Skill;
  testId: string;
  testTitle: string;
  band: number;
  /** Chi co voi Reading / Listening */
  correct?: number;
  total?: number;
  /** Chi co voi Writing / Speaking */
  feedback?: AiFeedback;
  answers?: Record<string, string>;
  durationSeconds: number;
  createdAt: number;
}

export interface FullAttempt {
  id?: string;
  uid: string;
  testId: string;
  testTitle: string;
  bands: Record<Skill, number>;
  overallBand: number;
  durationSeconds: number;
  createdAt: number;
}

export interface ProgressAnalysis {
  summary: string;
  prioritySkill: Skill | "full";
  recommendation: string;
  reason: string;
  nextActions: string[];
  recommendedHref: string;
  mode: "ai" | "heuristic";
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  targetBand: number;
  createdAt: number;
  streak: number;
  lastActiveDay: string | null;
}
