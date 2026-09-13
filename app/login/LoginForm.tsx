"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Info,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { friendlyAuthError, useAuth } from "@/lib/auth-context";

const PERKS = [
  "Lưu lại toàn bộ bài đã làm và band score",
  "Biểu đồ tiến bộ theo từng kỹ năng",
  "Chuỗi ngày học liên tiếp để giữ động lực",
  "Đồng bộ giữa máy tính và điện thoại",
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, configured, signInGoogle, signInEmail, signUpEmail, resetPassword } =
    useAuth();

  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | "reset" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleGoogle = async () => {
    setError("");
    setNotice("");
    setBusy("google");
    try {
      await signInGoogle();
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy("email");
    try {
      if (mode === "signup") {
        await signUpEmail(name.trim(), email.trim(), password);
      } else {
        await signInEmail(email.trim(), password);
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Nhập email của bạn trước đã.");
      return;
    }
    setError("");
    setBusy("reset");
    try {
      await resetPassword(email.trim());
      setNotice("Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư của bạn nhé.");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-20">
      {/* Brand panel */}
      <div className="animate-fade-up hidden lg:block">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/12 px-3 py-1.5 text-xs font-medium text-violet-700">
          <Sparkles className="size-3.5" />
          Miễn phí toàn bộ
        </span>
        <h1 className="font-display mt-6 text-4xl leading-tight font-semibold tracking-tight">
          Một tài khoản,
          <br />
          <span className="gradient-text">toàn bộ hành trình IELTS</span>
        </h1>
        <ul className="mt-8 space-y-3.5">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-ink-700">
              <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <span className="text-[0.95rem]">{p}</span>
            </li>
          ))}
        </ul>
        <div className="glass mt-10 rounded-2xl p-4">
          <p className="text-sm leading-relaxed text-ink-500">
            Chưa muốn đăng ký? Bạn vẫn có thể{" "}
            <Link href="/reading" className="text-violet-600 hover:underline">
              làm thử một đề
            </Link>{" "}
            — kết quả sẽ được lưu tạm trong trình duyệt.
          </p>
        </div>
      </div>

      {/* Form */}
      <GlassCard strong className="animate-fade-up p-7 sm:p-9">
        <h2 className="font-display text-2xl font-semibold text-ink-900">
          {mode === "signup" ? "Tạo tài khoản" : "Chào mừng trở lại"}
        </h2>
        <p className="mt-1.5 text-sm text-ink-500">
          {mode === "signup"
            ? "Chỉ mất 10 giây, không cần thẻ tín dụng."
            : "Đăng nhập để xem tiến độ của bạn."}
        </p>

        {!configured && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3.5">
            <Info className="mt-0.5 size-4.5 shrink-0 text-amber-700" />
            <p className="text-[0.82rem] leading-relaxed text-amber-800">
              Chưa cấu hình Firebase. Sao chép <code>.env.local.example</code> thành{" "}
              <code>.env.local</code>, điền khoá từ Firebase Console rồi chạy lại
              <code> npm run dev</code>. Trong lúc đó bạn vẫn làm bài được, kết quả lưu tạm
              trong trình duyệt.
            </p>
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={busy !== null}
          className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-rose-300/60 bg-white/70 font-medium text-ink-900 transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
            />
          </svg>
          {busy === "google" ? "Đang mở Google..." : "Tiếp tục với Google"}
        </button>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-white/85" />
          <span className="text-xs text-ink-450">hoặc dùng email</span>
          <span className="h-px flex-1 bg-white/85" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          {mode === "signup" && (
            <Field icon={UserIcon} label="Họ và tên">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="h-12 w-full pr-4 pl-11"
                autoComplete="name"
              />
            </Field>
          )}

          <Field icon={Mail} label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@email.com"
              className="h-12 w-full pr-4 pl-11"
              autoComplete="email"
            />
          </Field>

          <Field icon={Lock} label="Mật khẩu">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="h-12 w-full pr-4 pl-11"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-700" />
              <p className="text-[0.82rem] text-rose-800">{error}</p>
            </div>
          )}
          {notice && (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-[0.82rem] text-emerald-800">
              {notice}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={busy === "email"}
          >
            {mode === "signup" ? "Tạo tài khoản" : "Đăng nhập"}
            <ArrowRight className="size-4.5" />
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setNotice("");
            }}
            className="text-ink-500 transition-colors hover:text-violet-600"
          >
            {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
          </button>
          {mode === "login" && (
            <button
              onClick={handleReset}
              disabled={busy !== null}
              className="text-ink-450 transition-colors hover:text-violet-600"
            >
              Quên mật khẩu?
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-500">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-ink-450" />
        {children}
      </span>
    </label>
  );
}
