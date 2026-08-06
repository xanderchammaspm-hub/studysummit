import { useEffect, useMemo, useState } from "react";
import { Flame, Palette } from "lucide-react";

export type HeatLog = {
  id: string;
  date: string;
  hours: number;
  subjectId?: string;
  note?: string;
};

export type HeatTheme = {
  id: string;
  label: string;
  /** 4 ramp colours, low → high */
  ramp: [string, string, string, string];
};

export const HEAT_THEMES: HeatTheme[] = [
  {
    id: "midnight",
    label: "Midnight Purple",
    ramp: ["oklch(0.34 0.09 300)", "oklch(0.46 0.15 300)", "oklch(0.6 0.2 300)", "oklch(0.76 0.22 300)"],
  },
  {
    id: "lime",
    label: "Lime",
    ramp: ["oklch(0.36 0.08 145)", "oklch(0.5 0.14 145)", "oklch(0.66 0.19 142)", "oklch(0.84 0.22 140)"],
  },
  {
    id: "ember",
    label: "Ember",
    ramp: ["oklch(0.36 0.09 40)", "oklch(0.5 0.15 40)", "oklch(0.66 0.19 45)", "oklch(0.82 0.19 60)"],
  },
  {
    id: "ice",
    label: "Ice",
    ramp: ["oklch(0.38 0.07 230)", "oklch(0.52 0.12 230)", "oklch(0.68 0.15 225)", "oklch(0.86 0.14 220)"],
  },
  {
    id: "gold",
    label: "Gold",
    ramp: ["oklch(0.38 0.07 85)", "oklch(0.54 0.12 85)", "oklch(0.72 0.16 85)", "oklch(0.9 0.17 88)"],
  },
];

const THEME_KEY = "summit-heatmap-theme-v1";

