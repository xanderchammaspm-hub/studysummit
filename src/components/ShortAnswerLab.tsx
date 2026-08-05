import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { askCoach } from "@/lib/ai.functions";
import { RichEditor } from "@/components/RichEditor";

type Turn = { role: "user" | "assistant"; content: string };

export function ShortAnswerLab() {
  const ask = useServerFn(askCoach);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (mode: "mark" | "explain" | "generate") => {
    if (!question.trim()) {
      setError("Add a short-answer question first.");
      return;
    }
    setBusy(true);
    setError(null);
    const label =
      mode === "mark" ? "Mark my answer" : mode === "explain" ? "Explain this question" : "Give me practice questions";
    setTurns((t) => [...t, { role: "user", content: `${label}\n\n${question}` }]);
    try {
      const res = await ask({
        data: {
          mode,
          subject: "HSC English — short answer response",
          input: question,
          studentAnswer: mode === "mark" ? answer : undefined,
        },
      });
      setTurns((t) => [...t, { role: "assistant", content: res.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Atlas AI is unavailable right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="purple-outline rounded-2xl bg-surface/40 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Atlas AI · Short Answer
        </div>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="Paste the short-answer question (include the marks, e.g. 4 marks)…"
          className="mt-3 w-full resize-y rounded-xl border border-border/60 bg-card/60 p-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/70"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          placeholder="Write your response here — Atlas will mark it against HSC criteria…"
          className="mt-2 w-full resize-y rounded-xl border border-border/60 bg-card/60 p-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/70"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => run("mark")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/60 bg-primary/15 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-primary/25 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Mark my answer
          </button>
          <button
            onClick={() => run("explain")}
            disabled={busy}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-50"
          >
            Explain the question
          </button>
          <button
            onClick={() => run("generate")}
            disabled={busy}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-50"
          >
            Practice questions
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        {turns.length > 0 && (
          <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {turns.map((t, i) => (
              <div
                key={i}
                className={`fade-in-up rounded-xl border p-3 text-sm whitespace-pre-wrap ${
                  t.role === "user"
                    ? "border-border/50 bg-card/50 text-muted-foreground"
                    : "border-primary/40 bg-primary/10 text-foreground"
                }`}
              >
                {t.content}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h5 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Short Answer Notes
        </h5>
        <RichEditor
          storageKey="analytical-doc-short-answers"
          placeholder="Mark allocations, timing, response formulas…"
          minHeight={240}
        />
      </div>
    </div>
  );
}
