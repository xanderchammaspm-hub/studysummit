import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyseBlurt, type BlurtAnalysis } from "@/lib/recall.functions";
import type { BlurtPayload, RecallMaterial } from "@/components/recall/types";
import { LoadingStages, ScoreRing } from "@/components/recall/RecallShared";
import { MaterialPicker } from "@/components/recall/QuickRecallRunner";
import { RecallMascot, type MascotMood } from "@/components/recall/RecallMascot";
import { cn } from "@/lib/utils";

type Props = {
  subjectName: string;
  folderName: string;
  materials: RecallMaterial[];
  previous?: BlurtPayload | null;
  onExit: () => void;
  onComplete: (score: number, payload: BlurtPayload) => Promise<void> | void;
};

type Stage = "select" | "write" | "analysing" | "results";

const TIMER_SECONDS = 300;

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ConceptList({
  title,
  items,
  tone,
  icon,
}: {
  title: string;
  items: string[];
  tone: "good" | "warn" | "bad";
  icon: React.ReactNode;
}) {
  if (!items.length) return null;
  const toneClass =
    tone === "good"
      ? "border-emerald-400/35 bg-emerald-500/8"
      : tone === "warn"
        ? "border-yellow/35 bg-yellow/8"
        : "border-red-400/35 bg-red-500/8";
  const chipClass =
    tone === "good"
      ? "border-emerald-400/40 bg-emerald-500/12 text-emerald-200"
      : tone === "warn"
        ? "border-yellow/40 bg-yellow/10 text-yellow"
        : "border-red-400/40 bg-red-500/12 text-red-200";
  return (
    <div className={cn("rounded-2xl border px-4 py-3.5 backdrop-blur-xl", toneClass)}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {items.map((c) => (
          <span key={c} className={cn("rounded-full border px-2.5 py-1 text-[11px]", chipClass)}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BlurtRunner({ subjectName, folderName, materials, previous, onExit, onComplete }: Props) {
  const [stage, setStage] = useState<Stage>("select");
  const [selected, setSelected] = useState<string[]>(materials.map((m) => m.id));
  const [blurt, setBlurt] = useState("");
  const [analysis, setAnalysis] = useState<BlurtAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timerOn, setTimerOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(TIMER_SECONDS);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          window.clearInterval(id);
          setRunning(false);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const source = useMemo(
    () =>
      materials
        .filter((m) => selected.includes(m.id))
        .map((m) => `### ${m.name}\n${m.content}`)
        .join("\n\n")
        .slice(0, 38000),
    [materials, selected],
  );

  const words = blurt.trim() ? blurt.trim().split(/\s+/).length : 0;
  const prevCoverage = previous?.analysis?.coverage ?? null;
  const delta = analysis && prevCoverage != null ? analysis.coverage - prevCoverage : null;

  const mood: MascotMood =
    stage === "analysing"
      ? "thinking"
      : analysis
        ? analysis.coverage >= 70
          ? "celebrate"
          : "encourage"
        : "idle";

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function start() {
    setBlurt("");
    setAnalysis(null);
    setError(null);
    setLeft(TIMER_SECONDS);
    setRunning(timerOn);
    setStage("write");
    window.setTimeout(() => areaRef.current?.focus(), 120);
  }

  async function submit() {
    if (blurt.trim().length < 5) {
      setError("Write a little more before Atlas analyses it.");
      return;
    }
    setRunning(false);
    setError(null);
    setStage("analysing");
    try {
      const res = await analyseBlurt({
        data: {
          subject: subjectName,
          topic: folderName,
          source,
          blurt: blurt.trim(),
          ...(previous ? { previous: (previous.analysis?.remembered ?? []).join(", ").slice(0, 3900) } : {}),
        },
      });
      setAnalysis(res);
      setStage("results");
      await onComplete(res.coverage, {
        kind: "blurt",
        materials: materials.filter((m) => selected.includes(m.id)).map((m) => m.name),
        blurt: blurt.trim(),
        analysis: res,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Atlas couldn't analyse that. Try again.");
      setStage("write");
    }
  }

  /* --------------------------------- Views -------------------------------- */

  if (stage === "select") {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {folderName}
        </button>
        <MaterialPicker
          title="Blurt — what will you dump from memory?"
          materials={materials}
          selected={selected}
          toggle={toggle}
          selectAll={() => setSelected(selected.length === materials.length ? [] : materials.map((m) => m.id))}
          onStart={start}
          cta="Start blurting"
        />
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 rounded-2xl purple-outline bg-card/50 px-4 py-3 text-xs text-muted-foreground backdrop-blur-xl">
          <Clock className="h-4 w-4 text-yellow" />
          <span>Optional 5:00 timer</span>
          <button
            type="button"
            onClick={() => setTimerOn((v) => !v)}
            className={cn(
              "relative h-6 w-11 rounded-full border transition-colors duration-300 cursor-pointer",
              timerOn ? "border-primary/70 bg-primary/60" : "border-border/70 bg-surface/60",
            )}
            aria-pressed={timerOn}
            aria-label="Toggle 5 minute timer"
          >
            <span
              className={cn(
                "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white/90 transition-all duration-300",
                timerOn ? "left-[22px]" : "left-0.5",
              )}
              style={{ height: 18, width: 18 }}
            />
          </button>
        </div>
      </div>
    );
  }

  if (stage === "analysing") {
    return (
      <div className="space-y-6">
        <RecallMascot mood={mood} />
        <LoadingStages
          title="Atlas is reading your blurt"
          stages={["Reading your brain dump", "Matching it against your material", "Finding the gaps", "Writing feedback"]}
        />
      </div>
    );
  }

  if (stage === "write") {
    const low = left <= 30;
    return (
      <div className="mx-auto max-w-4xl space-y-4 fade-in-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Exit blurt
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{words} words</span>
            {timerOn ? (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors",
                  low ? "border-red-400/60 bg-red-500/12 text-red-300" : "border-primary/50 bg-primary/10 text-purple-200",
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                {mmss(left)}
                <button
                  type="button"
                  onClick={() => setRunning((v) => !v)}
                  className="ml-1 cursor-pointer text-muted-foreground hover:text-foreground"
                  aria-label={running ? "Pause timer" : "Resume timer"}
                >
                  {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {timerOn ? (
          <div className="h-1 overflow-hidden rounded-full bg-surface/60">
            <div
              className={cn("h-full rounded-full transition-[width] duration-1000 ease-linear", low ? "bg-red-400" : "bg-primary")}
              style={{ width: `${(left / TIMER_SECONDS) * 100}%` }}
            />
          </div>
        ) : null}

        <div className="rounded-3xl purple-outline bg-card/60 p-1.5 backdrop-blur-xl">
          <textarea
            ref={areaRef}
            value={blurt}
            onChange={(e) => setBlurt(e.target.value)}
            placeholder={`Everything you remember about ${folderName} — no notes, no peeking. Structure it however it comes out.`}
            className="min-h-[42vh] w-full resize-y rounded-[1.35rem] bg-transparent px-5 py-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {error ? (
          <p className="flex items-center gap-2 text-xs text-red-300">
            <TriangleAlert className="h-3.5 w-3.5" /> {error}
          </p>
        ) : null}

        <div className="flex justify-center">
          <Button size="lg" onClick={submit} className="cursor-pointer rounded-full px-8">
            <Sparkles className="mr-2 h-4 w-4" /> Analyse my blurt
          </Button>
        </div>
      </div>
    );
  }

  /* --------------------------------- Results ------------------------------- */

  if (!analysis) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-5 fade-in-up">
      <div className="flex flex-col items-center gap-4 rounded-3xl purple-outline bg-card/60 px-6 py-8 backdrop-blur-xl">
        <RecallMascot mood={mood} />
        <ScoreRing value={analysis.coverage} label="Coverage" size={148} />
        {delta != null ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
              delta > 0
                ? "border-emerald-400/50 bg-emerald-500/12 text-emerald-300"
                : delta < 0
                  ? "border-red-400/50 bg-red-500/12 text-red-300"
                  : "border-border/60 bg-surface/50 text-muted-foreground",
            )}
          >
            <TrendingUp className={cn("h-3.5 w-3.5", delta < 0 && "rotate-180")} />
            {delta > 0 ? `+${delta}%` : `${delta}%`} vs your last blurt ({prevCoverage}%)
          </div>
        ) : null}
        {analysis.summary ? (
          <p className="max-w-xl text-center text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ConceptList title="Remembered" items={analysis.remembered} tone="good" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <ConceptList title="Missing" items={analysis.missing} tone="warn" icon={<Brain className="h-3.5 w-3.5" />} />
        <ConceptList title="Needs correcting" items={analysis.incorrect} tone="bad" icon={<TriangleAlert className="h-3.5 w-3.5" />} />
        <ConceptList title="Strongest areas" items={analysis.strongest} tone="good" icon={<Sparkles className="h-3.5 w-3.5" />} />
      </div>

      {analysis.revise.length ? (
        <div className="rounded-2xl purple-outline bg-card/60 px-5 py-4 backdrop-blur-xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Revise next, in order</div>
          <ol className="mt-3 space-y-2">
            {analysis.revise.map((r, i) => (
              <li key={r} className="flex items-start gap-3 text-sm">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-primary/50 bg-primary/15 text-[10px] font-semibold text-purple-200">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onExit} className="cursor-pointer rounded-full">
          Back to {folderName}
        </Button>
        <Button
          onClick={() => {
            setAnalysis(null);
            setStage("select");
          }}
          className="cursor-pointer rounded-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Blurt again
        </Button>
      </div>
    </div>
  );
}
