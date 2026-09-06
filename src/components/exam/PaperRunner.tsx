import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gradeAnswer, type GradeResult } from "@/lib/exam.functions";
import type { Paper, Question } from "./types";
import { pct } from "./types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { MathMarkdown } from "@/components/MathMarkdown";
import { RecallMascot, type MascotMood } from "@/components/recall/RecallMascot";
import { GlassModal, LoadingStages, ResumeBanner, ScoreRing } from "@/components/recall/RecallShared";
import { clearDraft, readDraft, useAutosaveDraft } from "@/hooks/useRecallDraft";
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CircleCheck,
  CircleX,
  Clock3,
  ListChecks,
  Pause,
  Play,
  Sparkles,
  TimerOff,
  Trophy,
} from "lucide-react";

type Graded = GradeResult & { correct?: boolean };
type ExamDraft = {
  attemptId: string;
  idx: number;
  responses: Record<string, string>;
  choices: Record<string, number>;
  results: Record<string, Graded>;
  timerOn: boolean;
  timerPaused: boolean;
  secondsLeft: number;
  timerTotal: number;
};

type Props = {
  paper: Paper;
  userId: string;
  onExit: () => void;
  onFinished: () => void;
};

const TIMER_OPTIONS = [30, 60, 90, 120];

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours > 0
    ? `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${mins}:${String(secs).padStart(2, "0")}`;
}

