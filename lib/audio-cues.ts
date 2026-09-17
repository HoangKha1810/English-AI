import type { ListeningSection, Question } from "./types";
import { normalizeAnswer } from "./utils";

/** Mot dong transcript bat dau va ket thuc o giay thu may trong file MP3 */
export interface LineTiming {
  start: number;
  end: number;
}

export interface Cue {
  /** Chi so dong transcript chua dap an */
  lineIdx: number;
  start: number;
  end: number;
  /** true khi khong tim duoc dong chua dap an, phai suy ra tu cac cau lan can */
  approximate: boolean;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "with", "is", "are", "was", "were", "be", "been", "it", "its", "this", "that",
  "they", "them", "their", "you", "your", "we", "our", "he", "she", "his", "her",
  "from", "by", "as", "if", "not", "no", "yes", "can", "will", "would", "have",
  "has", "had", "do", "does", "did", "so", "than", "then", "there", "which",
  "what", "when", "where", "who", "how", "all", "more", "most", "some", "any",
]);

function words(text: string): string[] {
  return normalizeAnswer(text)
    .split(" ")
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

/** Bo nhan dau lua chon: "C. They use..." -> "They use...", "ii. Cost" -> "Cost" */
function stripLabel(text: string): string {
  return text.replace(/^\s*(?:[A-Ha-h]|[ivxIVX]{1,4})\s*[.)]\s*/, "");
}

const FILLERS = new Set(["of", "the", "a", "an", "and", "oh"]);

/** Bo khoang trang, dau noi va tu dem, de "0412 555 983" khop "0412555983" */
function compress(text: string): string {
  return normalizeAnswer(text)
    .split(" ")
    .filter((w) => w && !FILLERS.has(w))
    .join("")
    .replace(/-/g, "");
}

const ONES: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/**
 * Doi so doc bang chu trong transcript thanh chu so, de dap an dang so
 * van do duoc: "five hundred and fifty" -> "550", "thirty" -> "30".
 */
export function spellNumbersToDigits(text: string): string {
  const out: string[] = [];
  const tokens = normalizeAnswer(text).split(" ");
  let acc: number | null = null;
  let pending = 0;

  const flush = () => {
    if (acc !== null || pending) {
      out.push(String((acc ?? 0) + pending));
      acc = null;
      pending = 0;
    }
  };

  for (const raw of tokens) {
    const w = raw.replace(/-/g, "");
    if (w in ONES) {
      pending += ONES[w];
    } else if (w in TENS) {
      pending += TENS[w];
    } else if (w === "hundred") {
      pending = (pending || 1) * 100;
    } else if (w === "thousand") {
      acc = ((acc ?? 0) + (pending || 1)) * 1000;
      pending = 0;
    } else if (w === "and" && (acc !== null || pending)) {
      // "five hundred and fifty" van la mot so
    } else {
      flush();
      out.push(raw);
    }
  }
  flush();
  return out.join(" ");
}

interface LineForms {
  norm: string;
  comp: string;
  /** ban da doi so chu thanh chu so */
  num: string;
  numComp: string;
}

function formsOf(text: string): LineForms {
  const num = spellNumbersToDigits(text);
  return {
    norm: normalizeAnswer(text),
    comp: compress(text),
    num,
    numComp: compress(num),
  };
}

/** Dap an ngan va toan chu so thi phai khop tron tu, tranh "2" khop trong "2024" */
function digitBoundaryHit(haystack: string, needle: string): boolean {
  if (!/^\d+$/.test(needle)) return false;
  return new RegExp(`(?:^|[^0-9])${needle}(?:[^0-9]|$)`).test(haystack);
}

function lineMatches(line: LineForms, cand: string): boolean {
  const n = normalizeAnswer(cand);
  if (n.length < 1) return false;
  const c = compress(cand);

  if (/^\d+$/.test(c) && c.length <= 2) {
    return digitBoundaryHit(line.num, c) || digitBoundaryHit(line.norm, c);
  }
  if (n.length >= 2 && line.norm.includes(n)) return true;
  if (c.length >= 3 && (line.comp.includes(c) || line.numComp.includes(c))) return true;
  return false;
}

/**
 * Tim dong transcript ung voi dap an cua mot cau hoi.
 * Uu tien khop nguyen van; neu khong duoc thi cham diem theo so tu trung nhau.
 * Chi tim tu `fromLine` tro di vi de nghe luon ra dap an theo thu tu.
 */
