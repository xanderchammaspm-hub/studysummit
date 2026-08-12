import { useCallback, useEffect, useRef, useState } from "react";

export type JobMode = "interactive" | "pdf";
export type JobStage = "queued" | "uploading" | "extracting" | "ready" | "saving" | "done" | "error";

export type ImportJob = {
  id: string;
  file: File;
  mode: JobMode;
  stage: JobStage;
  pct: number;
  startedAt: number;
  error?: string;
  /** Parsed result for interactive jobs, waiting on review. */
  result?: unknown;
};

type Runner = (
  job: ImportJob,
  helpers: { setPct: (n: number) => void; setStage: (s: JobStage) => void },
) => Promise<unknown>;

const CONCURRENCY = 2;

/**
 * Small in-memory job queue so paper imports run in the background while the
 * rest of the Exam Engine stays responsive.
 */
export function useImportQueue(runner: Runner) {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const runningRef = useRef(new Set<string>());
  const runnerRef = useRef(runner);
  runnerRef.current = runner;

  const patch = useCallback((id: string, next: Partial<ImportJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...next } : j)));
  }, []);

  const enqueue = useCallback((file: File, mode: JobMode) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setJobs((prev) => [
      ...prev,
      { id, file, mode, stage: "queued", pct: 0, startedAt: Date.now() },
    ]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const retry = useCallback(
    (id: string) => patch(id, { stage: "queued", pct: 0, error: undefined, startedAt: Date.now() }),
    [patch],
  );

  // Pump the queue whenever slots free up.
  useEffect(() => {
    const next = jobs.filter((j) => j.stage === "queued" && !runningRef.current.has(j.id));
    const free = CONCURRENCY - runningRef.current.size;
    for (const job of next.slice(0, Math.max(0, free))) {
      runningRef.current.add(job.id);
      patch(job.id, { stage: job.mode === "pdf" ? "uploading" : "extracting", pct: 4 });
      void runnerRef.current(job, {
        setPct: (n) => patch(job.id, { pct: Math.min(99, Math.max(0, n)) }),
        setStage: (s) => patch(job.id, { stage: s }),
      })
        .then((result) => {
          runningRef.current.delete(job.id);
          patch(job.id, {
            stage: job.mode === "interactive" ? "ready" : "done",
            pct: 100,
            result,
          });
        })
        .catch((err: unknown) => {
          runningRef.current.delete(job.id);
          patch(job.id, {
            stage: "error",
            error: err instanceof Error ? err.message : "Import failed",
          });
        });
    }
  }, [jobs, patch]);

  return { jobs, enqueue, dismiss, retry, patch };
}
