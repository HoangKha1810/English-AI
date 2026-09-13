"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-white bg-linear-to-r from-violet-600 via-violet-500 to-sky-500 shadow-[0_8px_28px_-6px_rgba(124,58,237,0.65)] hover:shadow-[0_12px_36px_-6px_rgba(124,58,237,0.85)] hover:brightness-110",
  secondary:
    "text-slate-100 bg-white/8 border border-white/12 hover:bg-white/14 hover:border-white/22",
  ghost: "text-slate-300 hover:text-white hover:bg-white/8",
  outline:
    "text-violet-200 border border-violet-400/40 hover:bg-violet-500/12 hover:border-violet-400/70",
  danger:
    "text-white bg-linear-to-r from-rose-600 to-orange-500 shadow-[0_8px_28px_-6px_rgba(225,29,72,0.6)] hover:brightness-110",
  success:
    "text-white bg-linear-to-r from-emerald-600 to-teal-500 shadow-[0_8px_28px_-6px_rgba(5,150,105,0.6)] hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-[0.95rem] rounded-xl gap-2",
  lg: "h-13 px-7 text-base rounded-xl gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none select-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading,
  disabled,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<
    React.ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
