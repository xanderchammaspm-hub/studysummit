import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BookOpen, Check, FolderOpen, Palette, Pencil, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/EmojiPicker";
import type { RecallFolder, RecallSubject } from "@/components/recall/types";
import type { FolderStats, SubjectStats } from "@/hooks/useRecallStore";
import { ConfirmDelete, EmptyState, relativeDay, scoreColor } from "@/components/recall/RecallShared";
import { cn } from "@/lib/utils";

/* ------------------------------- Theming --------------------------------- */

export const SUBJECT_SWATCHES = [
  "#a855f7",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#fde047",
  "#f59e0b",
  "#fb7185",
  "#ec4899",
  "#f5f3ff",
] as const;

const DEFAULT_COLOR = "#a855f7";

/** Glossy gradient surface derived from a subject's chosen colour. */
export function subjectSurface(color?: string | null) {
  const c = color || DEFAULT_COLOR;
  return {
    backgroundImage: `linear-gradient(150deg, color-mix(in oklab, ${c} 26%, transparent) 0%, color-mix(in oklab, ${c} 8%, transparent) 42%, transparent 78%)`,
    borderColor: `color-mix(in oklab, ${c} 45%, transparent)`,
    boxShadow: `0 24px 60px -38px ${c}, inset 0 1px 0 0 color-mix(in oklab, white 14%, transparent)`,
  } as React.CSSProperties;
}

