import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";

type Exam = { id: string; subject: string; note: string | null; exam_at: string; color: string };

const COLORS = ["#a855f7", "#fde047", "#38bdf8", "#34d399", "#fb7185", "#f97316", "#c084fc", "#94a3b8"];
const LOCAL_KEY = "summit-upcoming-exams-v1";

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

function countdown(iso: string) {
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const mins = Math.floor((abs % 3_600_000) / 60_000);
  return { past: diff < 0, days, hours, mins };
}

export function UpcomingExams() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [local, setLocal] = useState<Exam[]>([]);
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    setLocal(readLocal());
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
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
      await supabase.from("user_exams").insert({ ...exam, user_id: user.id });
      await qc.invalidateQueries({ queryKey: ["user-exams", user.id] });
    } else {
      const next = [...local, { ...exam, id: Math.random().toString(36).slice(2) }];
      setLocal(next);
      writeLocal(next);
    }
    setOpen(false);
  }

  async function remove(id: string) {
    if (user) {
      await supabase.from("user_exams").delete().eq("id", id);
      await qc.invalidateQueries({ queryKey: ["user-exams", user.id] });
    } else {
      const next = local.filter((e) => e.id !== id);
      setLocal(next);
      writeLocal(next);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-2xl purple-outline bg-card/50 p-6 backdrop-blur-xl fade-in-up">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Upcoming Exams
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/auth" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                Sign in to sync
              </Link>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/60 bg-primary/20 px-3 py-1.5 text-xs transition-transform hover:scale-[1.03]"
            >
              {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {open ? "Close" : "Add exam"}
            </button>
          </div>
        </div>

        {open && <ExamForm onAdd={add} />}

        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No exams yet — add one and Summit will count down to the minute.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((e) => {
              const c = countdown(e.exam_at);
              return (
                <li
                  key={e.id}
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-surface/50 p-4 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ boxShadow: `inset 3px 0 0 ${e.color}` }}
                >
                  <span
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
                    style={{ background: e.color }}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{e.subject}</div>
                      {e.note && <div className="truncate text-xs text-muted-foreground">{e.note}</div>}
                    </div>
                    <button
                      onClick={() => remove(e.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Delete ${e.subject}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-3xl font-semibold tabular-nums" style={{ color: e.color }}>
                      {c.past ? "—" : c.days}
                    </span>
                    <span className="pb-1 text-xs text-muted-foreground">
                      {c.past ? "completed" : `days · ${c.hours}h ${c.mins}m`}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(e.exam_at).toLocaleString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function ExamForm({ onAdd }: { onAdd: (e: Omit<Exam, "id">) => void }) {
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!subject.trim() || !date) return;
        onAdd({ subject: subject.trim(), note: note.trim() || null, exam_at: new Date(date).toISOString(), color });
        setSubject("");
        setNote("");
        setDate("");
      }}
      className="mb-5 grid gap-3 rounded-xl border border-border/60 bg-surface/40 p-4 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
    >
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject (e.g. Maths Advanced)"
        className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        type="submit"
        className="rounded-lg border border-primary/60 bg-primary/20 px-4 py-2 text-sm transition-transform hover:scale-[1.03]"
      >
        Add
      </button>
      <div className="flex items-center gap-2 sm:col-span-4">
        <span className="text-xs text-muted-foreground">Colour</span>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Colour ${c}`}
            className={`h-5 w-5 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-offset-background" : ""}`}
            style={{ background: c, boxShadow: `0 0 10px ${c}66` }}
          />
        ))}
      </div>
    </form>
  );
}
