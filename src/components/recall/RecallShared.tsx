import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* --------------------------- Staged AI loading --------------------------- */

export function LoadingStages({
  stages,
  title = "Atlas is working",
}: {
  stages: string[];
  title?: string;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      setIdx((i) => Math.min(i + 1, stages.length - 1));
    }, 1400);
    return () => window.clearInterval(t);
  }, [stages.length]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 fade-in-up">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-6 w-6 rounded-full bg-primary/25 pulse-glow" />
        </div>
      </div>
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">{title}</p>
        <div className="space-y-1.5">
          {stages.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex items-center justify-center gap-2 text-sm transition-all duration-500",
                i < idx ? "text-muted-foreground/70" : i === idx ? "text-foreground" : "text-muted-foreground/30",
              )}
            >
              {i < idx ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : i === idx ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-border/50" />
              )}
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Two-step delete ---------------------------- */

export function ConfirmDelete({
  onConfirm,
  label,
  className = "",
}: {
  onConfirm: () => void;
  label?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!armed) {
          setArmed(true);
          timer.current = window.setTimeout(() => setArmed(false), 2600);
        } else {
          if (timer.current) window.clearTimeout(timer.current);
          setArmed(false);
          onConfirm();
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all duration-200 cursor-pointer",
        armed
          ? "border-red-400/70 bg-red-500/15 text-red-300"
          : "border-transparent text-muted-foreground/50 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300",
        className,
      )}
      aria-label={armed ? "Confirm delete" : `Delete ${label ?? "item"}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {armed ? "Confirm?" : null}
    </button>
  );
}

/* ------------------------------- Score ring ------------------------------ */

export function ScoreRing({
  value,
  size = 128,
  stroke = 9,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 80 ? "#34d399" : clamped >= 50 ? "var(--yellow)" : "#f87171";

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(0.3 0.05 290 / 0.5)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-2xl font-semibold tracking-tight" style={{ color }}>
            {clamped}%
          </div>
          {label ? <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div> : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Small pieces ----------------------------- */

export function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl purple-outline bg-card/60 px-4 py-3.5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface/30 px-6 py-14 text-center fade-in-up">
      <div className="grid h-14 w-14 place-items-center rounded-2xl purple-outline bg-card/70 text-primary">{icon}</div>
      <div className="text-base font-semibold tracking-tight">{title}</div>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

export function ModeChip({ mode }: { mode: string }) {
  const isRecall = mode === "quick_recall";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        isRecall ? "border-yellow/40 bg-yellow/10 text-yellow" : "border-primary/50 bg-primary/15 text-purple-200",
      )}
    >
      {isRecall ? "⚡ Recall" : "🧠 Blurt"}
    </span>
  );
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-300";
  if (score >= 50) return "text-yellow";
  return "text-red-300";
}

export function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Shared glass modal shell used by the recall dialogs. */
export function GlassModal({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-4 backdrop-blur-md"
      style={{ animation: "overlayIn 220ms ease-out" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full overflow-hidden rounded-3xl purple-outline bg-card/85 shadow-[0_30px_80px_-20px_oklch(0.5_0.22_300_/_0.6)] backdrop-blur-2xl",
          maxWidth,
        )}
        style={{ animation: "popIn 320ms cubic-bezier(0.22,1,0.36,1)" }}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold tracking-tight">{title}</div>
            {subtitle ? <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 cursor-pointer rounded-full border border-border/60 bg-surface/60 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative max-h-[70vh] overflow-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

/** Banner offering to resume an autosaved, unfinished attempt. */
export function ResumeBanner({
  title,
  detail,
  onResume,
  onDiscard,
}: {
  title: string;
  detail: string;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="mx-auto mb-5 max-w-2xl fade-in-up rounded-2xl border border-yellow/40 bg-yellow/8 px-4 py-3.5 backdrop-blur-xl sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-yellow">{title}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onResume}
            className="cursor-pointer rounded-full border border-primary/60 bg-primary/25 px-4 py-1.5 text-xs font-semibold transition-transform hover:scale-[1.03]"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="cursor-pointer rounded-full border border-border/60 bg-surface/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
