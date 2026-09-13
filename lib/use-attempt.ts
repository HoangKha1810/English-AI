"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-context";
import { nextStreak, saveAttempt, upsertProfile } from "./storage";
import type { Attempt } from "./types";

/** Luu ket qua mot lan lam bai, dong thoi cap nhat chuoi ngay hoc */
export function useSaveAttempt() {
  const { storageId, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (data: Omit<Attempt, "uid" | "createdAt">) => {
      setSaving(true);
      try {
        const attempt: Attempt = {
          ...data,
          uid: storageId,
          createdAt: Date.now(),
        };
        const id = await saveAttempt(attempt);
        const { streak, lastActiveDay } = nextStreak(profile);
        if (profile) {
          await upsertProfile({ ...profile, streak, lastActiveDay });
          await refreshProfile();
        }
        return id;
      } catch (err) {
        console.error("Không lưu được kết quả:", err);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [storageId, profile, refreshProfile]
  );

  return { save, saving };
}

/** Tu dong luu bai dang lam vao localStorage de khong mat khi tai lai trang */
export function useDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadedKey(null);
    try {
      const raw = window.localStorage.getItem(key);
      if (raw && active) setValue(JSON.parse(raw) as T);
    } catch {
      /* bo qua */
    }
    if (active) setLoadedKey(key);
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (loadedKey !== key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* bo qua */
    }
  }, [key, loadedKey, value]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* bo qua */
    }
  }, [key]);

  return [value, setValue, clear] as const;
}
