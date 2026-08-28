import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Clock,
  FileText,
  Plus,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecallFolder, RecallMaterial, RecallSession, RecallSubject } from "@/components/recall/types";
import type { FolderStats } from "@/hooks/useRecallStore";
import {
  ConfirmDelete,
  EmptyState,
  ModeChip,
  StatTile,
  relativeDay,
  scoreColor,
} from "@/components/recall/RecallShared";
import { cn } from "@/lib/utils";

type Props = {
  subject: RecallSubject;
  folder: RecallFolder;
  materials: RecallMaterial[];
  sessions: RecallSession[];
  stats: FolderStats;
  onBack: () => void;
  onAddMaterial: () => void;
  onDeleteMaterial: (id: string) => void;
  onStartQuickRecall: () => void;
  onStartBlurt: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSession?: (session: RecallSession) => void;
};

function ToolCard({
  tone,
  icon,
  title,
  blurb,
  points,
  cta,
  disabled,
  onClick,
}: {
  tone: "purple" | "yellow";
  icon: React.ReactNode;
  title: string;
  blurb: string;
  points: string[];
  cta: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const purple = tone === "purple";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card/60 p-6 backdrop-blur-xl transition-all duration-500",
        purple ? "border-primary/40 hover:border-primary/70" : "border-yellow/35 hover:border-yellow/60",
        disabled ? "opacity-60" : "hover:-translate-y-1",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity duration-500",
          purple ? "bg-primary/25" : "bg-yellow/15",
          "opacity-60 group-hover:opacity-100",
        )}
      />
      <div className="relative">
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl border",
            purple ? "border-primary/50 bg-primary/15 text-purple-200" : "border-yellow/40 bg-yellow/10 text-yellow",
          )}
        >
          {icon}
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
        <ul className="mt-4 space-y-1.5">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", purple ? "bg-primary" : "bg-yellow")} />
              {p}
            </li>
          ))}
        </ul>
        <Button
          onClick={onClick}
          disabled={disabled}
          className={cn("mt-5 w-full cursor-pointer rounded-full", !purple && "bg-yellow/90 text-black hover:bg-yellow")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {cta}
        </Button>
      </div>
    </div>
  );
}

export function FolderWorkspace({
  subject,
  folder,
  materials,
  sessions,
  stats,
  onBack,
  onAddMaterial,
  onDeleteMaterial,
  onStartQuickRecall,
  onStartBlurt,
  onDeleteSession,
  onOpenSession,
}: Props) {
  const [openMaterial, setOpenMaterial] = useState<string | null>(null);
  const noMaterials = materials.length === 0;

  return (
    <div className="space-y-7 fade-in-up">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {subject.emoji} {subject.name}
        </button>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{folder.name}</h2>
        <p className="text-sm text-muted-foreground">
          {materials.length} material{materials.length === 1 ? "" : "s"} · {stats.attempts} session
          {stats.attempts === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<Target className="h-3.5 w-3.5 text-primary" />}
          label="Mastery"
          value={stats.mastery == null ? "—" : <span className={scoreColor(stats.mastery)}>{stats.mastery}%</span>}
          hint={stats.attempts ? `over ${stats.attempts} sessions` : "no sessions yet"}
        />
        <StatTile
          icon={<Zap className="h-3.5 w-3.5 text-yellow" />}
          label="Quick Recall"
          value={stats.recallAvg == null ? "—" : `${stats.recallAvg}%`}
        />
        <StatTile
          icon={<Brain className="h-3.5 w-3.5 text-primary" />}
          label="Blurt"
          value={stats.blurtAvg == null ? "—" : `${stats.blurtAvg}%`}
        />
        <StatTile
          icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Last studied"
          value={stats.lastSessionAt ? relativeDay(stats.lastSessionAt) : "—"}
        />
      </div>

      {/* Materials */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Materials</h3>
          <Button size="sm" variant="outline" onClick={onAddMaterial} className="cursor-pointer rounded-full">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add material
          </Button>
        </div>

        {noMaterials ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No material in this folder yet"
            body="Drop in a PDF or paste your notes and Atlas will build recall tests straight from them."
            action={
              <Button onClick={onAddMaterial} className="cursor-pointer rounded-full">
                <Plus className="mr-1.5 h-4 w-4" /> Add material
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {materials.map((m) => {
              const open = openMaterial === m.id;
              return (
                <li
                  key={m.id}
                  className="rounded-2xl purple-outline bg-card/55 backdrop-blur-xl transition-colors hover:bg-card/70"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/12 text-primary">
                      {m.kind === "pdf" ? <FileText className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenMaterial(open ? null : m.id)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="truncate text-sm font-medium">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {m.kind.toUpperCase()} · {Math.round(m.content.length / 5)} words · added {relativeDay(m.created_at)}
                      </div>
                    </button>
                    <ConfirmDelete label="material" onConfirm={() => onDeleteMaterial(m.id)} />
                  </div>
                  {open ? (
                    <div className="max-h-64 overflow-auto border-t border-border/50 px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {m.content.slice(0, 6000)}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Tools */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Study tools</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <ToolCard
            tone="yellow"
            icon={<Zap className="h-5 w-5" />}
            title="Quick Recall"
            blurb="Atlas writes questions from your material and marks every answer."
            points={["15 AI-generated questions", "Instant feedback per answer", "Session summary and gaps"]}
            cta="Start Quick Recall"
            disabled={noMaterials}
            onClick={onStartQuickRecall}
          />
          <ToolCard
            tone="purple"
            icon={<Brain className="h-5 w-5" />}
            title="Blurt"
            blurb="Dump everything you remember, then see exactly what you missed."
            points={["Optional 5:00 timer", "Coverage score", "Improvement vs your last blurt"]}
            cta="Start Blurt"
            disabled={noMaterials}
            onClick={onStartBlurt}
          />
        </div>
      </section>

      {/* History */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Session history</h3>
        {sessions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-surface/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No sessions yet — your results will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-2xl purple-outline bg-card/55 px-4 py-3 backdrop-blur-xl transition-all duration-300 hover:bg-card/70"
              >
                <button
                  type="button"
                  onClick={() => onOpenSession?.(s)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                >
                  <ModeChip mode={s.mode} />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {relativeDay(s.created_at)}
                  </span>
                  <span className={cn("text-sm font-semibold tabular-nums", scoreColor(s.score))}>{s.score}%</span>
                </button>
                <ConfirmDelete label="session" onConfirm={() => onDeleteSession(s.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {stats.needsReview.length ? (
        <section className="rounded-2xl border border-yellow/30 bg-yellow/6 px-5 py-4 backdrop-blur-xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow">Needs review</div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {stats.needsReview.map((c) => (
              <span key={c} className="rounded-full border border-yellow/35 bg-yellow/10 px-2.5 py-1 text-[11px] text-yellow">
                {c}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