export function PaperRunner({ paper, userId, onExit, onFinished }: Props) {
  const queryClient = useQueryClient();
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
  const [pendingDraft, setPendingDraft] = useState<ExamDraft | null>(null);
  const [timerOn, setTimerOn] = useState(false);
  const [timerPaused, setTimerPaused] = useState(true);
  const [timerTotal, setTimerTotal] = useState(60 * 60);
  const [secondsLeft, setSecondsLeft] = useState(60 * 60);
  const [timeUp, setTimeUp] = useState(false);

  const createAttempt = useCallback(
    async (list: Question[]) => {
      const { data: attempt, error } = await supabase
        .from("exam_attempts")
        .insert({
          user_id: userId,
          paper_id: paper.id,
          paper_title: paper.title,
          subject: paper.subject,
          total_marks: list.reduce((sum, question) => sum + question.marks, 0),
        })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        return null;
      }
      const id = (attempt as { id?: string } | null)?.id ?? null;
      setAttemptId(id);
      return id;
    },
    [paper.id, paper.subject, paper.title, userId],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: rows, error } = await supabase
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
      const list = (rows ?? []) as unknown as Question[];
      setQuestions(list);
      const draft = readDraft<ExamDraft>("paper_runner", paper.id);
      if (draft?.attemptId) {
        setPendingDraft(draft);
        setLoading(false);
        return;
      }
      await createAttempt(list);
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [createAttempt, paper.id]);

  const q = questions[idx];
  const totalMarks = useMemo(() => questions.reduce((sum, item) => sum + item.marks, 0), [questions]);
  const awarded = useMemo(() => Object.values(results).reduce((sum, result) => sum + result.awarded, 0), [results]);
  const answeredCount = Object.keys(results).length;

  const draft = useMemo<ExamDraft | null>(
    () =>
      attemptId && !done
        ? { attemptId, idx, responses, choices, results, timerOn, timerPaused, secondsLeft, timerTotal }
        : null,
    [attemptId, choices, done, idx, responses, results, secondsLeft, timerOn, timerPaused, timerTotal],
  );
  const hasStarted = idx > 0 || timerOn || Object.keys(responses).length > 0 || Object.keys(choices).length > 0 || Object.keys(results).length > 0;
  useAutosaveDraft("paper_runner", paper.id, draft, Boolean(attemptId && !pendingDraft && !done && hasStarted));

  useEffect(() => {
    if (!timerOn || timerPaused || done || timeUp) return;
    const tick = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(tick);
          setTimeUp(true);
          setTimerPaused(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [done, timeUp, timerOn, timerPaused]);

  async function restartDraft() {
    const staleId = pendingDraft?.attemptId;
    clearDraft("paper_runner", paper.id);
    setPendingDraft(null);
    setIdx(0);
    setResponses({});
    setChoices({});
    setResults({});
    setTimerOn(false);
    setTimerPaused(true);
    setTimerTotal(60 * 60);
    setSecondsLeft(60 * 60);
    if (staleId) await supabase.from("exam_attempts").delete().eq("id", staleId).is("completed_at", null);
    await createAttempt(questions);
  }

  function resumeDraft() {
    const saved = pendingDraft;
    if (!saved) return;
    setAttemptId(saved.attemptId);
    setIdx(Math.min(saved.idx, Math.max(questions.length - 1, 0)));
    setResponses(saved.responses ?? {});
    setChoices(saved.choices ?? {});
    setResults(saved.results ?? {});
    setTimerOn(saved.timerOn ?? false);
    setTimerPaused(saved.timerPaused ?? true);
    setTimerTotal(saved.timerTotal || 60 * 60);
    setSecondsLeft(saved.secondsLeft ?? saved.timerTotal ?? 60 * 60);
    setPendingDraft(null);
  }

  function chooseTimer(minutes: number) {
    const seconds = minutes * 60;
    setTimerTotal(seconds);
    setSecondsLeft(seconds);
    setTimerOn(true);
    setTimerPaused(false);
    setTimeUp(false);
  }

  async function persist(question: Question, response: string, result: Graded) {
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
      awarded: result.awarded,
      max_marks: question.marks,
      feedback: result.feedback,
      missing_keywords: result.missingKeywords,
      exemplar: result.exemplar,
      is_mistake: result.awarded < question.marks * 0.6,
    });
  }

  async function submitCurrent() {
    if (!q) return;
    if (q.qtype === "mcq") {
      const picked = choices[q.id];
      if (picked === undefined) return toast.error("Pick an answer first");
      const correct = picked === q.correct_option;
      const result: Graded = {
        awarded: correct ? q.marks : 0,
        maxMarks: q.marks,
        band: correct ? "Correct" : "Review",
        strengths: correct ? ["Correct option selected"] : [],
        missingKeywords: correct ? [] : [q.topic ?? "Review this concept"],
        improvements: correct ? [] : [`Revisit ${q.topic ?? "this topic"}`],
        feedback: q.criteria ?? (correct ? "Well done." : "Review the marking note for this question."),
        exemplar: q.exemplar ?? (q.options[q.correct_option ?? 0] ?? ""),
        correct,
      };
      setResults((current) => ({ ...current, [q.id]: result }));
      void persist(q, q.options[picked] ?? "", result);
      return;
    }

    const answer = (responses[q.id] ?? "").trim();
    if (answer.length < 5) return toast.error("Write a response before marking");
    setGrading(true);
    try {
      const result = await gradeAnswer({
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
      setResults((current) => ({ ...current, [q.id]: result }));
      void persist(q, answer, result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Marking failed");
    } finally {
      setGrading(false);
    }
  }

  async function finish() {
    if (attemptId) {
      await supabase
        .from("exam_attempts")
        .update({ completed_at: new Date().toISOString(), awarded_marks: awarded, total_marks: totalMarks })
        .eq("id", attemptId);
      await awardXp("pastPaper");
      if (totalMarks > 0 && awarded / totalMarks >= 0.9) await awardXp("quiz");
      await queryClient.invalidateQueries({ queryKey: ["stat-attempts", userId] });
    }
    clearDraft("paper_runner", paper.id);
    setTimerPaused(true);
    setTimeUp(false);
    setDone(true);
    onFinished();
  }

  if (loading) {
    return (
      <div className="glass-panel min-h-72">
        <LoadingStages title="Preparing your paper" stages={["Loading questions", "Setting up your answer space", "Ready for the climb"]} />
      </div>
    );
  }

  if (pendingDraft) {
    return (
      <div className="space-y-5">
        <ResumeBanner
          title="Your unfinished paper is safe"
          detail={`Resume at question ${Math.min(pendingDraft.idx + 1, questions.length)} with ${Object.keys(pendingDraft.results).length} marked.`}
          onResume={resumeDraft}
          onDiscard={() => void restartDraft()}
        />
        <div className="glass-panel p-8 text-center">
          <RecallMascot mood="encourage" size={84} label="Ready when you are." />
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="glass-panel p-8 text-center">
        <p className="text-sm text-muted-foreground">This paper has no questions yet.</p>
        <Button onClick={onExit} variant="outline" className="mt-4">Back to library</Button>
      </div>
    );
  }

  if (done) return <Summary paper={paper} awarded={awarded} total={totalMarks} results={results} onExit={onExit} />;

  const result = results[q.id];
  const progress = pct(idx + (result ? 1 : 0), questions.length);
  const ratio = result ? result.awarded / Math.max(1, q.marks) : null;
  const mood: MascotMood = grading ? "thinking" : ratio == null ? "idle" : ratio >= 0.85 ? "celebrate" : ratio >= 0.55 ? "happy" : "encourage";
  const typeMeta = q.qtype === "mcq"
    ? { label: "Multiple choice", icon: <ListChecks className="h-3.5 w-3.5" /> }
    : q.qtype === "extended"
      ? { label: "Extended response", icon: <AlignLeft className="h-3.5 w-3.5" /> }
      : { label: "Short answer", icon: <Brain className="h-3.5 w-3.5" /> };

  return (
    <div className="space-y-5">
      <section className="glass-panel relative overflow-hidden p-5">
        <div className="shimmer-line absolute inset-x-0 top-0 h-px" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" onClick={onExit} className="mb-1 -ml-3 gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Exit paper
            </Button>
            <h2 className="truncate text-base font-semibold tracking-tight">{paper.title}</h2>
            <p className="text-xs text-primary">{paper.subject} · Question {idx + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <RecallMascot mood={mood} size={54} />
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums gradient-text">{awarded}<span className="text-sm text-muted-foreground">/{totalMarks}</span></p>
              <p className="section-label">{answeredCount} marked</p>
            </div>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
          {!timerOn ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="section-label flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Optional timer</span>
              {TIMER_OPTIONS.map((minutes) => (
                <Button key={minutes} variant="outline" size="sm" onClick={() => chooseTimer(minutes)}>{minutes}m</Button>
              ))}
            </div>
          ) : (
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className={cn("rounded-xl border px-3 py-2 font-mono text-lg font-semibold tabular-nums", secondsLeft <= 300 ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-primary/35 bg-primary/10 text-foreground")}>{formatTime(secondsLeft)}</div>
              <div className="min-w-32 flex-1 overflow-hidden rounded-full bg-surface">
                <div className={cn("h-1.5 rounded-full transition-[width] duration-700", secondsLeft <= 300 ? "bg-destructive" : "bg-primary")} style={{ width: `${(secondsLeft / Math.max(1, timerTotal)) * 100}%` }} />
              </div>
              <Button variant="outline" size="sm" onClick={() => setTimerPaused((value) => !value)}>
                {timerPaused ? <Play /> : <Pause />} {timerPaused ? "Resume" : "Pause"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setTimerOn(false); setTimerPaused(true); }}><TimerOff /> Untimed</Button>
            </div>
          )}
        </div>
      </section>

      <section key={q.id} className="glass-panel fade-in-up p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-primary">{typeMeta.icon}{typeMeta.label}</span>
          <span className="rounded-full border border-yellow/40 bg-yellow/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-yellow">{q.marks} {q.marks === 1 ? "mark" : "marks"}</span>
          {q.topic ? <span className="text-[11px] text-muted-foreground">{q.topic}</span> : null}
        </div>

        <MathMarkdown className="text-[15px] leading-relaxed text-foreground">{q.prompt}</MathMarkdown>

        <div className="mt-6">
          {q.qtype === "mcq" ? (
            <div className="grid gap-2">
              {q.options.map((option, optionIdx) => {
                const picked = choices[q.id] === optionIdx;
                const isCorrect = Boolean(result) && optionIdx === q.correct_option;
                const isWrongPick = Boolean(result) && picked && optionIdx !== q.correct_option;
                return (
                  <Button
                    key={optionIdx}
                    type="button"
                    variant="outline"
                    disabled={Boolean(result)}
                    onClick={() => setChoices((current) => ({ ...current, [q.id]: optionIdx }))}
                    className={cn("interactive-glass h-auto min-h-12 w-full justify-start whitespace-normal p-3.5 text-left", isCorrect && "border-emerald-400/60 bg-emerald-400/10", isWrongPick && "border-destructive/60 bg-destructive/10", picked && !result && "border-primary bg-primary/12")}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-[11px]">{String.fromCharCode(65 + optionIdx)}</span>
                    <MathMarkdown className="min-w-0 flex-1">{option}</MathMarkdown>
                    {isCorrect ? <CircleCheck className="text-emerald-400" /> : null}
                    {isWrongPick ? <CircleX className="text-destructive" /> : null}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="relative">
              <Textarea
                value={responses[q.id] ?? ""}
                disabled={Boolean(result)}
                onChange={(event) => setResponses((current) => ({ ...current, [q.id]: event.target.value }))}
                placeholder={q.qtype === "extended" ? "Build your extended response — thesis, evidence, analysis and judgement…" : "Write a concise, mark-focused response…"}
                className={cn("resize-y bg-surface/45 text-sm leading-relaxed", q.qtype === "extended" ? "min-h-[280px]" : "min-h-[160px]")}
              />
              <span className="absolute bottom-3 right-3 text-[10px] tabular-nums text-muted-foreground">{(responses[q.id] ?? "").trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
          )}
        </div>

        {grading ? <LoadingStages title="Atlas is marking" stages={["Reading your response", "Checking the criteria", "Building precise feedback"]} /> : null}
        {result && !grading ? <Feedback result={result} marks={q.marks} /> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx((value) => Math.max(0, value - 1))}><ArrowLeft /> Previous</Button>
          {!result ? (
            <Button onClick={submitCurrent} disabled={grading}><Sparkles /> Mark my answer</Button>
          ) : idx < questions.length - 1 ? (
            <Button onClick={() => setIdx((value) => value + 1)}>Next question <ArrowRight /></Button>
          ) : (
            <Button onClick={() => void finish()}><Trophy /> Finish paper</Button>
          )}
        </div>
      </section>

      <nav className="glass-panel flex flex-wrap gap-2 p-3" aria-label="Paper questions">
        {questions.map((item, questionIdx) => {
          const answer = results[item.id];
          const state = !answer ? "border-border text-muted-foreground" : answer.awarded >= item.marks * 0.8 ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300" : answer.awarded >= item.marks * 0.5 ? "border-yellow/60 bg-yellow/10 text-yellow" : "border-destructive/60 bg-destructive/10 text-destructive";
          return (
            <Button key={item.id} variant="outline" size="icon" onClick={() => setIdx(questionIdx)} className={cn("h-8 w-8 rounded-lg", state, questionIdx === idx && "ring-2 ring-primary/60")}>{questionIdx + 1}</Button>
          );
        })}
      </nav>

      {timeUp ? (
        <GlassModal title="Time’s up" subtitle="Your answers are safe." onClose={() => undefined} maxWidth="max-w-md">
          <div className="text-center">
            <RecallMascot mood="encourage" size={96} label="Nice work — choose how you want to finish." />
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => { setTimerOn(false); setTimeUp(false); }}>Continue untimed</Button>
              <Button onClick={() => void finish()}><Trophy /> Finish paper</Button>
            </div>
          </div>
        </GlassModal>
      ) : null}
    </div>
  );
}

function Feedback({ result, marks }: { result: Graded; marks: number }) {
  const ratio = marks ? result.awarded / marks : 0;
  const verdict = ratio >= 0.8 ? "Strong response" : ratio >= 0.5 ? "Building" : "Review next";
  const tone = ratio >= 0.8 ? "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" : ratio >= 0.5 ? "text-yellow border-yellow/40 bg-yellow/10" : "text-destructive border-destructive/40 bg-destructive/10";
  return (
    <div className="fade-in-up mt-6 space-y-5 rounded-2xl border border-border/70 bg-surface/45 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">Marker feedback</p>
          <span className={cn("mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>{verdict}</span>
        </div>
        <p className={cn("text-2xl font-semibold tabular-nums", tone.split(" ")[0])}>{result.awarded}<span className="text-sm text-muted-foreground">/{marks}</span>{result.band ? <span className="ml-2 text-xs text-muted-foreground">{result.band}</span> : null}</p>
      </div>
      {result.feedback ? <MathMarkdown className="text-sm leading-relaxed text-muted-foreground">{result.feedback}</MathMarkdown> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {result.strengths.length ? <FeedbackList title="What worked" items={result.strengths} tone="good" /> : null}
        {result.improvements.length ? <FeedbackList title="Next improvements" items={result.improvements} tone="focus" /> : null}
      </div>
      {result.missingKeywords.length ? (
        <div><p className="section-label mb-2">Missing syllabus ideas</p><div className="flex flex-wrap gap-1.5">{result.missingKeywords.map((keyword) => <span key={keyword} className="rounded-full border border-yellow/40 bg-yellow/10 px-2.5 py-1 text-[11px] text-yellow">{keyword}</span>)}</div></div>
      ) : null}
      {result.exemplar ? (
        <details className="interactive-glass group rounded-xl p-4"><summary className="cursor-pointer text-xs font-semibold text-primary">View full-mark exemplar</summary><MathMarkdown className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.exemplar}</MathMarkdown></details>
      ) : null}
    </div>
  );
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: "good" | "focus" }) {
  return (
    <div className="interactive-glass rounded-xl p-4">
      <p className="section-label mb-2">{title}</p>
      <ul className="space-y-2">{items.map((item, itemIdx) => <li key={`${item}-${itemIdx}`} className="flex items-start gap-2 text-sm text-muted-foreground">{tone === "good" ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}<span>{item}</span></li>)}</ul>
    </div>
  );
}

function Summary({ paper, awarded, total, results, onExit }: { paper: Paper; awarded: number; total: number; results: Record<string, Graded>; onExit: () => void }) {
  const percentage = pct(awarded, total);
  const weak = Object.values(results).filter((result) => result.awarded < result.maxMarks * 0.6).length;
  return (
    <div className="glass-panel fade-in-up p-8 text-center">
      <RecallMascot mood={percentage >= 80 ? "celebrate" : percentage >= 50 ? "happy" : "encourage"} size={100} />
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Paper complete</h2>
      <p className="mt-1 text-sm text-muted-foreground">{paper.title}</p>
      <div className="mt-5"><ScoreRing value={percentage} label="score" /></div>
      <p className="mt-2 text-sm text-muted-foreground">{awarded} of {total} marks</p>
      {weak > 0 ? <p className="mt-4 text-sm text-yellow">{weak} {weak === 1 ? "question" : "questions"} added to your Mistake Vault for revision.</p> : null}
      <Button onClick={onExit} className="mt-6">Back to library</Button>
    </div>
  );
}
