import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "@tanstack/react-router";

type Exam = { id: string; subject: string; note: string | null; exam_at: string; color: string };

const COLORS = ["#a855f7", "#fde047", "#38bdf8", "#34d399", "#fb7185", "#f97316", "#c084fc", "#94a3b8"];
const LOCAL_KEY = "summit-upcoming-exams-v1";
const DAY = 86_400_000;

function readLocal(): Exam[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Exam[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Exam[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Whole days between today and the exam day — exams always sit at 12:00 am. */
function daysAway(iso: string) {
  const target = startOfDay(new Date(iso)).getTime();
  const today = startOfDay(new Date()).getTime();
  return Math.round((target - today) / DAY);
}

function isoAtMidnight(y: number, m: number, d: number) {
  return new Date(y, m, d, 0, 0, 0, 0).toISOString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function UpcomingExams() {
  const { user } = useAuth();
  const { awardXp } = useProfile();
  const qc = useQueryClient();
  const [local, setLocal] = useState<Exam[]>([]);
  const [open, setOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocal(readLocal());
  }, []);

  const cloud = useQuery({
    queryKey: ["user-exams", user?.id ?? null],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_exams")
        .select("id, subject, note, exam_at, color")
        .order("exam_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Exam[];
    },
  });

  const exams = useMemo(() => {
    const list = user ? (cloud.data ?? []) : local;
    return [...list].sort((a, b) => +new Date(a.exam_at) - +new Date(b.exam_at));
  }, [user, cloud.data, local]);

  async function add(exam: Omit<Exam, "id">) {
    if (user) {
      const { error } = await supabase.from("user_exams").insert({ ...exam, user_id: user.id });
      if (error) {
        toast.error("Couldn't save that exam", { description: error.message });
        return;
      }
      await qc.invalidateQueries({ queryKey: ["user-exams", user.id] });
    } else {
      const next = [...local, { ...exam, id: Math.random().toString(36).slice(2) }];
      setLocal(next);
      writeLocal(next);
    }
    setOpen(false);
  }

  async function remove(id: string, silent = false) {
    const target = exams.find((e) => e.id === id);
    if (user) {
      const { error } = await supabase.from("user_exams").delete().eq("id", id);
      if (error) {
        toast.error("Couldn't remove that exam", { description: error.message });
        return;
      }
      await qc.invalidateQueries({ queryKey: ["user-exams", user.id] });
    } else {
      const next = local.filter((e) => e.id !== id);
      setLocal(next);
      writeLocal(next);
    }
    if (!silent && target) {
      toast.success(`${target.subject} removed`, {
        action: {
          label: "Undo",
          onClick: () => {
            void add({
              subject: target.subject,
              note: target.note,
              exam_at: target.exam_at,
              color: target.color,
            });
          },
        },
      });
    }
  }

  async function complete(exam: Exam) {
    await remove(exam.id, true);
    await awardXp("examCompleted", 1, { subject: exam.subject });
    toast.success(`${exam.subject} completed`, { description: "+120 XP added to your climb." });
  }


  const nudge = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 480), behavior: "smooth" });
  };

  const next = exams.find((e) => daysAway(e.exam_at) >= 0) ?? null;
  const nextDays = next ? daysAway(next.exam_at) : null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="relative overflow-hidden rounded-3xl purple-outline bg-card/50 p-6 backdrop-blur-2xl fade-in-up">
        <div className="absolute inset-x-0 top-0 h-px shimmer-line" />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Upcoming Exams
              </h2>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {next ? (
                <span>
                  <span className="gradient-text tabular-nums">
                    {nextDays === 0 ? "Today" : nextDays === 1 ? "Tomorrow" : `${nextDays} days`}
                  </span>{" "}
                  <span className="text-foreground/80">· {next.subject}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Nothing scheduled</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/auth" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                Sign in to sync
              </Link>
            )}
            <button
              onClick={() => nudge(-1)}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/60 text-muted-foreground transition-colors hover:text-foreground sm:flex"
              aria-label="Scroll back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => nudge(1)}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/60 text-muted-foreground transition-colors hover:text-foreground sm:flex"
              aria-label="Scroll forward"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/60 bg-primary/20 px-4 py-2 text-xs transition-transform hover:scale-[1.03]"
            >
              {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {open ? "Close" : "New exam"}
            </button>
          </div>
        </div>

        {open && <ExamComposer onAdd={add} />}

        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No exams yet — tap “New exam”, pick a day on the calendar and Summit counts down for you.
          </p>
        ) : (
          <div
            ref={railRef}
            className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {exams.map((e, i) => (
              <ExamCard
                key={e.id}
                exam={e}
                index={i}
                onDelete={() => remove(e.id)}
                onComplete={() => complete(e)}
              />
            ))}
          </div>
        )}

        {exams.length > 0 && <Timeline exams={exams} />}
      </div>
    </section>
  );
}

