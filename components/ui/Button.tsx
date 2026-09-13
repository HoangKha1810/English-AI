"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-white bg-linear-to-r from-pink-600 via-rose-500 to-fuchsia-600 shadow-[0_8px_24px_-6px_rgba(219,39,119,0.55)] hover:shadow-[0_14px_32px_-6px_rgba(219,39,119,0.7)] hover:brightness-105",
  secondary:
    "text-ink-700 bg-white/85 border-[1.5px] border-pink-200 shadow-[0_4px_14px_-6px_rgba(219,39,119,0.3)] hover:bg-white hover:border-pink-300",
  ghost: "text-ink-500 hover:text-ink-900 hover:bg-pink-100/70",
  outline:
    "text-pink-700 border-[1.5px] border-pink-300 bg-white/60 hover:bg-pink-50 hover:border-pink-400",
  danger:
    "text-white bg-linear-to-r from-rose-600 to-pink-600 shadow-[0_8px_24px_-6px_rgba(225,29,72,0.5)] hover:brightness-105",
  success:
    "text-white bg-linear-to-r from-emerald-600 to-teal-600 shadow-[0_8px_24px_-6px_rgba(5,150,105,0.45)] hover:brightness-105",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5.5 text-[0.95rem] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 ease-[cubic-bezier(0.34,1.5,0.64,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-45 disabled:pointer-events-none disabled:hover:translate-y-0 select-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400";

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
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
