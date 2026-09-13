/**
 * Bang quy doi diem tho -> band IELTS (thang 40 cau).
 * Nguon: bang quy doi duoc cong bo trong bo Cambridge IELTS chinh thuc.
 * Day la muc tham khao - de thi that co the xe dich +/- 0.5.
 */

type BandRow = [min: number, band: number];

const LISTENING_TABLE: BandRow[] = [
  [39, 9.0], [37, 8.5], [35, 8.0], [32, 7.5], [30, 7.0],
  [26, 6.5], [23, 6.0], [18, 5.5], [16, 5.0], [13, 4.5],
  [11, 4.0], [8, 3.5], [6, 3.0], [4, 2.5], [3, 2.0], [2, 1.5], [0, 1.0],
];

const READING_ACADEMIC_TABLE: BandRow[] = [
  [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0],
  [27, 6.5], [23, 6.0], [19, 5.5], [15, 5.0], [13, 4.5],
  [10, 4.0], [8, 3.5], [6, 3.0], [4, 2.5], [3, 2.0], [2, 1.5], [0, 1.0],
];

const READING_GENERAL_TABLE: BandRow[] = [
  [40, 9.0], [39, 8.5], [37, 8.0], [36, 7.5], [34, 7.0],
  [32, 6.5], [30, 6.0], [27, 5.5], [23, 5.0], [19, 4.5],
  [15, 4.0], [12, 3.5], [9, 3.0], [6, 2.5], [4, 2.0], [2, 1.5], [0, 1.0],
];

function lookup(table: BandRow[], raw: number): number {
  for (const [min, band] of table) {
    if (raw >= min) return band;
  }
  return 1.0;
}

/**
 * Quy doi ket qua ra band. Neu bai thi khong du 40 cau, diem duoc
 * quy doi tuyen tinh ve thang 40 truoc khi tra bang.
 */
export function bandFromRaw(
  correct: number,
  total: number,
  kind: "listening" | "reading-academic" | "reading-general" = "reading-academic"
): number {
  if (total <= 0) return 0;
  const scaled = Math.round((correct / total) * 40);
  const table =
    kind === "listening"
      ? LISTENING_TABLE
      : kind === "reading-general"
        ? READING_GENERAL_TABLE
        : READING_ACADEMIC_TABLE;
  return lookup(table, scaled);
}

/** Lam tron theo quy tac IELTS: .25 -> .5 ; .75 -> so nguyen ke tiep */
export function roundBand(value: number): number {
  const floor = Math.floor(value);
  const frac = value - floor;
  if (frac < 0.25) return floor;
  if (frac < 0.75) return floor + 0.5;
  return floor + 1;
}

/** Band tong = trung binh 4 ky nang, lam tron theo quy tac IELTS */
export function overallBand(bands: (number | undefined | null)[]): number | null {
  const valid = bands.filter((b): b is number => typeof b === "number" && b > 0);
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return roundBand(avg);
}

export function bandLabel(band: number): string {
  if (band >= 9) return "Thành thạo tuyệt đối";
  if (band >= 8) return "Rất tốt";
  if (band >= 7) return "Tốt";
  if (band >= 6.5) return "Khá tốt";
  if (band >= 6) return "Khá";
  if (band >= 5.5) return "Trung bình khá";
  if (band >= 5) return "Trung bình";
  if (band >= 4) return "Hạn chế";
  return "Mới bắt đầu";
}

export function bandColor(band: number): string {
  if (band >= 7.5) return "#047857";
  if (band >= 6.5) return "#7c3aed";
  if (band >= 5.5) return "#b45309";
  return "#db2777";
}

export const BAND_DESCRIPTORS_WRITING = [
  { key: "task", label: "Task Achievement / Response" },
  { key: "coherence", label: "Coherence & Cohesion" },
  { key: "lexical", label: "Lexical Resource" },
  { key: "grammar", label: "Grammatical Range & Accuracy" },
];

export const BAND_DESCRIPTORS_SPEAKING = [
  { key: "fluency", label: "Fluency & Coherence" },
  { key: "lexical", label: "Lexical Resource" },
  { key: "grammar", label: "Grammatical Range & Accuracy" },
  { key: "pronunciation", label: "Pronunciation" },
];
