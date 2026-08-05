import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, Check, Eye, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useSubjects, type YearKey } from "@/hooks/useSubjectStore";

/**
 * Spaced repetition + active recall scheduler (SM-2 lite).
 * Cards live in localStorage; each review reschedules by ease + interval.
 */

export type Card = {
  id: string;
  subject: string;
  front: string;
  back: string;
  ease: number;
  interval: number;
  reps: number;
  due: number;
  created: number;
};

const KEY = "summit-recall-cards-v1";
const DAY = 86_400_000;
const YEARS: YearKey[] = ["Year 11", "Year 12"];

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function useCards() {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCards(JSON.parse(raw) as Card[]);
    } catch {
      /* ignore */
    }
  }, []);

  const commit = useCallback((next: Card[]) => {
    setCards(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  return { cards, commit };
}

/** SM-2 grading: 0 = again, 1 = hard, 2 = good, 3 = easy. */
function schedule(card: Card, grade: number): Card {
  let { ease, interval, reps } = card;
  if (grade === 0) {
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    ease = Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
    interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease);
    if (grade === 1) interval = Math.max(1, Math.round(interval * 0.6));
  }
  return { ...card, ease, interval, reps, due: Date.now() + Math.max(0.2, interval) * DAY };
}

export function RecallScheduler() {
  const subjectMap = useSubjects();
  const { cards, commit } = useCards();
  const [adding, setAdding] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [subject, setSubject] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const subjects = useMemo(
    () => YEARS.flatMap((y) => subjectMap[y].map((s) => s.name)).filter(Boolean),
    [subjectMap],
  );

  const scoped = filter === "all" ? cards : cards.filter((c) => c.subject === filter);
  const due = scoped.filter((c) => c.due <= Date.now()).sort((a, b) => a.due - b.due);
  const current = due[0] ?? null;
  const tomorrow = scoped.filter((c) => c.due > Date.now() && c.due <= Date.now() + DAY).length;
  const mature = scoped.filter((c) => c.interval >= 21).length;

  function addCard() {
    if (!front.trim() || !back.trim()) return;
    const card: Card = {
      id: uid(),
      subject: subject || subjects[0] || "General",
      front: front.trim(),
      back: back.trim(),
      ease: 2.5,
      interval: 0,
      reps: 0,
      due: Date.now(),
      created: Date.now(),
    };
    commit([card, ...cards]);
    setFront("");
    setBack("");
    setAdding(false);
  }

  function grade(g: number) {
    if (!current) return;
    commit(cards.map((c) => (c.id === current.id ? schedule(c, g) : c)));
    setRevealed(false);
  }

  function remove(id: string) {
    commit(cards.filter((c) => c.id !== id));
  }

  return (
    <section className="mx-auto mt-8 max-w-4xl px-6">
      <div className="purple-outline relative overflow-hidden rounded-2xl bg-card/50 p-5 backdrop-blur-sm sm:p-6 fade-in-up">
        <div className="absolute inset-x-0 top-0 h-px shimmer-line" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/40 bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="text-lg font-semibold gradient-text">Active Recall Scheduler</h2>
              <p className="text-xs text-muted-foreground">
                Spaced repetition — cards resurface exactly when you're about to forget them.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="cursor-pointer rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-foreground outline-none"
            >
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => setAdding((v) => !v)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full purple-outline purple-glow-hover bg-surface/60 px-3 py-1.5 text-xs"
            >
              {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? "Cancel" : "New card"}
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
          <Stat label="Due now" value={due.length} accent />
          <Stat label="Due tomorrow" value={tomorrow} />
          <Stat label="Mature (21d+)" value={mature} />
        </div>

        {adding && (
          <div className="mb-4 space-y-2 rounded-xl border border-border/70 bg-surface/50 p-4 fade-in-up">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-border bg-background/70 px-3 py-2 text-sm outline-none"
            >
              <option value="">Choose subject…</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Prompt / question (recall cue)"
              className="w-full rounded-lg border border-border bg-background/70 px-3 py-2 text-sm outline-none transition-colors focus:border-primary/70"
            />
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Answer / key detail"
              rows={3}
              className="w-full resize-y rounded-lg border border-border bg-background/70 px-3 py-2 text-sm outline-none transition-colors focus:border-primary/70"
            />
            <button
              onClick={addCard}
              className="cursor-pointer rounded-lg bg-primary/20 px-4 py-2 text-sm text-foreground transition-colors hover:bg-primary/30"
            >
              Add to schedule
            </button>
          </div>
        )}

        {current ? (
          <div className="rounded-xl border border-primary/30 bg-surface/60 p-5 text-center transition-all">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              {current.subject} · rep {current.reps}
            </div>
            <p className="text-base font-medium text-foreground">{current.front}</p>

            {revealed ? (
              <p className="mt-4 whitespace-pre-wrap rounded-lg border border-border/60 bg-background/50 p-3 text-left text-sm text-muted-foreground fade-in-up">
                {current.back}
              </p>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full purple-outline purple-glow-hover bg-surface/70 px-4 py-2 text-sm"
              >
                <Eye className="h-4 w-4" /> Reveal answer
              </button>
            )}

            {revealed && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { g: 0, label: "Again", tone: "border-red/50 text-red" },
                  { g: 1, label: "Hard", tone: "border-yellow/50 text-yellow" },
                  { g: 2, label: "Good", tone: "border-primary/50 text-foreground" },
                  { g: 3, label: "Easy", tone: "border-green/50 text-green" },
                ].map((b) => (
                  <button
                    key={b.g}
                    onClick={() => grade(b.g)}
                    className={`cursor-pointer rounded-lg border bg-background/40 px-2 py-2 text-xs transition-all hover:scale-[1.03] ${b.tone}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-surface/40 p-6 text-center text-sm text-muted-foreground">
            {cards.length === 0 ? (
              <>Add your first recall card to start the schedule.</>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-green" /> All caught up — nothing due right now.
              </span>
            )}
          </div>
        )}

        {scoped.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {scoped.slice(0, 6).map((c) => {
              const days = Math.max(0, Math.ceil((c.due - Date.now()) / DAY));
              return (
                <li
                  key={c.id}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-surface/40 px-3 py-2 text-xs transition-colors hover:border-primary/40"
                >
                  <span className="truncate text-muted-foreground">{c.front}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-border/70 px-2 py-0.5 tabular-nums">
                      {c.due <= Date.now() ? "due" : `${days}d`}
                    </span>
                    <button
                      onClick={() => remove(c.id)}
                      className="cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:text-red group-hover:opacity-100"
                      aria-label="Delete card"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {cards.length > 0 && (
          <button
            onClick={() => commit(cards.map((c) => ({ ...c, due: Date.now(), interval: 0, reps: 0 })))}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset schedule
          </button>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        accent ? "border-primary/40 bg-primary/10" : "border-border/60 bg-surface/50"
      }`}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-base font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
