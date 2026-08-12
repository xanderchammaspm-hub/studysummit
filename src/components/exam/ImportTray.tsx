import { useEffect, useState } from "react";
import type { ImportJob } from "@/hooks/useImportQueue";
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, RotateCcw, X } from "lucide-react";

const STAGE_LABEL: Record<ImportJob["stage"], string> = {
  queued: "Queued",
  uploading: "Uploading",
  extracting: "Extracting questions",
  ready: "Ready to review",
  saving: "Saving",
  done: "Added to uploads",
  error: "Failed",
};

function useElapsed(from: number, active: boolean) {
  const [now, setNow] = useState(from);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  const s = Math.max(0, Math.floor((now - from) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Floating glass tray showing background paper imports. */
export function ImportTray({
  jobs,
  onReview,
  onDismiss,
  onRetry,
}: {
  jobs: ImportJob[];
  onReview: (job: ImportJob) => void;
  onDismiss: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (jobs.length === 0) return null;

  const active = jobs.filter((j) => j.stage !== "done" && j.stage !== "error").length;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(22rem,calc(100vw-2rem))]">
      <div className="scale-in overflow-hidden rounded-2xl border border-primary/30 bg-card/85 shadow-[0_24px_70px_-30px_var(--primary)] backdrop-blur-2xl">
        <div
          aria-hidden
          className="pointer-events-none h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
        />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left"
        >
          {active > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-yellow" />
          )}
          <span className="text-sm font-medium">
            Imports {active > 0 ? `· ${active} running` : "· all done"}
          </span>
          <ChevronDown
            className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-300 ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
        </button>

        {!collapsed && (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto border-t border-border/70 p-3">
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onReview={onReview}
                onDismiss={onDismiss}
                onRetry={onRetry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobRow({
  job,
  onReview,
  onDismiss,
  onRetry,
}: {
  job: ImportJob;
  onReview: (job: ImportJob) => void;
  onDismiss: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const running = job.stage === "uploading" || job.stage === "extracting" || job.stage === "saving";
  const elapsed = useElapsed(job.startedAt, running);

  return (
    <div className="fade-in-up rounded-xl border border-border bg-surface/60 p-3 transition-colors hover:border-primary/50">
      <div className="flex items-center gap-2">
        <span className="truncate text-xs font-medium">{job.file.name}</span>
        <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {running ? elapsed : ""}
        </span>
        <button
          onClick={() => onDismiss(job.id)}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss import"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
        {job.stage === "error" ? (
          <AlertTriangle className="h-3 w-3 text-destructive" />
        ) : job.stage === "ready" || job.stage === "done" ? (
          <CheckCircle2 className="h-3 w-3 text-yellow" />
        ) : (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        )}
        <span className={job.stage === "error" ? "text-destructive" : ""}>
          {job.error ?? STAGE_LABEL[job.stage]}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-[width] duration-500 ease-out"
          style={{
            width: `${job.stage === "error" ? 100 : job.pct}%`,
            opacity: job.stage === "error" ? 0.35 : 1,
          }}
        />
      </div>

      {job.stage === "ready" && (
        <button
          onClick={() => onReview(job)}
          className="mt-2 w-full rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_0_22px_-10px_var(--primary)]"
        >
          Review questions
        </button>
      )}
      {job.stage === "error" && (
        <button
          onClick={() => onRetry(job.id)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface/70 px-3 py-1.5 text-xs transition-colors hover:border-primary/60"
        >
          <RotateCcw className="h-3 w-3" /> Retry
        </button>
      )}
    </div>
  );
}

export default ImportTray;
