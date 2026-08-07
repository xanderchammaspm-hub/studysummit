import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, RefreshCw, CalendarCheck, Trash2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { weeklyReport } from "@/lib/ai.functions";
import { useStudyLogs, useSummitStats } from "@/hooks/useSummitStats";

const KEY = "summit-weekly-report-v1";

/** Monday-anchored ISO-ish week id, e.g. 2026-W32. */
function weekId(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - start.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

type Cached = { week: string; text: string; at: number };

/** Sunday AI report on the week's study, auto-generated once each week. */
export function WeeklyReport() {
  const run = useServerFn(weeklyReport);
  const logs = useStudyLogs();
  const stats = useSummitStats();
  const [cached, setCached] = useState<Cached | null>(null);
  const [busy, setBusy] = useState(false);
  const week = weekId();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCached(JSON.parse(raw) as Cached);
    } catch {
      /* ignore */
    }
  }, []);

  const summary = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const inWeek = logs.filter((l) => l.date >= iso(start) && l.date <= iso(now));
    const hours = inWeek.reduce((s, l) => s + l.hours, 0);
    const days = new Set(inWeek.map((l) => l.date)).size;
    const bySubject = stats.perSubject
      .filter((s) => s.topics > 0 || s.hours > 0)
      .map((s) => `${s.label}: ${s.hours.toFixed(1)}h, ${s.green}/${s.topics} topics green`)
      .join("\n");
    return [
      `Hours this week: ${hours.toFixed(1)}`,
      `Days studied this week: ${days}/7`,
      `Total hours all time: ${stats.totalHours.toFixed(1)}`,
      `Topics green/yellow/red: ${stats.green}/${stats.amber}/${stats.red}`,
      `Practice papers completed: ${stats.papersDone}`,
      `Average exam score: ${Math.round(stats.avgScore)}%`,
      `Syllabus dot points ticked: ${stats.syllabusDone}`,
      "",
      "Per subject:",
      bySubject || "no subject data yet",
    ].join("\n");
  }, [logs, stats]);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await run({ data: { weekLabel: week, summary } });
      const next: Cached = { week, text: res.text, at: Date.now() };
      setCached(next);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build the report");
    } finally {
      setBusy(false);
    }
  };

  // Auto-generate on Sundays, once per week.
  useEffect(() => {
    if (busy) return;
    if (new Date().getDay() !== 0) return;
    if (cached?.week === week) return;
    if (cached === null && !localStorageChecked()) return;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cached, week]);

  const stale = cached && cached.week !== week;

  if (hidden) {
    return (
      <section className="mx-auto mt-10 max-w-6xl px-6">
        <button
          onClick={() => setHidden(false)}
          className="glass-panel flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <CalendarCheck className="h-3.5 w-3.5 text-primary" />
          Show AI Weekly Report
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-10 max-w-6xl px-6">
      <div className="report-gloss relative overflow-hidden rounded-2xl p-[1px]">
        <div className="relative rounded-[calc(1rem-1px)] bg-[oklch(0.19_0.035_288_/_0.72)] p-6 backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,oklch(0.7_0.22_302_/_0.22),transparent_65%)] blur-2xl" />

          <div className="relative flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-gradient-to-br from-primary/30 to-yellow/10 text-primary shadow-[0_0_24px_-8px_var(--color-primary)]">
              <CalendarCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold gradient-text">AI Weekly Report</h2>
              <p className="text-xs text-muted-foreground">
                {cached
                  ? `${stale ? "Last report" : "This week"} · ${cached.week}`
                  : "Builds itself every Sunday — or generate one now."}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={generate}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-primary/25 disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {cached ? "Refresh" : "Generate"}
              </button>
              {cached && (
                <button
                  onClick={removeReport}
                  title="Delete this report"
                  aria-label="Delete this report"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setHidden(true)}
                title="Hide the weekly report"
                aria-label="Hide the weekly report"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { k: "Hours", v: `${weekStats.hours.toFixed(1)}h` },
              { k: "Days", v: `${weekStats.days}/7` },
              { k: "Green topics", v: `${stats.green}` },
              { k: "Avg score", v: `${Math.round(stats.avgScore)}%` },
            ].map((p) => (
              <div
                key={p.k}
                className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent px-3 py-2"
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.k}</div>
                <div className="text-base font-semibold">{p.v}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-4">
            {busy && !cached && (
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-surface/60" style={{ width: `${90 - i * 12}%` }} />
                ))}
              </div>
            )}
            {cached ? (
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-table:text-xs">
                <ReactMarkdown>{cached.text}</ReactMarkdown>
              </div>
            ) : (
              !busy && (
                <p className="text-sm text-muted-foreground">
                  Every Sunday Atlas reviews your hours, topic colours and paper scores, then
                  gives you three specific moves for the week ahead.
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


function localStorageChecked() {
  try {
    return localStorage.getItem(KEY) === null;
  } catch {
    return false;
  }
}

export default WeeklyReport;
