import { cn } from "@/lib/utils";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative size-10">
        <div className="absolute inset-0 rounded-full border-2 border-rose-200/80" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-pink-500 border-r-violet-400" />
      </div>
      {label && <p className="text-sm text-ink-500">{label}</p>}
    </div>
  );
}

export function PageLoader({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner label={label} />
    </div>
  );
}