function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtHours(h: number) {
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Props = {
  logs: HeatLog[];
  subjectLabel: (id?: string) => string;
};

/** GitHub-style contribution grid for logged study hours. */
export function StudyHeatmap({ logs, subjectLabel }: Props) {
  const [themeId, setThemeId] = useState("midnight");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) setThemeId(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const theme = HEAT_THEMES.find((t) => t.id === themeId) ?? HEAT_THEMES[0]!;

  const pickTheme = (id: string) => {
    setThemeId(id);
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const byDate = useMemo(() => {
    const map = new Map<string, { hours: number; subjects: Map<string, number> }>();
    for (const l of logs) {
      const entry = map.get(l.date) ?? { hours: 0, subjects: new Map<string, number>() };
      entry.hours += l.hours;
      const key = subjectLabel(l.subjectId);
      entry.subjects.set(key, (entry.subjects.get(key) ?? 0) + l.hours);
      map.set(l.date, entry);
    }
    return map;
  }, [logs, subjectLabel]);

  const { weeks, monthMarks } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // start 52 weeks back, aligned to Monday
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    const shift = (start.getDay() + 6) % 7; // Mon = 0
    start.setDate(start.getDate() - shift);

    const cols: Date[][] = [];
    const marks: { col: number; label: string }[] = [];
    const cursor = new Date(start);
    let lastMonth = -1;
    while (cursor <= today) {
      const col: Date[] = [];
      for (let i = 0; i < 7; i++) {
        col.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      const first = col[0]!;
      if (first.getMonth() !== lastMonth) {
        lastMonth = first.getMonth();
        marks.push({ col: cols.length, label: MONTHS[lastMonth]! });
      }
      cols.push(col);
    }
    return { weeks: cols, monthMarks: marks };
  }, []);

  const max = useMemo(
    () => Math.max(1, ...Array.from(byDate.values()).map((v) => v.hours)),
    [byDate],
  );

  const totals = useMemo(() => {
    const daysStudied = byDate.size;
    let best = 0;
    let bestDate = "";
    for (const [d, v] of byDate) {
      if (v.hours > best) {
        best = v.hours;
        bestDate = d;
      }
    }
    // streak ending today / yesterday
    let streak = 0;
    const c = new Date();
    c.setHours(0, 0, 0, 0);
    if (!byDate.has(iso(c))) c.setDate(c.getDate() - 1);
    while (byDate.has(iso(c))) {
      streak++;
      c.setDate(c.getDate() - 1);
    }
    const total = Array.from(byDate.values()).reduce((s, v) => s + v.hours, 0);
    return { daysStudied, best, bestDate, streak, total };
  }, [byDate]);

  const colorFor = (hours: number) => {
    if (hours <= 0) return "transparent";
    const level = Math.min(3, Math.floor((hours / max) * 3.999));
    return theme.ramp[level]!;
  };

  const todayIso = iso(new Date());
  const hoveredData = hovered ? byDate.get(hovered) : undefined;

  return (
    <div className="mt-6 rounded-2xl border border-border/60 bg-surface/40 p-4 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Study graph
          </div>
          <div className="mt-0.5 text-sm text-foreground">
            {fmtHours(totals.total)} across {totals.daysStudied} day
            {totals.daysStudied === 1 ? "" : "s"} in the last year
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          {HEAT_THEMES.map((t) => (
            <button
              key={t.id}
              title={t.label}
              aria-label={t.label}
              onClick={() => pickTheme(t.id)}
              className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                themeId === t.id ? "border-foreground/80 scale-110" : "border-border/70"
              }`}
              style={{
                background: `linear-gradient(135deg, ${t.ramp[1]}, ${t.ramp[3]})`,
                boxShadow: themeId === t.id ? `0 0 10px ${t.ramp[3]}` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="min-w-max">
          <div className="relative mb-1 h-3 pl-7">
            {monthMarks.map((m) => (
              <span
                key={`${m.label}-${m.col}`}
                className="absolute text-[9px] uppercase tracking-wider text-muted-foreground"
                style={{ left: `${m.col * 14 + 28}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div className="mr-1 flex w-6 flex-col gap-[3px] text-[8px] uppercase text-muted-foreground">
              {["M", "", "W", "", "F", "", "S"].map((d, i) => (
                <span key={i} className="flex h-[11px] items-center">
                  {d}
                </span>
              ))}
            </div>
            {weeks.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((d) => {
                  const key = iso(d);
                  const entry = byDate.get(key);
                  const hours = entry?.hours ?? 0;
                  const future = d > new Date();
                  return (
                    <button
                      key={key}
                      type="button"
                      onMouseEnter={() => setHovered(key)}
                      onMouseLeave={() => setHovered((h) => (h === key ? null : h))}
                      onFocus={() => setHovered(key)}
                      className="h-[11px] w-[11px] rounded-[3px] border transition-all duration-200 hover:scale-[1.35]"
                      style={{
                        background: future ? "transparent" : colorFor(hours),
                        borderColor:
                          key === todayIso
                            ? "color-mix(in oklab, var(--color-primary) 80%, transparent)"
                            : hours > 0
                              ? "transparent"
                              : "color-mix(in oklab, var(--color-border) 70%, transparent)",
                        opacity: future ? 0.25 : 1,
                        boxShadow: hours > 0 ? `0 0 6px ${colorFor(hours)}` : undefined,
                      }}
                      aria-label={`${key}: ${fmtHours(hours)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-[42px] flex-1 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-xs">
          {hovered ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground">
                  {new Date(hovered + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="font-semibold tabular-nums gradient-text">
                  {fmtHours(hoveredData?.hours ?? 0)}
                </span>
              </div>
              {hoveredData ? (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {Array.from(hoveredData.subjects.entries()).map(([label, h]) => (
                    <span key={label}>
                      {label} · <span className="text-foreground">{fmtHours(h)}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-muted-foreground">No study logged.</div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">
              Hover a square to see the hours and subjects for that day.
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" />
            {totals.streak}d streak
          </span>
          <span className="text-[11px] text-muted-foreground">
            Best {fmtHours(totals.best)}
          </span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Less
            {theme.ramp.map((c) => (
              <span
                key={c}
                className="h-[10px] w-[10px] rounded-[3px]"
                style={{ background: c }}
              />
            ))}
            More
          </span>
        </div>
      </div>
    </div>
  );
}

export default StudyHeatmap;
