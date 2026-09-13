import type { Skill } from "./types";

const PROGRESS_KEY = "ielts:resume-progress";

export interface ResumeProgress {
  id: string;
  kind: "skill" | "full";
  testId: string;
  title: string;
  href: string;
  skill?: Skill;
  phase: string;
  completed: number;
  total: number;
  detail?: string;
  updatedAt: number;
}

export function loadResumeProgress(): ResumeProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    const value = raw ? (JSON.parse(raw) as ResumeProgress[]) : [];
    return Array.isArray(value)
      ? value
          .filter((item) => item && typeof item.id === "string")
          .sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  } catch {
    return [];
  }
}

export function saveResumeProgress(progress: ResumeProgress): void {
  if (typeof window === "undefined") return;
  try {
    const next = loadResumeProgress().filter((item) => item.id !== progress.id);
    window.localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify([progress, ...next].slice(0, 30))
    );
    window.dispatchEvent(new CustomEvent("ielts:progress-change"));
  } catch {
    /* localStorage may be disabled or full */
  }
}

export function removeResumeProgress(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = loadResumeProgress().filter((item) => item.id !== id);
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("ielts:progress-change"));
  } catch {
    /* localStorage may be disabled or full */
  }
}

export function readExamDraft<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeExamDraft<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage may be disabled or full */
  }
}

export function clearExamDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* localStorage may be disabled or full */
  }
}
