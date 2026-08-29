import { useState } from "react";
import { ArrowLeft, BookOpen, FolderOpen, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/EmojiPicker";
import type { RecallFolder, RecallSubject } from "@/components/recall/types";
import type { FolderStats, SubjectStats } from "@/hooks/useRecallStore";
import { ConfirmDelete, EmptyState, relativeDay, scoreColor } from "@/components/recall/RecallShared";
import { cn } from "@/lib/utils";

/* ------------------------------ Subject grid ----------------------------- */

export function SubjectLibrary({
  subjects,
  statsFor,
  onOpen,
  onCreate,
  onRename,
  onDelete,
}: {
  subjects: RecallSubject[];
  statsFor: (subjectId: string) => SubjectStats;
  onOpen: (id: string) => void;
  onCreate: (name: string, emoji: string) => void;
  onRename: (id: string, name: string, emoji?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📘");
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), emoji);
    setName("");
    setEmoji("📘");
    setAdding(false);
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Subject library</h2>
          <p className="text-sm text-muted-foreground">Pick a subject, then a folder of material to study.</p>
        </div>
        <Button onClick={() => setAdding((v) => !v)} className="cursor-pointer rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          New subject
        </Button>
      </div>

      {adding ? (
        <div className="relative flex flex-wrap items-center gap-2 rounded-2xl purple-outline bg-card/60 px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setPickerFor(pickerFor === "new" ? null : "new")}
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-primary/40 bg-surface/60 text-xl"
          >
            {emoji}
          </button>
          {pickerFor === "new" ? (
            <div className="relative">
              <EmojiPicker
                onPick={(c) => {
                  setEmoji(c);
                  setPickerFor(null);
                }}
                onClose={() => setPickerFor(null)}
              />
            </div>
          ) : null}
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Subject name (e.g. Biology)"
            className="min-w-[220px] flex-1 rounded-xl border border-border/60 bg-surface/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <Button onClick={submit} className="cursor-pointer rounded-full">
            Add
          </Button>
        </div>
      ) : null}

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No subjects yet"
          body="Create your first subject to start building recall folders and material."
          action={
            <Button onClick={() => setAdding(true)} className="cursor-pointer rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              New subject
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const st = statsFor(s.id);
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(s.id);
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-3xl purple-outline bg-card/60 p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/60"
              >
                <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary/20 opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-2xl">{s.emoji}</span>
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold tracking-tight">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {st.folders} folders · {st.materials} materials
                      </div>
                    </div>
                  </div>
                  <ConfirmDelete onConfirm={() => onDelete(s.id)} label={s.name} />
                </div>
                <div className="relative mt-5 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Mastery</div>
                    <div className={cn("text-2xl font-semibold tabular-nums", scoreColor(st.mastery ?? 0))}>
                      {st.mastery == null ? "—" : `${st.mastery}%`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = window.prompt("Rename subject", s.name);
                      if (next && next.trim()) onRename(s.id, next.trim());
                    }}
                    className="cursor-pointer rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    Rename
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Folder list ----------------------------- */

export function FolderList({
  subject,
  folders,
  statsFor,
  onBack,
  onOpen,
  onCreate,
  onRename,
  onDelete,
}: {
  subject: RecallSubject;
  folders: RecallFolder[];
  statsFor: (folderId: string) => FolderStats;
  onBack: () => void;
  onOpen: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All subjects
        </button>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight">
          <span className="text-2xl">{subject.emoji}</span>
          {subject.name}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl purple-outline bg-card/60 px-4 py-3 backdrop-blur-xl">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="New folder (e.g. Module 5 — Heredity)"
          className="min-w-[220px] flex-1 rounded-xl border border-border/60 bg-surface/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <Button onClick={submit} className="cursor-pointer rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Add folder
        </Button>
      </div>

      {folders.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-6 w-6" />}
          title="No folders yet"
          body="Folders group your notes and PDFs into a single study set."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => {
            const st = statsFor(f.id);
            return (
              <div
                key={f.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(f.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(f.id);
                  }
                }}
                className="group cursor-pointer rounded-3xl purple-outline bg-card/60 p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-base font-semibold tracking-tight">{f.name}</span>
                  </div>
                  <ConfirmDelete onConfirm={() => onDelete(f.id)} label={f.name} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {st.materials} materials · {st.attempts} sessions
                  {st.lastSessionAt ? ` · ${relativeDay(st.lastSessionAt)}` : ""}
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Mastery</div>
                    <div className={cn("text-2xl font-semibold tabular-nums", scoreColor(st.mastery ?? 0))}>
                      {st.mastery == null ? "—" : `${st.mastery}%`}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] text-purple-200">
                    <Sparkles className="h-3 w-3" />
                    Study
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = window.prompt("Rename folder", f.name);
                    if (next && next.trim()) onRename(f.id, next.trim());
                  }}
                  className="mt-3 cursor-pointer text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Rename
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
