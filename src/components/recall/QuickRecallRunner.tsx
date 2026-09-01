import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, History, Loader2, Plus, RefreshCw, Sparkles, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateRecallSet,
  gradeRecallAnswer,
  summariseRecall,
  type RecallGrade,
  type RecallQuestion,
  type RecallSummary,
} from "@/lib/recall.functions";
import type { QuickRecallPayload, RecallMaterial } from "@/components/recall/types";
import { LoadingStages, ScoreRing } from "@/components/recall/RecallShared";
import { RecallMascot, type MascotMood } from "@/components/recall/RecallMascot";
import { clearDraft, readDraft, useAutosaveDraft } from "@/hooks/useRecallDraft";
import { cn } from "@/lib/utils";

type QuickRecallDraft = {
  selected: string[];
  questions: RecallQuestion[];
  idx: number;
  answer: string;
  grades: RecallGrade[];
};

type Props = {
  folderId: string;
  subjectName: string;
  folderName: string;
  materials: RecallMaterial[];
  onExit: () => void;
  onComplete: (score: number, payload: QuickRecallPayload) => Promise<void> | void;
};

type Stage = "select" | "generating" | "run" | "summarising" | "results";

const VERDICT_META: Record<string, { label: string; className: string }> = {
  correct: { label: "Correct", className: "border-emerald-400/50 bg-emerald-500/15 text-emerald-300" },
  mostly: { label: "Mostly correct", className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" },
  partial: { label: "Partially correct", className: "border-yellow/50 bg-yellow/10 text-yellow" },
  incorrect: { label: "Incorrect", className: "border-red-400/50 bg-red-500/15 text-red-300" },
};

export function MaterialPicker({
  title,
  materials,
  selected,
  toggle,
  selectAll,
  onStart,
  starting,
  cta,
}: {
  title: string;
  materials: RecallMaterial[];
  selected: string[];
  toggle: (id: string) => void;
  selectAll: () => void;
  onStart: () => void;
  starting?: boolean;
  cta: string;
}) {
  return (
    <div className="mx-auto max-w-2xl fade-in-up">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs text-primary underline-offset-4 hover:underline cursor-pointer"
        >
          {selected.length === materials.length ? "Clear all" : "Select all"}
        </button>
      </div>
      <ul className="space-y-2">
        {materials.map((m) => {
          const on = selected.includes(m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => toggle(m.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 cursor-pointer",
                  on
                    ? "border-primary/70 bg-primary/12 shadow-[0_0_24px_-12px_var(--primary)]"
                    : "border-border/60 bg-surface/40 hover:border-primary/40 hover:bg-surface/60",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                    on ? "border-primary bg-primary/70 text-white" : "border-border/70",
                  )}
                >
                  {on ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.kind}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          disabled={!selected.length || starting}
          onClick={onStart}
          className="cursor-pointer rounded-full px-8"
        >
          {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {cta}
        </Button>
      </div>
    </div>
  );
}

export function QuickRecallRunner({ folderId, subjectName, folderName, materials, onExit, onComplete }: Props) {
  const [stage, setStage] = useState<Stage>("select");
  const [selected, setSelected] = useState<string[]>(materials.map((m) => m.id));
  const [questions, setQuestions] = useState<RecallQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grades, setGrades] = useState<RecallGrade[]>([]);
  const [grading, setGrading] = useState(false);
  const [current, setCurrent] = useState<RecallGrade | null>(null);
  const [summary, setSummary] = useState<RecallSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<QuickRecallDraft | null>(null);

  // Recover an unfinished attempt after a refresh (client only).
  useEffect(() => {
    const d = readDraft<QuickRecallDraft>("quick_recall", folderId);
    if (d && d.questions?.length) setRecovered(d);
  }, [folderId]);

  const savedAt = useAutosaveDraft<QuickRecallDraft>(
    "quick_recall",
    folderId,
    stage === "run" ? { selected, questions, idx, answer, grades } : null,
    stage === "run",
  );

  function resume() {
    if (!recovered) return;
    setSelected(recovered.selected);
    setQuestions(recovered.questions);
    setIdx(recovered.idx);
    setAnswer(recovered.answer);
    setGrades(recovered.grades);
    setCurrent(recovered.grades[recovered.idx] ?? null);
    setRecovered(null);
    setStage("run");
  }

  function discardDraft() {
    clearDraft("quick_recall", folderId);
    setRecovered(null);
  }


  const source = useMemo(
    () =>
      materials
        .filter((m) => selected.includes(m.id))
        .map((m) => `### ${m.name}\n${m.content}`)
        .join("\n\n")
        .slice(0, 55000),
    [materials, selected],
  );

  const score = grades.length
    ? Math.round(grades.reduce((a, g) => a + g.score, 0) / grades.length)
    : 0;
  const understood = grades.filter((g) => g.verdict === "correct" || g.verdict === "mostly").length;

  const mood: MascotMood = grading
    ? "thinking"
    : current
      ? current.score >= 70
        ? "happy"
        : "encourage"
      : "idle";

  async function start() {
    setError(null);
    setStage("generating");
    try {
      const res = await generateRecallSet({
        data: { subject: subjectName, topic: folderName, source, count: 15 },
      });
      setQuestions(res.questions);
      setIdx(0);
      setGrades([]);
      setAnswer("");
      setCurrent(null);
      setStage("run");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Atlas couldn't build that test.");
      setStage("select");
    }
  }

  async function submit() {
    const q = questions[idx];
    if (!q || grading) return;
    setGrading(true);
    try {
      const grade = await gradeRecallAnswer({
        data: { question: q.question, answer, source, subject: subjectName },
      });
      setCurrent(grade);
      setGrades((prev) => [...prev, grade]);
    } catch {
      setError("Marking failed — check your connection and try again.");
    } finally {
      setGrading(false);
    }
  }

  async function next() {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setAnswer("");
      setCurrent(null);
      return;
    }
    setStage("summarising");
    const transcript = questions
      .map((q, i) => {
        const g = grades[i];
        return `Q${i + 1} (${q.concept}): ${q.question}\nVerdict: ${g?.verdict ?? "n/a"} (${g?.score ?? 0}%)\nMissed: ${(g?.couldAdd ?? []).join("; ")}`;
      })
      .join("\n\n");
    let sum: RecallSummary | null = null;
    try {
      sum = await summariseRecall({ data: { subject: subjectName, topic: folderName, transcript } });
    } catch {
      sum = null;
    }
    setSummary(sum);
    setStage("results");
    await onComplete(score, {
      kind: "quick_recall",
      materials: materials.filter((m) => selected.includes(m.id)).map((m) => m.name),
      questions,
      grades,
      summary: sum,
    });
  }

  /* -------------------------------- Render ------------------------------- */

  if (stage === "generating") {
    return (
      <LoadingStages
        title="Building your recall test"
        stages={["Reading your material...", "Finding key concepts...", "Writing your questions...", "Ready."]}
      />
    );
  }
  if (stage === "summarising") {
    return (
      <LoadingStages
        title="Wrapping up"
        stages={["Reviewing your answers...", "Finding patterns...", "Writing your summary..."]}
      />
    );
  }

  if (stage === "select") {
    return (
      <div>
        <BackBar onExit={onExit} label="Quick Recall" folderName={folderName} />
        {recovered ? (
          <ResumeBanner
            title="Resume your attempt"
            detail={`You were on question ${Math.min(recovered.idx + 1, recovered.questions.length)} of ${recovered.questions.length}.`}
            onResume={resume}
            onDiscard={discardDraft}
          />
        ) : null}
        <MaterialPicker

          title="What do you want to study?"
          materials={materials}
          selected={selected}
          toggle={(id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          selectAll={() => setSelected(selected.length === materials.length ? [] : materials.map((m) => m.id))}
          onStart={() => void start()}
          cta="Start Quick Recall"
        />
        {error ? <p className="mt-4 text-center text-sm text-red-300">{error}</p> : null}
      </div>
    );
  }

  if (stage === "results") {
    return (
      <div className="mx-auto max-w-3xl fade-in-up">
        <BackBar onExit={onExit} label="Quick Recall" folderName={folderName} />
        <div className="glass-panel rounded-3xl p-8 text-center">
          <RecallMascot mood="celebrate" size={84} className="mx-auto" />
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Recall complete</h2>
          <div className="mt-5 flex justify-center">
            <ScoreRing value={score} size={150} label="Score" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {understood} / {questions.length} questions understood
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <ResultList title="Your strengths" tone="good" items={summary?.strengths ?? []} />
          <ResultList title="Review these" tone="warn" items={summary?.review ?? []} />
          <ResultList title="Concepts you missed" tone="bad" items={summary?.missed ?? []} />
        </div>

        {summary?.summary ? (
          <div className="mt-5 rounded-2xl purple-outline bg-card/60 p-5 backdrop-blur-xl">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Atlas summary
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{summary.summary}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" className="cursor-pointer rounded-full" onClick={() => void start()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button className="cursor-pointer rounded-full" onClick={() => setStage("select")}>
            <Sparkles className="mr-2 h-4 w-4" />
            New Quick Recall
          </Button>
          <Button variant="ghost" className="cursor-pointer rounded-full" onClick={onExit}>
            Back to folder
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const progress = ((idx + (current ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-3xl">
      <BackBar onExit={onExit} label="Quick Recall" folderName={folderName} />
      <div className="mb-5">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Quick Recall
            </div>
            <div className="text-sm text-muted-foreground">
              Question {idx + 1} of {questions.length}
            </div>
          </div>
          <RecallMascot mood={mood} size={52} />
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={q?.question} className="glass-panel rounded-3xl p-7 fade-in-up">
        <div className="text-3xl font-semibold tracking-tight text-primary/70">
          {String(idx + 1).padStart(2, "0")}
        </div>
        <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight">{q?.question}</h3>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!!current}
          placeholder="Type your answer from memory..."
          className="mt-5 min-h-40 w-full resize-y rounded-2xl purple-outline bg-surface/40 px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary/70 disabled:opacity-70"
        />

        {!current ? (
          <div className="mt-4 flex justify-end">
            <Button onClick={() => void submit()} disabled={grading} className="cursor-pointer rounded-full px-6">
              {grading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit answer
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4 fade-in-up">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
                  VERDICT_META[current.verdict]?.className,
                )}
              >
                {VERDICT_META[current.verdict]?.label}
              </span>
              <span className="text-sm text-muted-foreground">{current.score}%</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <FeedbackList icon={<CheckCircle2 className="h-3.5 w-3.5" />} title="You got right" tone="good" items={current.gotRight} />
              <FeedbackList icon={<Plus className="h-3.5 w-3.5" />} title="You could add" tone="warn" items={current.couldAdd} />
              <FeedbackList icon={<TriangleAlert className="h-3.5 w-3.5" />} title="Check this" tone="bad" items={current.checkThis} />
            </div>
            {current.feedback ? (
              <p className="rounded-2xl border border-border/50 bg-surface/40 px-4 py-3 text-sm leading-relaxed">
                {current.feedback}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button onClick={() => void next()} className="cursor-pointer rounded-full px-6">
                {idx + 1 < questions.length ? "Next question" : "See results"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {error ? <p className="mt-4 text-center text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

export function BackBar({
  onExit,
  label,
  folderName,
}: {
  onExit: () => void;
  label: string;
  folderName: string;
}) {
  return (
    <button
      type="button"
      onClick={onExit}
      className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {folderName} · {label}
    </button>
  );
}

const TONES = {
  good: "border-emerald-400/30 bg-emerald-500/8 text-emerald-200",
  warn: "border-yellow/30 bg-yellow/8 text-yellow",
  bad: "border-red-400/30 bg-red-500/8 text-red-200",
} as const;

function FeedbackList({
  icon,
  title,
  tone,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  tone: keyof typeof TONES;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div className={cn("rounded-2xl border px-3.5 py-3", TONES[tone])}>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]">
        {icon}
        {title}
      </div>
      <ul className="space-y-1 text-xs leading-relaxed text-foreground/85">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
    </div>
  );
}

export function ResultList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: keyof typeof TONES;
  items: string[];
}) {
  return (
    <div className={cn("rounded-2xl border px-4 py-4 backdrop-blur-xl", TONES[tone])}>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]">{title}</div>
      {items.length ? (
        <ul className="space-y-1.5 text-xs leading-relaxed text-foreground/85">
          {items.map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Nothing here.</p>
      )}
    </div>
  );
}