function ColorPicker({
  value,
  onPick,
  onClose,
}: {
  value: string;
  onPick: (c: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <button className="fixed inset-0 z-40 cursor-default" onClick={onClose} tabIndex={-1} aria-label="Close colours" />
      <div className="absolute left-0 z-50 w-72 max-w-full rounded-2xl border border-primary/25 bg-popover/90 p-3 shadow-[0_24px_60px_-30px_var(--primary)] backdrop-blur-2xl">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Subject colour</div>
        <div className="grid grid-cols-6 gap-2">
          {SUBJECT_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              style={{ background: `linear-gradient(140deg, ${c}, color-mix(in oklab, ${c} 45%, #1a1030))` }}
              className={cn(
                "grid h-7 w-7 cursor-pointer place-items-center rounded-lg ring-offset-2 ring-offset-transparent transition-transform hover:scale-110",
                value.toLowerCase() === c.toLowerCase() && "ring-2 ring-white/70",
              )}
              aria-label={`Use ${c}`}
            >
              {value.toLowerCase() === c.toLowerCase() ? <Check className="h-3.5 w-3.5 text-white" /> : null}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          Custom
          <input
            type="color"
            value={value}
            onChange={(e) => onPick(e.target.value)}
            className="h-7 w-12 cursor-pointer rounded-md border border-border/60 bg-transparent"
          />
        </label>
      </div>
    </>
  );
}

/** Renders a picker in a top-level overlay so card overflow never clips it. */
function PickerModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-background/70 px-4 pb-10 pt-20 backdrop-blur-sm sm:pt-28"
      onClick={onClose}
    >
      <div className="relative w-72 max-w-full" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------ Subject grid ----------------------------- */

export function SubjectLibrary({
  subjects,
  statsFor,
  onOpen,
  onCreate,
  onUpdate,
  onDelete,
}: {
  subjects: RecallSubject[];
  statsFor: (subjectId: string) => SubjectStats;
  onOpen: (id: string) => void;
  onCreate: (name: string, emoji: string, color: string) => void;
  onUpdate: (id: string, patch: { name?: string; emoji?: string; color?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📘");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [panel, setPanel] = useState<string | null>(null); // "new-emoji" | "new-color" | `${id}-emoji` | `${id}-color`
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), emoji, color);
    setName("");
    setEmoji("📘");
    setColor(DEFAULT_COLOR);
    setAdding(false);
    setPanel(null);
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">Subject library</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Pick a subject, then a folder of material.</p>
        </div>
        <Button onClick={() => setAdding((v) => !v)} className="shrink-0 cursor-pointer rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      {adding ? (
        <div className="relative flex flex-wrap items-center gap-2 rounded-2xl purple-outline bg-card/60 px-3 py-3 backdrop-blur-xl sm:px-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === "new-emoji" ? null : "new-emoji")}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-primary/40 bg-surface/60 text-xl transition-transform hover:scale-105"
              aria-label="Choose emoji"
            >
              {emoji}
            </button>
            {panel === "new-emoji" ? (
              <PickerModal onClose={() => setPanel(null)}>
              <EmojiPicker
                onPick={(c) => {
                  setEmoji(c);
                  setPanel(null);
                }}
                onClose={() => setPanel(null)}
              />
              </PickerModal>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === "new-color" ? null : "new-color")}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-primary/40 transition-transform hover:scale-105"
              style={{ background: `linear-gradient(140deg, ${color}, color-mix(in oklab, ${color} 40%, #150e28))` }}
              aria-label="Choose colour"
            >
              <Palette className="h-4 w-4 text-white/90" />
            </button>
            {panel === "new-color" ? (
              <PickerModal onClose={() => setPanel(null)}>
                <ColorPicker value={color} onPick={(c) => setColor(c)} onClose={() => setPanel(null)} />
              </PickerModal>
            ) : null}
          </div>

          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Subject name (e.g. Biology)"
            className="min-w-0 flex-1 basis-40 rounded-xl border border-border/60 bg-surface/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
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
            const c = s.color || DEFAULT_COLOR;
            return (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-3xl border bg-card/60 p-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 sm:p-5"
                style={subjectSurface(c)}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
                  style={{ background: c }}
                />

                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setPanel(panel === `${s.id}-emoji` ? null : `${s.id}-emoji`)}
                        className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl border text-xl transition-transform hover:scale-105"
                        style={{
                          borderColor: `color-mix(in oklab, ${c} 50%, transparent)`,
                          background: `color-mix(in oklab, ${c} 14%, transparent)`,
                        }}
                        aria-label={`Change ${s.name} emoji`}
                      >
                        {s.emoji}
                      </button>
                      {panel === `${s.id}-emoji` ? (
                        <PickerModal onClose={() => setPanel(null)}>
                          <EmojiPicker
                            onPick={(e) => {
                              onUpdate(s.id, { emoji: e });
                              setPanel(null);
                            }}
                            onClose={() => setPanel(null)}
                          />
                        </PickerModal>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      {editing === s.id ? (
                        <input
                          autoFocus
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onBlur={() => {
                            if (draftName.trim()) onUpdate(s.id, { name: draftName.trim() });
                            setEditing(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setEditing(null);
                          }}
                          className="w-full rounded-lg border border-border/60 bg-surface/60 px-2 py-1 text-sm outline-none focus:border-primary/60"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpen(s.id)}
                          className="block max-w-full cursor-pointer truncate text-left text-base font-semibold tracking-tight hover:underline"
                        >
                          {s.name}
                        </button>
                      )}
                      <div className="text-[11px] text-muted-foreground">
                        {st.folders} folders · {st.materials} materials
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPanel(panel === `${s.id}-color` ? null : `${s.id}-color`)}
                        className="grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={`Change ${s.name} colour`}
                      >
                        <Palette className="h-3.5 w-3.5" />
                      </button>
                      {panel === `${s.id}-color` ? (
                        <PickerModal onClose={() => setPanel(null)}>
                          <ColorPicker
                            value={c}
                            onPick={(col) => onUpdate(s.id, { color: col })}
                            onClose={() => setPanel(null)}
                          />
                        </PickerModal>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftName(s.name);
                        setEditing(s.id);
                      }}
                      className="grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Rename ${s.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <ConfirmDelete onConfirm={() => onDelete(s.id)} label={s.name} />
                  </div>
                </div>

                <div className="relative mt-5 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Mastery</div>
                    <div className={cn("text-2xl font-semibold tabular-nums", scoreColor(st.mastery ?? 0))}>
                      {st.mastery == null ? "—" : `${st.mastery}%`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(s.id)}
                    className="cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-medium transition-transform hover:scale-[1.04]"
                    style={{
                      borderColor: `color-mix(in oklab, ${c} 55%, transparent)`,
                      background: `color-mix(in oklab, ${c} 16%, transparent)`,
                    }}
                  >
                    Open
                  </button>
                </div>

                <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface/70">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${st.mastery ?? 0}%`,
                      background: `linear-gradient(90deg, ${c}, #fde047)`,
                    }}
                  />
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
  const c = subject.color || DEFAULT_COLOR;

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
        <h2 className="mt-2 flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
          <span className="text-2xl">{subject.emoji}</span>
          <span className="truncate">{subject.name}</span>
        </h2>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card/60 px-3 py-3 backdrop-blur-xl sm:px-4"
        style={subjectSurface(c)}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="New folder (e.g. Module 5 — Heredity)"
          className="min-w-0 flex-1 basis-40 rounded-xl border border-border/60 bg-surface/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <Button onClick={submit} className="shrink-0 cursor-pointer rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Add
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
                className="group relative overflow-hidden rounded-3xl border bg-card/60 p-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 sm:p-5"
                style={subjectSurface(c)}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(f.id)}
                    className="flex min-w-0 cursor-pointer items-center gap-2 text-left"
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" style={{ color: c }} />
                    <span className="truncate text-base font-semibold tracking-tight hover:underline">{f.name}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = window.prompt("Rename folder", f.name);
                        if (next && next.trim()) onRename(f.id, next.trim());
                      }}
                      className="grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Rename ${f.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <ConfirmDelete onConfirm={() => onDelete(f.id)} label={f.name} />
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {st.materials} materials · {st.attempts} sessions
                  {st.lastSessionAt ? ` · ${relativeDay(st.lastSessionAt)}` : ""}
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Mastery</div>
                    <div className={cn("text-2xl font-semibold tabular-nums", scoreColor(st.mastery ?? 0))}>
                      {st.mastery == null ? "—" : `${st.mastery}%`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(f.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-transform hover:scale-[1.04]"
                    style={{
                      borderColor: `color-mix(in oklab, ${c} 55%, transparent)`,
                      background: `color-mix(in oklab, ${c} 16%, transparent)`,
                    }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Study
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
