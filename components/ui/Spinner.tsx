import { cn } from "@/lib/utils";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative size-10">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-400 border-r-sky-400" />
      </div>
      {label && <p className="text-sm text-slate-400">{label}</p>}
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
