import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Flame, Plus, TrendingUp, X } from "lucide-react";
import { useSubjects, type YearKey } from "@/hooks/useSubjectStore";
import { useProfile } from "@/hooks/useProfile";
import { StudyHeatmap } from "@/components/StudyHeatmap";

type StudyLog = {
  id: string;
  date: string; // yyyy-mm-dd
  hours: number;
  subjectId?: string;
  note?: string;
};

const LOGS_KEY = "summit-study-logs-v1";
const YEARS: YearKey[] = ["Year 11", "Year 12"];

function loadLogs(): StudyLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? (JSON.parse(raw) as StudyLog[]) : [];
  } catch {
    return [];
  }
}
function saveLogs(logs: StudyLog[]) {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch {}
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fmtHours(h: number) {
  if (h === 0) return "0h";
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(1)}h`;
}

export function StudyCalendar() {
  const subjects = useSubjects();
  const allSubjects = useMemo(
    () =>
      YEARS.flatMap((y, yi) =>
        subjects[y].map((s, i) => ({
          id: s.id,
          label: s.name.trim() || `Subject ${i + 1}`,
          year: y,
        })),
      ),
    [subjects],
  );

  const [logs, setLogs] = useState<StudyLog[]>(() => loadLogs());
  useEffect(() => saveLogs(logs), [logs]);

  const { awardXp } = useProfile();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [hours, setHours] = useState<string>("1");
  const [subjectId, setSubjectId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const addLog = () => {
    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) return;
    setLogs((prev) => [
      ...prev,
      {
        id: uid(),
        date: selectedDate,
        hours: h,
        subjectId: subjectId || undefined,
        note: note.trim() || undefined,
      },
    ]);
    void awardXp("studyHour", h);
    setHours("1");
    setNote("");
  };
  const removeLog = (id: string) =>
    setLogs((prev) => prev.filter((l) => l.id !== id));

  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) map.set(l.date, (map.get(l.date) ?? 0) + l.hours);
    return map;
  }, [logs]);

  const maxDayHours = useMemo(
    () => Math.max(1, ...Array.from(byDate.values())),
    [byDate],
  );

  const stats = useMemo(() => {
    const total = logs.reduce((s, l) => s + l.hours, 0);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let week = 0;
    let mo = 0;
    for (const l of logs) {
      const d = new Date(l.date + "T00:00:00");
      if (d >= weekStart) week += l.hours;
      if (d >= monthStart) mo += l.hours;
    }
    // streak: consecutive days ending today (or yesterday) with any hours
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!byDate.get(todayISO(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (byDate.get(todayISO(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    const days = byDate.size || 1;
    const avg = total / days;
    // per subject totals
    const bySubject = new Map<string, number>();
    for (const l of logs) {
      const key = l.subjectId ?? "__none";
      bySubject.set(key, (bySubject.get(key) ?? 0) + l.hours);
    }
    const topSubjects = Array.from(bySubject.entries())
      .map(([id, h]) => {
        if (id === "__none")
          return { id, label: "Unassigned", year: "", hours: h };
        const s = allSubjects.find((x) => x.id === id);
        return {
          id,
          label: s?.label ?? "Deleted subject",
          year: s?.year ?? "",
          hours: h,
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 4);
    return { total, week, mo, streak, avg, topSubjects };
  }, [logs, byDate, allSubjects]);

  // Build month grid
  const grid = useMemo(() => {
    const first = new Date(month.y, month.m, 1);
    const startDay = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      cells.push(todayISO(new Date(month.y, month.m, d)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );
  const today = todayISO();
  const dayLogs = logs.filter((l) => l.date === selectedDate);
  const daySubjectLabel = (id?: string) =>
    id ? allSubjects.find((s) => s.id === id)?.label ?? "Deleted subject" : "General";

  const maxTop = Math.max(1, ...stats.topSubjects.map((s) => s.hours));

  return (
    <div className="mx-auto max-w-5xl px-6 mb-8 fade-in-up">
      <div className="glass-panel p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px shimmer-line" />
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Study Calendar
          </h3>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
            Local · saved on this device
          </span>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <StatTile
            icon={<Clock className="h-3.5 w-3.5" />}
            label="This week"
            value={fmtHours(stats.week)}
          />
          <StatTile
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="This month"
            value={fmtHours(stats.mo)}
          />
          <StatTile
            icon={<Flame className="h-3.5 w-3.5" />}
            label="Streak"
            value={`${stats.streak}d`}
          />
          <StatTile
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label="All-time avg / day"
            value={fmtHours(stats.avg)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Calendar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() =>
                  setMonth(({ y, m }) =>
                    m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 },
                  )
                }
                className="p-1.5 rounded-md border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-primary"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-semibold tracking-wide text-foreground">
                {monthLabel}
              </div>
              <button
                onClick={() =>
                  setMonth(({ y, m }) =>
                    m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 },
                  )
                }
                className="p-1.5 rounded-md border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-primary"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="text-center py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((iso, idx) => {
                if (!iso)
                  return <div key={idx} className="aspect-square" />;
                const h = byDate.get(iso) ?? 0;
                const intensity = h === 0 ? 0 : 0.15 + (h / maxDayHours) * 0.75;
                const isToday = iso === today;
                const isSelected = iso === selectedDate;
                const day = Number(iso.slice(-2));
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    className={`aspect-square rounded-md text-[11px] flex flex-col items-center justify-center relative transition-all ${
                      isSelected
                        ? "border-2 border-primary"
                        : isToday
                          ? "border border-yellow/70"
                          : "border border-border/40 hover:border-primary/50"
                    }`}
                    style={{
                      background:
                        h > 0
                          ? `color-mix(in oklab, var(--color-primary) ${intensity * 100}%, transparent)`
                          : "var(--color-surface)",
                      boxShadow:
                        h > 0
                          ? `0 0 ${6 + intensity * 12}px color-mix(in oklab, var(--color-primary) ${intensity * 60}%, transparent)`
                          : "none",
                    }}
                    title={h > 0 ? `${fmtHours(h)} on ${iso}` : iso}
                  >
                    <span
                      className={
                        h > 0 ? "text-foreground font-semibold" : "text-muted-foreground"
                      }
                    >
                      {day}
                    </span>
                    {h > 0 && (
                      <span className="text-[9px] text-foreground/80 tabular-nums">
                        {fmtHours(h)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Log panel */}
          <div className="space-y-4">
            <div className="interactive-glass rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Log study time
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full mb-2 rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Hours"
                  className="w-24 rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background/60 px-2 py-1.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">General</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} · {s.year}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLog()}
                placeholder="Note (optional)"
                className="w-full mb-2 rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={addLog}
                className="w-full flex items-center justify-center gap-1 rounded-md border border-primary/60 bg-primary/20 px-3 py-1.5 text-sm text-foreground hover:bg-primary/30"
              >
                <Plus className="h-4 w-4" /> Add session
              </button>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                {selectedDate === today ? "Today" : selectedDate} ·{" "}
                {fmtHours(byDate.get(selectedDate) ?? 0)}
              </div>
              {dayLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">
                  No sessions yet on this day.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {dayLogs.map((l) => (
                    <li
                      key={l.id}
                      className="interactive-glass flex items-center gap-2 rounded-md px-3 py-2 text-sm"
                    >
                      <span className="tabular-nums font-semibold text-primary min-w-[3ch]">
                        {fmtHours(l.hours)}
                      </span>
                      <span className="flex-1 min-w-0 truncate">
                        <span className="text-foreground">
                          {daySubjectLabel(l.subjectId)}
                        </span>
                        {l.note && (
                          <span className="text-muted-foreground">
                            {" — "}
                            {l.note}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => removeLog(l.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove session"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Per-subject breakdown */}
        {stats.topSubjects.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Top subjects
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {fmtHours(stats.total)} total
              </div>
            </div>
            <div className="space-y-1.5">
              {stats.topSubjects.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-xs">
                  <span className="w-32 truncate text-foreground">{s.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface border border-border/60 overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-500"
                      style={{
                        width: `${(s.hours / maxTop) * 100}%`,
                        background:
                          "linear-gradient(90deg, var(--color-primary), oklch(0.82 0.17 85))",
                        boxShadow:
                          "0 0 8px color-mix(in oklab, var(--color-primary) 40%, transparent)",
                      }}
                    />
                  </div>
                  <span className="tabular-nums font-semibold text-foreground w-14 text-right">
                    {fmtHours(s.hours)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <StudyHeatmap
        logs={logs}
        subjectLabel={(id) =>
          id ? (allSubjects.find((s) => s.id === id)?.label ?? "Unassigned") : "Unassigned"
        }
      />
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-primary/80">
        {icon}
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-0.5 text-xl font-semibold tracking-tight gradient-text">
        {value}
      </div>
    </div>
  );
}
