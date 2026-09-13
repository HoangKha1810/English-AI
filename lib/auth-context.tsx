"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as fbUpdateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
import { getProfile, upsertProfile } from "./storage";
import type { UserProfile } from "./types";
import { isAbortError } from "./errors";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  /** uid dung cho luu tru; "local" khi chua dang nhap */
  storageId: string;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setTargetBand: (band: number) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const NOT_CONFIGURED =
  "Chưa cấu hình Firebase. Hãy điền các biến NEXT_PUBLIC_FIREBASE_* trong file .env.local rồi khởi động lại server.";

function defaultProfile(u: User | null): UserProfile {
  return {
    uid: u?.uid ?? "local",
    displayName: u?.displayName ?? null,
    email: u?.email ?? null,
    photoURL: u?.photoURL ?? null,
    targetBand: 6.5,
    createdAt: Date.now(),
    streak: 0,
    lastActiveDay: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: User | null) => {
    const fallback = defaultProfile(u);

    try {
      let p = await getProfile(fallback.uid);
      if (!p) {
        p = fallback;
        await upsertProfile(p);
      } else if (u && (p.displayName !== u.displayName || p.photoURL !== u.photoURL)) {
        p = { ...p, displayName: u.displayName, photoURL: u.photoURL, email: u.email };
        await upsertProfile(p);
      }
      setProfile(p);
    } catch (err) {
      if (!isAbortError(err)) {
        console.warn("[IELTS Lab] Không tải được hồ sơ người dùng:", err);
      }
      setProfile(fallback);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const auth = getFirebaseAuth();
    if (!auth) {
      void loadProfile(null).finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!active) return;
      setUser(u);
      void loadProfile(u).finally(() => {
        if (active) setLoading(false);
      });
    });
    return () => {
      active = false;
      unsub();
    };
  }, [loadProfile]);

  const signInGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error(NOT_CONFIGURED);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error(NOT_CONFIGURED);
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error(NOT_CONFIGURED);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await fbUpdateProfile(cred.user, { displayName: name });
    },
    []
  );

  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error(NOT_CONFIGURED);
    await sendPasswordResetEmail(auth, email);
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [loadProfile, user]);

  const setTargetBand = useCallback(
    async (band: number) => {
      if (!profile) return;
      const next = { ...profile, targetBand: band };
      setProfile(next);
      try {
        await upsertProfile(next);
      } catch (err) {
        setProfile(profile);
        if (!isAbortError(err)) {
          console.warn("[IELTS Lab] Không cập nhật được mục tiêu band:", err);
        }
      }
    },
    [profile]
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      storageId: user?.uid ?? "local",
      signInGoogle,
      signInEmail,
      signUpEmail,
      resetPassword,
      logout,
      refreshProfile,
      setTargetBand,
    }),
    [
      user, profile, loading, signInGoogle, signInEmail, signUpEmail,
      resetPassword, logout, refreshProfile, setTargetBand,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return ctx;
}

export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
    "auth/wrong-password": "Mật khẩu không đúng.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/email-already-in-use": "Email này đã được đăng ký.",
    "auth/weak-password": "Mật khẩu phải có ít nhất 6 ký tự.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập.",
    "auth/popup-blocked": "Trình duyệt chặn popup. Hãy cho phép popup rồi thử lại.",
    "auth/too-many-requests": "Thử quá nhiều lần. Vui lòng đợi một lát.",
    "auth/network-request-failed": "Lỗi mạng. Kiểm tra kết nối rồi thử lại.",
    "auth/operation-not-allowed":
      "Phương thức đăng nhập này chưa được bật trong Firebase Console.",
    "auth/unauthorized-domain":
      "Tên miền chưa được thêm vào Authorized domains trong Firebase Console.",
  };
  if (map[code]) return map[code];
  const msg = (err as Error)?.message ?? "";
  return msg || "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
