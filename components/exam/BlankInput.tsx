"use client";

import { cn } from "@/lib/utils";

export function BlankInput({
  id,
  value,
  onChange,
  disabled,
  state,
  width = "md",
  label,
}: {
  id: number;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  state?: "correct" | "wrong";
  width?: "sm" | "md" | "lg";
  label?: string;
}) {
  const widths = { sm: "w-20", md: "w-32 sm:w-40", lg: "w-48 sm:w-60" };
  return (
    <span className="relative mx-1 inline-flex items-baseline">
      <span
        className={cn(
          "absolute -top-2 -left-1.5 z-10 grid size-5 place-items-center rounded-full text-[0.62rem] font-semibold tabular-nums",
          state === "correct"
            ? "bg-emerald-500 text-white"
            : state === "wrong"
              ? "bg-rose-500 text-white"
              : "bg-violet-500/90 text-white"
        )}
      >
        {id}
      </span>
      <input
        id={`q-${id}`}
        type="text"
        value={value}
        aria-label={label ?? `Câu ${id}`}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "h-9 rounded-xl pt-1 pr-2 pl-4 text-[0.92rem]",
          widths[width],
          state === "correct" && "border-emerald-400/50! bg-emerald-500/12!",
          state === "wrong" && "border-rose-400/50! bg-rose-500/12!",
          disabled && "opacity-90"
        )}
      />
    </span>
  );
}
