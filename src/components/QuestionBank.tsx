import { useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2, ChevronDown } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { generateQuestions } from "@/lib/ai.functions";
import { Textarea } from "@/components/ui/textarea";

type Difficulty = "Easy" | "Medium" | "Hard" | "HSC";
type Question = { n: number; difficulty: Difficulty; marks: number; question: string; rubric: string };

const BANDS: Difficulty[] = ["Easy", "Medium", "Hard", "HSC"];

const BAND_STYLE: Record<Difficulty, string> = {
  Easy: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
  Medium: "border-sky-400/40 text-sky-300 bg-sky-400/10",
  Hard: "border-yellow/50 text-yellow bg-yellow/10",
  HSC: "border-primary/50 text-primary bg-primary/15",
};

/** 28 AI-generated HSC-style questions with a difficulty filter. */
export function QuestionBankPanel() {
  const run = useServerFn(generateQuestions);
  const [topic, setTopic] = useState("");
  const [focus, setFocus] = useState<"Mixed" | Difficulty>("Mixed");
  const [filter, setFilter] = useState<"All" | Difficulty>("All");
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [open, setOpen] = useState<Set<number>>(new Set());

  const generate = async () => {
    if (!topic.trim() || busy) return;
    setBusy(true);
    try {
      const res = await run({ data: { topic: topic.trim(), focus } });
      setQuestions(res.questions as Question[]);
      setOpen(new Set());
      toast.success(`${res.questions.length} questions ready`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate questions");
    } finally {
      setBusy(false);
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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/50 bg-background/40 p-3">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={2}
          placeholder="Topic or syllabus dot point — e.g. 'Legal Studies: the role of law reform in family law'"
          className="resize-none rounded-xl border-border/70 bg-surface/70 text-sm"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Weight
          </span>
          {(["Mixed", ...BANDS] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFocus(b)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
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
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Generate 28
          </button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 px-3 py-2">
          {(["All", ...BANDS] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFilter(b)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
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
              Hard and HSC difficulty — each with marks and a marking rubric.
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
                        className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionBankPanel;
