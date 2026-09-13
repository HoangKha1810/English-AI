"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpenCheck,
  ClipboardCheck,
  ChevronDown,
  Flame,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  PenLine,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ui/Button";

const NAV = [
  { href: "/ielts", label: "Đề IELTS", icon: ClipboardCheck },
  { href: "/listening", label: "Listening", icon: Headphones },
  { href: "/reading", label: "Reading", icon: BookOpenCheck },
  { href: "/writing", label: "Writing", icon: PenLine },
  { href: "/speaking", label: "Speaking", icon: Mic },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial =
    profile?.displayName?.trim()?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "?";

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-rose-200/70 bg-white/78 backdrop-blur-xl"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center rounded-2xl bg-linear-to-br from-pink-400 to-fuchsia-500 shadow-[0_5px_18px_-4px_rgba(219,39,119,0.75)] transition-transform group-hover:scale-110 group-hover:rotate-6">
            <Sparkles className="size-4.5 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display text-[1.05rem] font-semibold tracking-tight">
            <span className="text-ink-900">IELTS</span>
            <span className="gradient-text">Lab</span>
          </span>
        </Link>

        <div className="mx-auto hidden items-center gap-1 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/85 text-ink-900"
                    : "text-ink-500 hover:bg-white/65 hover:text-ink-900"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {!loading && !user && (
            <>
              <span className="hidden items-center gap-2 sm:flex">
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Đăng nhập
                </ButtonLink>
                <ButtonLink href="/login?mode=signup" size="sm">
                  Bắt đầu miễn phí
                </ButtonLink>
              </span>
              <span className="sm:hidden">
                <ButtonLink href="/login" size="sm">
                  Đăng nhập
                </ButtonLink>
              </span>
            </>
          )}

          {!loading && user && (
            <>
              {(profile?.streak ?? 0) > 0 && (
                <span className="hidden items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-700 sm:inline-flex">
                  <Flame className="size-3.5" />
                  {profile?.streak} ngày
                </span>
              )}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/65 py-1 pr-2 pl-1 transition-colors hover:bg-white/85"
                >
                  {profile?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.photoURL}
                      alt=""
                      className="size-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="grid size-7 place-items-center rounded-full bg-linear-to-br from-pink-400 to-fuchsia-500 text-xs font-semibold text-white">
                      {initial}
                    </span>
                  )}
                  <ChevronDown className="size-3.5 text-ink-500" />
                </button>

                {menuOpen && (
                  <div className="glass-strong animate-pop absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl p-1.5">
                    <div className="border-b border-rose-200/70 px-3 py-2.5">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {profile?.displayName ?? "Học viên"}
                      </p>
                      <p className="truncate text-xs text-ink-500">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-white/75 hover:text-ink-900"
                    >
                      <LayoutDashboard className="size-4" />
                      Tiến độ của tôi
                    </Link>
                    <button
                      onClick={() => void logout()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-500/12"
                    >
                      <LogOut className="size-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-xl text-ink-700 hover:bg-white/75 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass-strong animate-fade-up mx-4 mb-3 rounded-2xl p-2 md:hidden">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-ink-700 hover:bg-white/75 hover:text-ink-900"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-ink-700 hover:bg-white/75 hover:text-ink-900"
          >
            <LayoutDashboard className="size-4" />
            Tiến độ của tôi
          </Link>
        </div>
      )}
    </nav>
  );
}
