export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  if (m === 0) return `${s} giây`;
  return `${m} phút ${s > 0 ? `${s} giây` : ""}`.trim();
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
}

/** So sanh dap an tu luan: bo qua hoa/thuong, dau cau, mao tu thua, khoang trang */
export function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[‘’“”]/g, "'")
    .replace(/[.,;:!?"'()\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function answersMatch(
  userAnswer: string | undefined,
  correct: string | string[]
): boolean {
  if (!userAnswer) return false;
  const u = normalizeAnswer(userAnswer);
  if (!u) return false;
  const accepted = Array.isArray(correct) ? correct : [correct];
  return accepted.some((c) => {
    const n = normalizeAnswer(c);
    if (n === u) return true;
    // chap nhan thieu/thua mao tu dau cau
    const strip = (x: string) => x.replace(/^(a|an|the)\s+/, "");
    return strip(n) === strip(u);
  });
}