function ExamCard({
  exam,
  index,
  onDelete,
  onComplete,
}: {
  exam: Exam;
  index: number;
  onDelete: () => void;
  onComplete: () => void;
}) {
  const d = daysAway(exam.exam_at);
  const past = d < 0;
  return (
    <article
      className="group relative w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border/60 bg-surface/50 p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: exam.color }}
      />
      <span
        className="pointer-events-none absolute inset-y-5 left-0 w-[3px] rounded-full"
        style={{ background: exam.color, boxShadow: `0 0 12px ${exam.color}` }}
      />
      <div className="pl-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {new Date(exam.exam_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
        <div className="mt-1 truncate text-lg font-medium">{exam.subject}</div>
        {exam.note && <div className="truncate text-xs text-muted-foreground">{exam.note}</div>}

        <div className="mt-5 flex items-end gap-2">
          <span className="text-5xl font-semibold leading-none tabular-nums" style={{ color: exam.color }}>
            {past ? "—" : d}
          </span>
          <span className="pb-1.5 text-xs text-muted-foreground">
            {past ? "past" : d === 1 ? "day to go" : "days to go"}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">{fmtDate(exam.exam_at)}</div>

        <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={onComplete}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-primary/60 bg-primary/20 px-3 py-1.5 text-[11px] transition-colors hover:bg-primary/30"
          >
            <Check className="h-3.5 w-3.5" /> Completed · +120 XP
          </button>
          <button
            onClick={onDelete}
            className="rounded-full border border-border/70 p-1.5 text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${exam.subject}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

/** Horizontal proportional timeline from today to the furthest exam. */
function Timeline({ exams }: { exams: Exam[] }) {
  const upcoming = exams.filter((e) => daysAway(e.exam_at) >= 0);
  if (upcoming.length === 0) return null;
  const max = Math.max(1, daysAway(upcoming[upcoming.length - 1].exam_at));

  return (
    <div className="mt-6 rounded-2xl border border-border/60 bg-surface/40 px-5 pb-8 pt-6">
      <div className="relative h-[3px] rounded-full bg-border/70">
        <div
          className="absolute inset-y-0 left-0 w-full rounded-full opacity-60"
          style={{ background: "linear-gradient(90deg, oklch(0.7 0.22 300), oklch(0.88 0.13 82))" }}
        />
        {upcoming.map((e) => {
          const left = (daysAway(e.exam_at) / max) * 100;
          return (
            <div
              key={e.id}
              className="group absolute -top-[6px] -translate-x-1/2"
              style={{ left: `${left}%` }}
            >
              <span
                className="block h-[15px] w-[15px] rounded-full border-2 transition-transform duration-300 group-hover:scale-125"
                style={{
                  background: e.color,
                  borderColor: "oklch(0.98 0.01 285 / 0.8)",
                  boxShadow: `0 0 12px ${e.color}`,
                }}
              />
              <span className="pointer-events-none absolute left-1/2 top-6 w-24 -translate-x-1/2 truncate text-center text-[10px] text-muted-foreground">
                {e.subject}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Today</span>
        <span>{max} days</span>
      </div>
    </div>
  );
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function ExamComposer({ onAdd }: { onAdd: (e: Omit<Exam, "id">) => void }) {
  const today = startOfDay(new Date());
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState<Date | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!subject.trim() || !picked) return;
        onAdd({
          subject: subject.trim(),
          note: note.trim() || null,
          exam_at: isoAtMidnight(picked.getFullYear(), picked.getMonth(), picked.getDate()),
          color,
        });
        setSubject("");
        setNote("");
        setPicked(null);
      }}
      className="mb-6 grid gap-5 rounded-2xl border border-border/60 bg-surface/40 p-5 md:grid-cols-[320px_1fr]"
    >
      {/* Calendar */}
      <div className="rounded-xl border border-border/60 bg-background/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </div>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <span key={`e${i}`} />;
            const date = new Date(year, month, d);
            const isToday = date.getTime() === today.getTime();
            const isPicked = picked?.getTime() === date.getTime();
            return (
              <button
                key={d}
                type="button"
                onClick={() => setPicked(date)}
                className={`flex h-9 items-center justify-center rounded-full text-sm transition-all duration-200 ${
                  isPicked
                    ? "text-background"
                    : isToday
                      ? "text-yellow"
                      : "text-foreground/80 hover:bg-primary/15"
                }`}
                style={
                  isPicked
                    ? { background: color, boxShadow: `0 0 16px ${color}88` }
                    : undefined
                }
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (e.g. Maths Advanced)"
          className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Colour</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Colour ${c}`}
              className={`h-6 w-6 rounded-full transition-transform duration-200 ${
                color === c ? "scale-125" : "hover:scale-110"
              }`}
              style={{ background: c, boxShadow: `0 0 12px ${c}66` }}
            />
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {picked ? fmtDate(picked.toISOString()) : "Pick a date"} · 12:00 am
          </span>
          <button
            type="submit"
            disabled={!subject.trim() || !picked}
            className="rounded-full border border-primary/60 bg-primary/20 px-5 py-2 text-sm transition-transform hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100"
          >
            Add exam
          </button>
        </div>
      </div>
    </form>
  );
}
