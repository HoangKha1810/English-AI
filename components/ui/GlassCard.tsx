import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  strong?: boolean;
  hover?: boolean;
  as?: ElementType;
  glowColor?: string;
}

export function GlassCard({
  children,
  className,
  strong,
  hover,
  as,
  glowColor,
  ...rest
}: GlassCardProps) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn(
        "relative rounded-2xl",
        strong ? "glass-strong" : "glass",
        hover && "glass-hover",
        className
      )}
      {...rest}
    >
      {glowColor && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(420px circle at 50% 0%, ${glowColor}22, transparent 70%)`,
          }}
        />
      )}
      {children}
    </Tag>
  );
}
