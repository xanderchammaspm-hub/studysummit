import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Maximize2, PenLine, Plus, Sparkles, Star, Trash2, X } from "lucide-react";
import { RichEditor } from "@/components/RichEditor";
import { MemoriseLinkBox } from "@/components/MemoriseLinkBox";
import { SkeletonFigure } from "@/components/SkeletonFigure";
import { ShortAnswerMark } from "@/components/ShortAnswerMark";
import { AtlasSectionChat } from "@/components/AtlasSectionChat";
import { MODES, type DocSection } from "@/data/englishFormula";
import { useEnglishFormula } from "@/hooks/useEnglishFormula";
import { EssayStructureBoard } from "@/components/EssayStructureBoard";

const EDITOR_PREFIX = "summit-english-formula-v1:";


export function EnglishFormula() {
  const [open, setOpen] = useState(false);
  const [modeId, setModeId] = useState(MODES[0].id);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [section, setSection] = useState<string>("skeleton");
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);

  const { store, updatePart, addSection, renameSection, removeSection, moveSection } =
    useEnglishFormula();

  const mode = MODES.find((m) => m.id === modeId) ?? MODES[0];
  const custom = store.sections[mode.id] ?? [];
  const baseSections: DocSection[] = [...mode.sections, ...custom];
  const savedOrder = store.order?.[mode.id] ?? [];
  const allSections: DocSection[] = [
    ...savedOrder
      .map((id) => baseSections.find((s) => s.id === id))
      .filter((s): s is DocSection => Boolean(s)),
    ...baseSections.filter((s) => !savedOrder.includes(s.id)),
  ];
  const orderIds = allSections.map((s) => s.id);

  const basePart = mode.parts.find((p) => p.id === activePart) ?? null;
  const override = activePart ? store.parts[mode.id]?.[activePart] : undefined;
  const part = basePart ? { ...basePart, ...override } : null;
  const docSection = allSections.find((s) => s.id === section) ?? null;
  const isCustom = custom.some((s) => s.id === section);
  const hasSkeleton = mode.parts.length > 0;

  // Carry over notes written when Short Answers lived inside the essay mode.
  useEffect(() => {
    try {
      const from = localStorage.getItem(`${EDITOR_PREFIX}analytical-doc-short-answers`);
      const toKey = `${EDITOR_PREFIX}short-answer-doc-formulas`;
      if (from && !localStorage.getItem(toKey)) localStorage.setItem(toKey, from);
    } catch {
      // ignore
    }
  }, []);

  const pick = (id: string | null) => setActivePart(id);


  const switchMode = (id: string) => {
    setModeId(id);
    setSection("skeleton");
    setActivePart(null);
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    window.setTimeout(
      () => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      60,
    );
  };

  const submitNew = () => {
    const label = newLabel.trim();
    if (!label) return;
    const id = addSection(mode.id, label);
    setNewLabel("");
    setAdding(false);
    setSection(id);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 mt-16">
      {/* Prompt card */}
      <button
        onClick={toggle}
        aria-expanded={open}
        className="ef-prompt group w-full cursor-pointer rounded-2xl border border-border/60 bg-card/50 px-6 py-7 text-left transition-all duration-300 hover:border-primary/70"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <PenLine className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight gradient-text">English Formula</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {open
                ? "Click to close the writing workspaces."
                : "Six workspaces — essay, imaginative, discursive, persuasive, reflection and short answer."}
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
              open ? "rotate-180" : "group-hover:translate-y-0.5"
            }`}
          />
        </div>
      </button>

      {open && (
        <div ref={sectionRef} className="mt-6 fade-in-up scroll-mt-24">
          {/* Workspace switcher */}
          <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-card/40 p-1.5 backdrop-blur-md">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs sm:text-sm transition-all duration-300 ${
                  modeId === m.id
                    ? "bg-primary/15 text-foreground shadow-[0_0_0_1px_var(--color-border)]"
                    : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
                }`}
              >
                <span className="block font-medium">{m.label}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">{m.tagline}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,215px)_minmax(0,1fr)]">
            {/* Sidebar */}
            <aside className="purple-outline h-fit rounded-2xl bg-card/40 p-2">
              <SideItem active={section === "skeleton"} onClick={() => setSection("skeleton")}>
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />{" "}
                {hasSkeleton ? "Skeleton Blueprint" : "Overview"}
              </SideItem>

              {allSections.map((s, i) => (
                <SideItem
                  key={s.id}
                  active={section === s.id}
                  onClick={() => setSection(s.id)}
                  onMoveUp={i > 0 ? () => moveSection(mode.id, orderIds, i, i - 1) : undefined}
                  onMoveDown={
                    i < allSections.length - 1
                      ? () => moveSection(mode.id, orderIds, i, i + 1)
                      : undefined
                  }
                  onDelete={
                    custom.some((c) => c.id === s.id)
                      ? () => {
                          removeSection(mode.id, s.id);
                          if (section === s.id) setSection("skeleton");
                        }
                      : undefined
                  }
                >
                  {s.label}
                </SideItem>
              ))}

              {adding ? (
                <div className="mt-1 flex items-center gap-1 rounded-xl border border-primary/50 bg-surface/60 px-2 py-1.5">
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitNew();
                      if (e.key === "Escape") setAdding(false);
                    }}
                    placeholder="Section name…"
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                  />
                  <button
                    onClick={submitNew}
                    className="cursor-pointer rounded-md p-1 text-primary hover:bg-primary/15"
                    aria-label="Add section"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-surface"
                    aria-label="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="mt-1 flex w-full cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border/70 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Add section
                </button>
              )}
            </aside>

            {/* Workspace */}
            {section === "skeleton" && hasSkeleton ? (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
                <div className="ef-stage relative purple-outline rounded-2xl p-3 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px shimmer-line" />
                  <div
                    className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                      part ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      background:
                        "radial-gradient(circle at 50% 45%, transparent 30%, color-mix(in oklab, var(--background) 78%, transparent) 100%)",
                    }}
                  />
                  <SkeletonFigure
                    className="relative h-[440px] w-full sm:h-[560px]"
                    active={activePart}
                    hovered={hovered}
                    onPick={pick}
                    onHover={setHovered}
                  />

                  {part && (
                    <button
                      onClick={() => pick(null)}
                      className="absolute right-3 top-3 flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/60 bg-surface/80 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur hover:border-primary/60 hover:text-foreground transition-colors"
                    >
                      <Maximize2 className="h-3 w-3" /> Reset view
                    </button>
                  )}

                  <div className="relative mt-1 flex flex-wrap gap-1.5">
                    {mode.parts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => pick(p.id)}
                        className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          activePart === p.id
                            ? "border-primary bg-primary/20 text-foreground"
                            : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {store.parts[mode.id]?.[p.id]?.sub ?? p.sub}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-5">
                  {part && basePart ? (
                    <div key={`${mode.id}-${part.id}`} className="fade-in-up">
                      <EditableText
                        value={part.title}
                        onChange={(v) => updatePart(mode.id, basePart.id, { title: v })}
                        className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground"
                        placeholder="Bone name"
                      />
                      <EditableText
                        value={part.sub}
                        onChange={(v) => updatePart(mode.id, basePart.id, { sub: v })}
                        className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary"
                        placeholder="Role in the essay"
                      />
                      <EditableText
                        value={part.hint}
                        onChange={(v) => updatePart(mode.id, basePart.id, { hint: v })}
                        className="mt-2 mb-4 text-sm text-muted-foreground"
                        placeholder="Short description"
                      />
                      <RichEditor
                        storageKey={`${mode.id}-part-${part.id}`}
                        placeholder="Write your notes for this section…"
                        minHeight={260}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                      <h3 className="text-xl font-semibold uppercase tracking-[0.18em] text-foreground">
                        {mode.label}
                      </h3>
                      <h4 className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                        Pick a bone
                      </h4>
                      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                        Click the skull, spine, vertebrae, limbs or feet to zoom in — then click any
                        heading to rename it and write your own structure.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : section === "skeleton" ? (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
                <div className="ef-stage relative purple-outline flex flex-col items-center justify-center rounded-2xl p-6 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px shimmer-line" />
                  <ShortAnswerMark size={240} className="relative" />
                  <h3 className="relative mt-5 text-xl font-semibold uppercase tracking-[0.18em] text-foreground">
                    Short Answer
                  </h3>
                  <p className="relative mt-2 max-w-xs text-center text-sm text-muted-foreground">
                    Read the extract, name the technique, land the effect — one clean move per mark.
                  </p>
                </div>
                <div className="glass-panel p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Atlas marking
                  </h4>
                  <div className="mt-3">
                    <AtlasSectionChat storageKey={`${mode.id}-short-answers`} />
                  </div>
                  <div className="mt-4">
                    <RichEditor
                      storageKey={`${mode.id}-overview`}
                      placeholder="Working space — paste a question, draft a response…"
                      minHeight={220}
                    />
                  </div>
                </div>
              </div>
            ) : (

              <div
                key={`${mode.id}-${section}`}
                className="glass-panel p-5 fade-in-up"
              >
                {isCustom ? (
                  <EditableText
                    value={docSection?.label ?? ""}
                    onChange={(v) => renameSection(mode.id, section, v)}
                    className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground"
                    placeholder="Section name"
                  />
                ) : (
                  <h3 className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground">
                    {docSection?.label}
                  </h3>
                )}
                <h4 className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {mode.label}
                </h4>
                {docSection?.blurb && (
                  <p className="mt-2 text-sm text-muted-foreground">{docSection.blurb}</p>
                )}
                {docSection?.vault && (
                  <div className="mt-4">
                    <MemoriseLinkBox
                      storageKey={`${mode.id}-memorise-by-heart`}
                      label="Memorise By Heart"
                    />
                  </div>
                )}
                
                <div className="mt-4">
                  <RichEditor
                    storageKey={`${mode.id}-doc-${section}`}
                    placeholder="Add a table, list or notes — formatting is saved automatically…"
                    minHeight={340}
                  />

                </div>
              </div>
            )}
          </div>

          {/* Full-width structure board */}
          <div className="mt-4">
            <EssayStructureBoard modeId={mode.id} modeLabel={mode.label} />
          </div>
        </div>
      )}
    </div>
  );
}

function EditableText({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) onChange(next);
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        placeholder={placeholder}
        className={`w-full rounded-md border border-primary/50 bg-background/60 px-2 py-1 outline-none ${className ?? ""}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`block w-full cursor-pointer rounded-md px-2 py-1 text-left transition-colors hover:bg-primary/10 ${className ?? ""}`}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
  );
}

function SideItem({
  active,
  onClick,
  onDelete,
  onMoveUp,
  onMoveDown,
  children,
}: {
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group/side relative flex items-center">
      <button
        onClick={onClick}
        className={`flex w-full cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
          active
            ? "bg-primary/15 text-foreground shadow-[0_0_0_1px_var(--color-border)]"
            : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
        }`}
      >
        {children}
      </button>
      {(onMoveUp || onMoveDown) && (
        <span className={`absolute ${onDelete ? "right-8" : "right-1.5"} flex items-center opacity-0 transition-opacity group-hover/side:opacity-100`}>
          <button
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label="Move section up"
            className="cursor-pointer rounded-md p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label="Move section down"
            className="cursor-pointer rounded-md p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </span>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label="Delete section"
          className="absolute right-1.5 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/side:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}


