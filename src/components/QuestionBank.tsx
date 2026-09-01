import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2, ChevronDown, CheckCircle2, Library, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { generateQuestions, markAnswer } from "@/lib/ai.functions";
import { Textarea } from "@/components/ui/textarea";
import { AtlasMarkdown } from "@/components/AtlasMarkdown";
import { HistoryRail } from "@/components/AtlasHistory";
import { useRecallStore } from "@/hooks/useRecallStore";

type Difficulty = "Easy" | "Medium" | "Hard" | "HSC";
type Question = { n: number; difficulty: Difficulty; marks: number; question: string; rubric: string };
type Result = { awarded: number; feedback: string };

const BANDS: Difficulty[] = ["Easy", "Medium", "Hard", "HSC"];
const STORE_KEY = "summit-question-bank-v1";
const SETS_KEY = "summit-question-sets-v1";

const BAND_STYLE: Record<Difficulty, string> = {
  Easy: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
  Medium: "border-sky-400/40 text-sky-300 bg-sky-400/10",
  Hard: "border-yellow/50 text-yellow bg-yellow/10",
  HSC: "border-primary/50 text-primary bg-primary/15",
};

type QSet = {
  id: string;
  title: string;
  ts: number;
  topic: string;
  questions: Question[];
  answers: Record<number, string>;
  results: Record<number, Result>;
};

const scoreTone = (pct: number) =>
  pct >= 80
    ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
    : pct >= 50
      ? "border-yellow/50 bg-yellow/10 text-yellow"
      : "border-rose-400/50 bg-rose-400/10 text-rose-300";

function ConfettiBurst() {
  const bits = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {bits.map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/3 h-1.5 w-1.5 rounded-[2px]"
          style={{
            background: i % 3 === 0 ? "hsl(var(--yellow))" : i % 3 === 1 ? "hsl(var(--primary))" : "#fff",
            ["--dx" as string]: `${(Math.random() - 0.5) * 380}px`,
            ["--dy" as string]: `${-120 - Math.random() * 220}px`,
            animation: `confettiFly 1500ms cubic-bezier(0.16,0.9,0.3,1) ${i * 22}ms both`,
          }}
        />
      ))}
    </div>
  );
}

