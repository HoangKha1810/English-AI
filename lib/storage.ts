"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";
import { isAbortError } from "./errors";
import type { Attempt, FullAttempt, Skill, UserProfile } from "./types";
import { dayKey } from "./utils";

const LOCAL_ATTEMPTS = "ielts:attempts";
const LOCAL_FULL_ATTEMPTS = "ielts:full-attempts";
const LOCAL_PROFILE = "ielts:profile";
const ATTEMPT_CHANGE_EVENT = "ielts:attempt-change";

/* ------------------------- local fallback ------------------------- */

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* het dung luong hoac trinh duyet chan - bo qua */
  }
}

function notifyAttemptChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ATTEMPT_CHANGE_EVENT));
}

function localAttempts(): Attempt[] {
  return readLocal<Attempt[]>(LOCAL_ATTEMPTS, []).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

function cacheLocalAttempt(attempt: Attempt): void {
  const all = localAttempts().filter((item) => item.id !== attempt.id);
  writeLocal(LOCAL_ATTEMPTS, [attempt, ...all].slice(0, 200));
}

function saveLocalAttempt(attempt: Attempt): string {
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  cacheLocalAttempt({ ...attempt, id });
  notifyAttemptChange();
  return id;
}

function mergeAttempts(remote: Attempt[], local: Attempt[], max: number): Attempt[] {
  const merged = new Map<string, Attempt>();
  for (const attempt of [...remote, ...local]) {
    const key = attempt.id ?? `${attempt.uid}:${attempt.testId}:${attempt.createdAt}`;
    if (!merged.has(key)) merged.set(key, attempt);
  }
  return [...merged.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, max);
}

/* ---------------------------- attempts ---------------------------- */

export async function saveAttempt(attempt: Attempt): Promise<string> {
  const db = getDb();
  if (db && isFirebaseConfigured && attempt.uid !== "local") {
    try {
      const ref = await addDoc(collection(db, "attempts"), attempt);
      // Keep a local cache too, so the Home page updates immediately and
      // the result remains visible if Firestore is temporarily unavailable.
      cacheLocalAttempt({ ...attempt, id: ref.id });
      notifyAttemptChange();
      return ref.id;
    } catch (err) {
      if (!isAbortError(err)) {
        console.warn("[IELTS Lab] Không ghi được điểm lên Firestore, dùng bản lưu trình duyệt.", err);
      }
      return saveLocalAttempt(attempt);
    }
  }
  return saveLocalAttempt(attempt);
}

export async function getAttempts(
  uid: string | null,
  options: { skill?: Skill; max?: number } = {}
): Promise<Attempt[]> {
  const { skill, max = 100 } = options;
  const db = getDb();

  if (db && isFirebaseConfigured && uid && uid !== "local") {
    try {
      const clauses = [where("uid", "==", uid)];
      if (skill) clauses.push(where("skill", "==", skill));

      const snap = await getDocs(query(collection(db, "attempts"), ...clauses));
      const remote = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Attempt) }));
      const local = localAttempts().filter(
        (attempt) => attempt.uid === uid || attempt.uid === "local"
      );
      return mergeAttempts(remote, local, max).filter((attempt) =>
        skill ? attempt.skill === skill : true
      );
    } catch (err) {
      if (!isAbortError(err)) {
        console.warn("[IELTS Lab] Không tải được lịch sử điểm từ Firestore, dùng bản lưu trình duyệt.", err);
      }
    }
  }

  let all = localAttempts();
  if (skill) all = all.filter((a) => a.skill === skill);
  return all.slice(0, max);
}

export async function getAttemptById(
  uid: string | null,
  id: string
): Promise<Attempt | null> {
  const db = getDb();
  if (db && isFirebaseConfigured && uid && uid !== "local" && !id.startsWith("local-")) {
    const snap = await getDoc(doc(db, "attempts", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Attempt) };
  }
  const all = readLocal<Attempt[]>(LOCAL_ATTEMPTS, []);
  return all.find((a) => a.id === id) ?? null;
}

export async function saveFullAttempt(attempt: FullAttempt): Promise<string> {
  const db = getDb();
  if (db && isFirebaseConfigured && attempt.uid !== "local") {
    try {
      const ref = await addDoc(collection(db, "fullAttempts"), attempt);
      return ref.id;
    } catch (err) {
      if (!isAbortError(err)) {
        console.warn("[IELTS Lab] Không ghi được đề full lên Firestore, dùng bản lưu trình duyệt.", err);
      }
    }
  }
  const all = readLocal<FullAttempt[]>(LOCAL_FULL_ATTEMPTS, []);
  const id = `local-full-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  all.unshift({ ...attempt, id });
  writeLocal(LOCAL_FULL_ATTEMPTS, all.slice(0, 100));
  notifyAttemptChange();
  return id;
}

export async function getFullAttempts(uid: string | null, max = 50): Promise<FullAttempt[]> {
  const db = getDb();
  if (db && isFirebaseConfigured && uid && uid !== "local") {
    try {
      const snap = await getDocs(
        query(collection(db, "fullAttempts"), where("uid", "==", uid))
      );
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as FullAttempt) }))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, max);
    } catch (err) {
      if (!isAbortError(err)) {
        console.warn("[IELTS Lab] Không tải được lịch sử đề full, dùng bản lưu trình duyệt.", err);
      }
    }
  }
  return readLocal<FullAttempt[]>(LOCAL_FULL_ATTEMPTS, [])
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, max);
}

/* ---------------------------- profile ----------------------------- */

export async function getProfile(uid: string | null): Promise<UserProfile | null> {
  const db = getDb();
  if (db && isFirebaseConfigured && uid && uid !== "local") {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }
  return readLocal<UserProfile | null>(LOCAL_PROFILE, null);
}

export async function upsertProfile(profile: UserProfile): Promise<void> {
  const db = getDb();
  if (db && isFirebaseConfigured && profile.uid !== "local") {
    await setDoc(doc(db, "users", profile.uid), profile, { merge: true });
    return;
  }
  writeLocal(LOCAL_PROFILE, profile);
}

/** Cap nhat chuoi ngay hoc lien tiep */
export function nextStreak(profile: UserProfile | null): {
  streak: number;
  lastActiveDay: string;
} {
  const today = dayKey();
  if (!profile || !profile.lastActiveDay) return { streak: 1, lastActiveDay: today };
  if (profile.lastActiveDay === today) {
    return { streak: profile.streak || 1, lastActiveDay: today };
  }
  const yesterday = dayKey(Date.now() - 86_400_000);
  const streak = profile.lastActiveDay === yesterday ? (profile.streak || 0) + 1 : 1;
  return { streak, lastActiveDay: today };
}
