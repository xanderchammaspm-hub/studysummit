import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { gradeAnswer, type GradeResult } from "@/lib/exam.functions";
import type { Paper, Question } from "./types";
import { pct } from "./types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CircleX,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react";

type Graded = GradeResult & { correct?: boolean };

type Props = {
  paper: Paper;
  userId: string;
  onExit: () => void;
  onFinished: () => void;
};

export function PaperRunner({ paper, userId, onExit, onFinished }: Props) {
  const { awardXp } = useProfile();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, Graded>>({});
  const [grading, setGrading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: qs, error } = await supabase
        .from("exam_questions")
        .select("*")
        .eq("paper_id", paper.id)
        .order("position", { ascending: true });
      if (!alive) return;
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const list = (qs ?? []) as unknown as Question[];
      setQuestions(list);

      const { data: attempt, error: aErr } = await supabase
        .from("exam_attempts")
        .insert({
          user_id: userId,
          paper_id: paper.id,
          paper_title: paper.title,
          subject: paper.subject,
          total_marks: list.reduce((s, q) => s + q.marks, 0),
        })
        .select()
        .single();
      if (!alive) return;
      if (aErr) toast.error(aErr.message);
      else setAttemptId((attempt as { id: string }).id);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [paper.id, paper.title, paper.subject, userId]);

  const q = questions[idx];
  const totalMarks = useMemo(() => questions.reduce((s, x) => s + x.marks, 0), [questions]);
  const awarded = useMemo(
    () => Object.values(results).reduce((s, r) => s + r.awarded, 0),
    [results],
  );
  const answeredCount = Object.keys(results).length;

  async function persist(question: Question, response: string, res: Graded) {
    if (!attemptId) return;
    await supabase.from("attempt_answers").insert({
      attempt_id: attemptId,
      user_id: userId,
      question_id: question.id,
      question_prompt: question.prompt,
      qtype: question.qtype,
      topic: question.topic,
      subject: paper.subject,
      response,
      awarded: res.awarded,
      max_marks: question.marks,
      feedback: res.feedback,
      missing_keywords: res.missingKeywords,
      exemplar: res.exemplar,
      is_mistake: res.awarded < question.marks * 0.6,
    });
  }

  async function submitCurrent() {
    if (!q) return;
    if (q.qtype === "mcq") {
      const picked = choices[q.id];
      if (picked === undefined) return toast.error("Pick an answer first");
      const correct = picked === q.correct_option;
      const res: Graded = {
        awarded: correct ? q.marks : 0,
        maxMarks: q.marks,
        band: correct ? "Correct" : "Incorrect",
        strengths: correct ? ["Correct option selected"] : [],
        missingKeywords: correct ? [] : [q.topic ?? "Review this concept"],
        improvements: correct ? [] : ["Revisit " + (q.topic ?? "this topic")],
        feedback: q.criteria ?? (correct ? "Well done." : "Review the marking note for this question."),
        exemplar: q.exemplar ?? (q.options[q.correct_option ?? 0] ?? ""),
        correct,
      };
      setResults((r) => ({ ...r, [q.id]: res }));
      void persist(q, q.options[picked] ?? "", res);
      return;
    }

    const answer = (responses[q.id] ?? "").trim();
    if (answer.length < 5) return toast.error("Write a response before marking");
    setGrading(true);
    try {
      const res = await gradeAnswer({
        data: {
          prompt: q.prompt,
          answer,
          marks: q.marks,
          criteria: q.criteria ?? undefined,
          exemplar: q.exemplar ?? undefined,
          subject: paper.subject,
          topic: q.topic ?? undefined,
        },
      });
      setResults((r) => ({ ...r, [q.id]: res }));
      void persist(q, answer, res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Marking failed");
    } finally {
      setGrading(false);
    }
  }

  async function finish() {
    if (attemptId) {
      await supabase
        .from("exam_attempts")
        .update({
          completed_at: new Date().toISOString(),
          awarded_marks: awarded,
          total_marks: totalMarks,
        })
        .eq("id", attemptId);
      await awardXp("pastPaper");
      if (totalMarks > 0 && awarded / totalMarks >= 0.9) await awardXp("quiz");
    }
    setDone(true);
    onFinished();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Preparing your paper…
      </div>
    );
  }

  if (!q) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
        <p className="text-sm text-muted-foreground">This paper has no questions yet.</p>
        <Button onClick={onExit} variant="outline" className="mt-4">
          Back to library
        </Button>
      </div>
    );
  }

  if (done) {
    return <Summary paper={paper} awarded={awarded} total={totalMarks} results={results} onExit={onExit} />;
  }

  const result = results[q.id];
  const progress = pct(idx + (result ? 1 : 0), questions.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              onClick={onExit}
              className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Exit paper
            </button>
            <h2 className="text-base font-semibold tracking-tight">{paper.title}</h2>
            <p className="text-xs text-primary">
              {paper.subject} · Question {idx + 1} of {questions.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums gradient-text">
              {awarded}
              <span className="text-sm text-muted-foreground">/{totalMarks}</span>
            </p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {answeredCount} marked
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, oklch(0.68 0.22 300), oklch(0.86 0.11 82))",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div key={q.id} className="fade-in-up rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md purple-outline">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {q.qtype === "mcq" ? "Multiple choice" : q.qtype === "extended" ? "Extended response" : "Short answer"}
          </span>
          <span className="rounded-full border border-yellow/40 bg-yellow/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-yellow">
            {q.marks} {q.marks === 1 ? "mark" : "marks"}
          </span>
          {q.topic && (
            <span className="text-[11px] text-muted-foreground">{q.topic}</span>
          )}
        </div>

        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{q.prompt}</p>

        <div className="mt-5">
          {q.qtype === "mcq" ? (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const picked = choices[q.id] === i;
                const isCorrect = result && i === q.correct_option;
                const isWrongPick = result && picked && i !== q.correct_option;
                return (
                  <button
                    key={i}
                    disabled={!!result}
                    onClick={() => setChoices((c) => ({ ...c, [q.id]: i }))}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all duration-200 ${
                      isCorrect
                        ? "border-emerald-400/60 bg-emerald-400/10"
                        : isWrongPick
                          ? "border-destructive/60 bg-destructive/10"
                          : picked
                            ? "border-primary bg-primary/10"
                            : "border-border bg-surface/40 hover:border-primary/60 hover:bg-surface/70"
                    }`}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px]">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <CircleCheck className="h-4 w-4 text-emerald-400" />}
                    {isWrongPick && <CircleX className="h-4 w-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea
              value={responses[q.id] ?? ""}
              disabled={!!result}
              onChange={(e) => setResponses((r) => ({ ...r, [q.id]: e.target.value }))}
              placeholder={
                q.qtype === "extended"
                  ? "Write your extended response here — thesis, analysis, evidence…"
                  : "Write your response here…"
              }
              className="min-h-[160px] resize-y bg-surface/50 text-sm leading-relaxed"
            />
          )}
        </div>

        {result && <Feedback result={result} marks={q.marks} />}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            {!result ? (
              <Button onClick={submitCurrent} disabled={grading} className="gap-2">
                {grading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {grading ? "Marking…" : "Mark my answer"}
              </Button>
            ) : idx < questions.length - 1 ? (
              <Button onClick={() => setIdx((i) => i + 1)} className="gap-2">
                Next question <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} className="gap-2">
                <Trophy className="h-4 w-4" /> Finish paper
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Question rail */}
      <div className="flex flex-wrap gap-2">
        {questions.map((item, i) => {
          const r = results[item.id];
          const state = !r
            ? "border-border bg-surface/40 text-muted-foreground"
            : r.awarded >= item.marks * 0.8
              ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
              : r.awarded >= item.marks * 0.5
                ? "border-yellow/60 bg-yellow/10 text-yellow"
                : "border-destructive/60 bg-destructive/10 text-destructive";
          return (
            <button
              key={item.id}
              onClick={() => setIdx(i)}
              className={`h-8 w-8 rounded-lg border text-xs transition-all duration-200 hover:scale-110 ${state} ${
                i === idx ? "ring-2 ring-primary/60" : ""
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Feedback({ result, marks }: { result: Graded; marks: number }) {
  const ratio = marks ? result.awarded / marks : 0;
  const tone =
    ratio >= 0.8 ? "text-emerald-300" : ratio >= 0.5 ? "text-yellow" : "text-destructive";
  return (
    <div className="fade-in-up mt-5 space-y-4 rounded-xl border border-border bg-surface/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold tracking-tight">Marker feedback</p>
        <p className={`text-lg font-semibold tabular-nums ${tone}`}>
          {result.awarded}
          <span className="text-sm text-muted-foreground">/{marks}</span>
          {result.band && <span className="ml-2 text-xs text-muted-foreground">{result.band}</span>}
        </p>
      </div>
      {result.feedback && (
        <p className="text-sm leading-relaxed text-muted-foreground">{result.feedback}</p>
      )}
      {result.strengths.length > 0 && (
        <List title="What worked" items={result.strengths} icon={<Check className="h-3 w-3 text-emerald-400" />} />
      )}
      {result.missingKeywords.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            Missing syllabus keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.missingKeywords.map((k) => (
              <span
                key={k}
                className="rounded-full border border-yellow/40 bg-yellow/10 px-2.5 py-1 text-[11px] text-yellow"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
      {result.improvements.length > 0 && (
        <List title="How to improve" items={result.improvements} icon={<ArrowRight className="h-3 w-3 text-primary" />} />
      )}
      {result.exemplar && (
        <details className="group rounded-lg border border-border bg-card/60 p-3">
          <summary className="cursor-pointer text-xs font-medium text-primary">
            Show exemplar response
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {result.exemplar}
          </p>
        </details>
      )}
    </div>
  );
}

function List({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1">{icon}</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Summary({
  paper,
  awarded,
  total,
  results,
  onExit,
}: {
  paper: Paper;
  awarded: number;
  total: number;
  results: Record<string, Graded>;
  onExit: () => void;
}) {
  const percentage = pct(awarded, total);
  const weak = Object.values(results).filter((r) => r.awarded < r.maxMarks * 0.6).length;
  return (
    <div className="fade-in-up rounded-2xl border border-border bg-card/60 p-8 text-center backdrop-blur-md purple-outline">
      <div className="mx-auto mb-4 w-fit rounded-2xl border border-border bg-surface/70 p-4 pulse-glow">
        <Trophy className="h-7 w-7 text-yellow" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">Paper complete</h2>
      <p className="mt-1 text-sm text-muted-foreground">{paper.title}</p>
      <p className="mt-6 text-5xl font-semibold tabular-nums gradient-text">{percentage}%</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {awarded} of {total} marks
      </p>
      {weak > 0 && (
        <p className="mt-4 text-sm text-yellow">
          {weak} {weak === 1 ? "question" : "questions"} added to your Mistake Vault for revision.
        </p>
      )}
      <Button onClick={onExit} className="mt-6">
        Back to library
      </Button>
    </div>
  );
}

export default PaperRunner;