/** 28 AI-generated HSC-style questions with answering, marking, saved sets and a difficulty filter. */
export function QuestionBankPanel() {
  const run = useServerFn(generateQuestions);
  const mark = useServerFn(markAnswer);
  const [topic, setTopic] = useState("");
  const [focus, setFocus] = useState<"Mixed" | Difficulty>("Mixed");
  const [filter, setFilter] = useState<"All" | Difficulty>("All");
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, Result>>({});
  const [marking, setMarking] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sets, setSets] = useState<QSet[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Quick Recall study material can ground the generated questions.
  const recall = useRecallStore();
  const [showMaterials, setShowMaterials] = useState(false);
  const [useIds, setUseIds] = useState<string[]>([]);

  const chosen = useMemo(
    () => recall.materials.filter((m) => useIds.includes(m.id)),
    [recall.materials, useIds],
  );
  const source = useMemo(
    () =>
      chosen
        .map((m) => `### ${m.name}\n${m.content}`)
        .join("\n\n")
        .slice(0, 44000),
    [chosen],
  );

  useEffect(() => {
    try {
      const rawSets = localStorage.getItem(SETS_KEY);
      if (rawSets) {
        const s = JSON.parse(rawSets) as QSet[];
        if (Array.isArray(s)) setSets(s);
      }
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Omit<QSet, "id" | "title" | "ts">;
        setTopic(s.topic ?? "");
        setQuestions(s.questions ?? []);
        setAnswers(s.answers ?? {});
        setResults(s.results ?? {});
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ topic, questions, answers, results }));
      localStorage.setItem(SETS_KEY, JSON.stringify(sets));
    } catch {
      // ignore quota errors
    }
  }, [hydrated, topic, questions, answers, results, sets]);

  // Keep the active saved set in sync with the working answers/results.
  useEffect(() => {
    if (!hydrated || !activeId) return;
    setSets((prev) =>
      prev.map((s) => (s.id === activeId ? { ...s, answers, results, questions, topic } : s)),
    );
  }, [hydrated, activeId, answers, results, questions, topic]);

  const generate = async () => {
    if (!topic.trim() || busy) return;
    setBusy(true);
    try {
      const res = await run({
        data: { topic: topic.trim(), focus, ...(source ? { source } : {}) },
      });
      const qs = res.questions as Question[];
      const id = `set_${Date.now()}`;
      setQuestions(qs);
      setOpen(new Set());
      setAnswers({});
      setResults({});
      setActiveId(id);
      setSets((prev) => [
        { id, title: topic.trim().slice(0, 60), ts: Date.now(), topic: topic.trim(), questions: qs, answers: {}, results: {} },
        ...prev,
      ].slice(0, 30));
      toast.success(`${qs.length} questions ready`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate questions");
    } finally {
      setBusy(false);
    }
  };

  const selectSet = (id: string) => {
    const s = sets.find((x) => x.id === id);
    if (!s) return;
    setActiveId(id);
    setTopic(s.topic);
    setQuestions(s.questions);
    setAnswers(s.answers ?? {});
    setResults(s.results ?? {});
    setOpen(new Set());
  };

  const deleteSet = (id: string) => {
    setSets((prev) => prev.filter((s) => s.id !== id));
    if (id === activeId) {
      setActiveId(null);
      setQuestions([]);
      setAnswers({});
      setResults({});
    }
  };

  const newSet = () => {
    setActiveId(null);
    setQuestions([]);
    setAnswers({});
    setResults({});
    setTopic("");
  };

  const submit = async (q: Question) => {
    const answer = (answers[q.n] ?? "").trim();
    if (!answer || marking !== null) return;
    setMarking(q.n);
    try {
      const res = await mark({
        data: { question: q.question, rubric: q.rubric ?? "", marks: q.marks, answer },
      });
      const r = res as Result;
      setResults((prev) => ({ ...prev, [q.n]: r }));
      toast.success(`Marked ${r.awarded}/${q.marks}`);
      if (r.awarded >= q.marks) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1700);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't mark that answer");
    } finally {
      setMarking(null);
    }
  };

  const visible = useMemo(
    () => (filter === "All" ? questions : questions.filter((q) => q.difficulty === filter)),
    [questions, filter],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const q of questions) m[q.difficulty] = (m[q.difficulty] ?? 0) + 1;
    return m;
  }, [questions]);

  const score = useMemo(() => {
    let awarded = 0;
    let total = 0;
    let done = 0;
    for (const q of questions) {
      const r = results[q.n];
      if (!r) continue;
      awarded += r.awarded;
      total += q.marks;
      done += 1;
    }
    return { awarded, total, done, pct: total ? (awarded / total) * 100 : 0 };
  }, [questions, results]);

  return (
    <div className="relative flex h-full">
      {celebrate && <ConfettiBurst />}
      <HistoryRail
        open={railOpen}
        onToggle={() => setRailOpen((o) => !o)}
        items={sets.map((s) => ({ id: s.id, title: s.title || "Question set", ts: s.ts }))}
        activeId={activeId}
        onSelect={selectSet}
        onNew={newSet}
        onDelete={deleteSet}
        newLabel="New set"
        title="Question sets"
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="border-b border-border/50 bg-background/40 p-3">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={2}
          placeholder="Topic or syllabus dot point — e.g. 'Legal Studies: the role of law reform in family law'"
          className="resize-none rounded-xl border-border/70 bg-surface/70 text-sm"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMaterials((v) => !v)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
              useIds.length
                ? "border-primary/70 bg-primary/20 text-foreground"
                : "border-border/60 bg-surface/50 text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Library className="h-3 w-3" />
            {useIds.length ? `${useIds.length} note${useIds.length > 1 ? "s" : ""}` : "Quick Recall notes"}
          </button>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Weight
          </span>
          {(["Mixed", ...BANDS] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFocus(b)}
              className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                focus === b
                  ? "border-primary/70 bg-primary/20 text-foreground"
                  : "border-border/60 bg-surface/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {b}
            </button>
          ))}
          <button
            onClick={generate}
            disabled={busy || !topic.trim()}
            className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Generate 28
          </button>
        </div>
      </div>

      {showMaterials && (
        <div className="max-h-52 overflow-y-auto border-b border-border/40 bg-surface/30 px-3 py-2.5">
          {recall.loading ? (
            <p className="text-[11px] text-muted-foreground">Loading your Quick Recall library…</p>
          ) : recall.materials.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No study material yet — upload notes in Quick Recall and they'll appear here.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recall.subjects.map((sub) => {
                const folderIds = recall.folders.filter((f) => f.subject_id === sub.id).map((f) => f.id);
                const mats = recall.materials.filter((m) => folderIds.includes(m.folder_id));
                if (!mats.length) return null;
                return (
                  <div key={sub.id}>
                    <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {sub.emoji} {sub.name}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mats.map((m) => {
                        const on = useIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              setUseIds((prev) =>
                                prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id],
                              );
                              if (!topic.trim()) setTopic(`${sub.name}: ${m.name}`);
                            }}
                            className={`flex max-w-full cursor-pointer items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                              on
                                ? "border-primary/70 bg-primary/20 text-foreground"
                                : "border-border/60 bg-surface/50 text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {on ? <Check className="h-3 w-3 shrink-0" /> : null}
                            <span className="truncate">{m.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {questions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 px-3 py-2">
          {(["All", ...BANDS] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFilter(b)}
              className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                filter === b
                  ? "border-primary/70 bg-primary/20 text-foreground"
                  : "border-border/60 bg-surface/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {b}
              {b !== "All" && (
                <span className="ml-1 text-muted-foreground">{counts[b] ?? 0}</span>
              )}
            </button>
          ))}
          {score.done > 0 && (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${scoreTone(score.pct)}`}
            >
              {score.awarded}/{score.total} · {Math.round(score.pct)}% ({score.done} marked)
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {visible.length} shown
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {questions.length === 0 && !busy && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/40 to-primary/5">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="max-w-xs text-xs text-muted-foreground">
              Give Atlas a topic and it writes 28 HSC-style questions across Easy, Medium,
              Hard and HSC difficulty — write your answer under each one and Atlas marks it.
            </p>
          </div>
        )}
        {busy && questions.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-border/50 bg-surface/40"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        )}
        {visible.map((q) => {
          const isOpen = open.has(q.n);
          const result = results[q.n];
          return (
            <div
              key={q.n}
              className="rounded-xl border border-border/60 bg-surface/50 p-3 backdrop-blur-md transition-colors hover:border-primary/45"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-5 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  {q.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-foreground">{q.question}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${BAND_STYLE[q.difficulty]}`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{q.marks} marks</span>
                    {result && (
                      <span
                        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${scoreTone((result.awarded / q.marks) * 100)}`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {result.awarded}/{q.marks}
                      </span>
                    )}
                    {q.rubric && (
                      <button
                        onClick={() =>
                          setOpen((prev) => {
                            const next = new Set(prev);
                            if (next.has(q.n)) next.delete(q.n);
                            else next.add(q.n);
                            return next;
                          })
                        }
                        className="ml-auto flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
                      >
                        Rubric
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  {isOpen && q.rubric && (
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border/50 bg-background/50 p-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
                      {q.rubric}
                    </pre>
                  )}

                  <Textarea
                    value={answers[q.n] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.n]: e.target.value }))}
                    rows={4}
                    placeholder="Write your answer here…"
                    className="mt-3 min-h-[96px] rounded-xl border-border/70 bg-background/50 text-sm leading-relaxed"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => submit(q)}
                      disabled={marking !== null || !(answers[q.n] ?? "").trim()}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-primary/25 disabled:opacity-40"
                    >
                      {marking === q.n ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      )}
                      {result ? "Re-mark with Atlas" : "Mark with Atlas"}
                    </button>
                    {result && (
                      <span className="text-[11px] text-muted-foreground">
                        Saved — your answer and mark stay here after a refresh.
                      </span>
                    )}
                  </div>

                  {result && (
                    <div className="mt-3 rounded-xl border border-primary/30 bg-background/50 p-3">
                      <AtlasMarkdown>{result.feedback}</AtlasMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

export default QuestionBankPanel;