function findLine(
  q: Question,
  lines: LineForms[],
  fromLine: number
): number | null {
  const raw = Array.isArray(q.answer) ? q.answer : [q.answer];
  const candidates = raw.map((a) => stripLabel(String(a)));

  // 1. khop nguyen van, ke ca khi so duoc doc bang chu
  for (let i = fromLine; i < lines.length; i++) {
    for (const c of candidates) {
      if (lineMatches(lines[i], c)) return i;
    }
  }

  // 2. cham diem theo tu khoa (dang trac nghiem, noi dac diem)
  const keys = [...new Set(candidates.flatMap(words))];
  if (keys.length === 0) return null;
  let best = -1;
  let bestScore = 0;
  for (let i = fromLine; i < lines.length; i++) {
    let score = 0;
    for (const k of keys) if (lines[i].norm.includes(k)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  // can it nhat mot nua so tu khoa, va toi thieu 2 tu, de tranh khop bua
  if (best >= 0 && bestScore >= Math.max(2, Math.ceil(keys.length / 2))) return best;
  return null;
}

/** Khoang lang chen giua hai luot noi, khop voi GAP_SECONDS trong scripts/generate_audio.py */
export const GAP_SECONDS = 0.55;

/**
 * Uoc luong moc thoi gian cua tung dong khi chua co file timings that.
 * Gia dinh toc do noi deu nen thoi luong moi dong ti le voi so ky tu, nhung
 * phai tru khoang lang giua cac luot noi ra truoc, neu khong cac dong cuoi
 * bai se bi lech dan ve sau.
 */
export function estimateTimings(
  section: ListeningSection,
  duration: number,
  gap: number = GAP_SECONDS
): LineTiming[] {
  const lens = section.transcript.map((l) => Math.max(1, l.text.length));
  const total = lens.reduce((a, b) => a + b, 0);
  const gapTotal = Math.max(0, lens.length - 1) * gap;
  // neu khoang lang chiem qua nua thoi luong thi coi nhu khong co
  const speech = gapTotal < duration * 0.5 ? duration - gapTotal : duration;

  const out: LineTiming[] = [];
  let t = 0;
  lens.forEach((len, i) => {
    const d = (len / total) * speech;
    out.push({ start: t, end: t + d });
    t += d;
    if (i < lens.length - 1) t += gap;
  });
  return out;
}

/** Khoang nghe lai toi thieu, de khong bi cut ngang */
const MIN_CLIP = 4;
const PAD_BEFORE = 1.2;
const PAD_AFTER = 0.8;
/** Moc uoc luong kem chinh xac hon nen phai nghe rong ra hai dau */
const EST_MIN_CLIP = 7;
const EST_PAD_BEFORE = 2.5;
const EST_PAD_AFTER = 2;

/**
 * Dung bang tra: moi cau hoi -> doan audio chua dap an.
 * Cau nao khong do duoc se noi suy tu hai cau lan can.
 */
export function buildCueMap(
  section: ListeningSection,
  timings: LineTiming[],
  duration: number,
  options: { estimated?: boolean } = {}
): Record<number, Cue> {
  const padBefore = options.estimated ? EST_PAD_BEFORE : PAD_BEFORE;
  const padAfter = options.estimated ? EST_PAD_AFTER : PAD_AFTER;
  const minClip = options.estimated ? EST_MIN_CLIP : MIN_CLIP;
  const lines = section.transcript.map((l) => formsOf(l.text));
  const questions = section.groups.flatMap((g) => g.questions);

  // buoc 1: do tung cau, tien dan theo thu tu
  const found: (number | null)[] = [];
  let cursor = 0;
  for (const q of questions) {
    const idx = findLine(q, lines, cursor);
    found.push(idx);
    if (idx !== null) cursor = idx;
  }

  // buoc 2: noi suy cho nhung cau khong do duoc
  for (let i = 0; i < found.length; i++) {
    if (found[i] !== null) continue;
    let prev = i - 1;
    while (prev >= 0 && found[prev] === null) prev--;
    let next = i + 1;
    while (next < found.length && found[next] === null) next++;
    const a = prev >= 0 ? (found[prev] as number) : 0;
    const b = next < found.length ? (found[next] as number) : lines.length - 1;
    const span = next - prev;
    found[i] = span > 0 ? Math.round(a + ((b - a) * (i - prev)) / span) : a;
  }

  const map: Record<number, Cue> = {};
  questions.forEach((q, i) => {
    const lineIdx = Math.max(0, Math.min(lines.length - 1, found[i] as number));
    const t = timings[lineIdx];
    if (!t) return;
    let start = Math.max(0, t.start - padBefore);
    let end = Math.min(duration, t.end + padAfter);
    if (end - start < minClip) {
      const mid = (start + end) / 2;
      start = Math.max(0, mid - minClip / 2);
      end = Math.min(duration, start + minClip);
    }
    map[q.id] = { lineIdx, start, end, approximate: found[i] === null };
  });
  return map;
}
