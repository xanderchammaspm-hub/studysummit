import { useRef, useState } from "react";
import { ChevronDown, MessageSquareText, PenLine, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { RichEditor } from "@/components/RichEditor";
import { MemoriseLinkBox } from "@/components/MemoriseLinkBox";
import { SkeletonOverlay } from "@/components/SkeletonOverlay";
import { ShortAnswerLab } from "@/components/ShortAnswerLab";
import { useEnglishFormula } from "@/hooks/useEnglishFormula";
import type { BoneZone } from "@/data/englishFormula";

const SHORT_ANSWER_ID = "short-answers";

export function EnglishFormula() {
  const [open, setOpen] = useState(false);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [section, setSection] = useState<string>("skeleton");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);

  const { parts, sections, updatePart, addSection, renameSection, removeSection, reset } =
    useEnglishFormula();

  const part = parts.find((p) => p.id === activePart) ?? null;
  const docSection = sections.find((s) => s.id === section) ?? null;
  const activeZone: BoneZone | null = part?.zone ?? null;

  const pickZone = (zone: BoneZone) => {
    const current = parts.find((p) => p.id === activePart);
    if (current?.zone === zone) {
      const sameZone = parts.filter((p) => p.zone === zone);
      const idx = sameZone.findIndex((p) => p.id === current.id);
      // Cycle through parts sharing a zone (e.g. Spine → Vertebrae), then clear.
      setActivePart(idx + 1 < sameZone.length ? sameZone[idx + 1].id : null);
      return;
    }
    const first = parts.find((p) => p.zone === zone);
    setActivePart(first?.id ?? null);
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

  const submitNewSection = () => {
    const label = draft.trim();
    if (!label) {
      setAdding(false);
      return;
    }
    const id = addSection(label);
    setDraft("");
    setAdding(false);
    setSection(id);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 mt-16">
      {/* Prompt card */}
      <button
        onClick={toggle}
        aria-expanded={open}
        className="ef-prompt group w-full rounded-2xl border border-border/60 bg-card/50 px-6 py-7 text-left transition-all duration-300 hover:border-primary/70"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <PenLine className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight gradient-text">English Formula</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {open
                ? "Click to close the analytical essay workspace."
                : "The analytical essay skeleton — click a bone, write the structure, build your own toolset."}
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
          <div className="grid gap-4 lg:grid-cols-[minmax(0,230px)_minmax(0,1fr)]">
            {/* Sidebar */}
            <aside className="purple-outline h-fit rounded-2xl bg-card/40 p-2">
              <SideItem active={section === "skeleton"} onClick={() => setSection("skeleton")}>
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" /> Skeleton Blueprint
              </SideItem>
              <SideItem
                active={section === SHORT_ANSWER_ID}
                onClick={() => setSection(SHORT_ANSWER_ID)}
              >
                <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-primary" /> Short Answers
              </SideItem>

              {sections.map((s) => (
                <div key={s.id} className="group/side relative">
                  <SideItem active={section === s.id} onClick={() => setSection(s.id)}>
                    <span className="truncate pr-6">{s.label}</span>
                  </SideItem>
                  <button
                    onClick={() => {
                      removeSection(s.id);
                      if (section === s.id) setSection("skeleton");
                    }}
                    aria-label={`Delete ${s.label}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/side:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {adding ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={submitNewSection}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNewSection();
                    if (e.key === "Escape") {
                      setDraft("");
                      setAdding(false);
                    }
                  }}
                  placeholder="Section name…"
                  className="mt-1 w-full rounded-xl border border-primary/50 bg-surface/60 px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="mt-1 flex w-full items-center gap-1.5 rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Add section
                </button>
              )}

              <button
                onClick={reset}
                className="mt-1 flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Reset layout
              </button>
            </aside>

            {/* Workspace */}
            {section === "skeleton" ? (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,50fr)_minmax(0,50fr)]">
                <div className="ef-stage relative purple-outline rounded-2xl p-4 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px shimmer-line" />
                  <SkeletonOverlay active={activeZone} onPick={pickZone} className="py-2" />

                  <div className="relative mt-4 flex flex-wrap gap-1.5">
                    {parts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActivePart(activePart === p.id ? null : p.id)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          activePart === p.id
                            ? "border-primary bg-primary/20 text-foreground"
                            : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {p.sub}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="purple-outline rounded-2xl bg-card/50 p-5">
                  {part ? (
                    <div key={part.id} className="fade-in-up">
                      <EditableText
                        value={part.title}
                        onChange={(v) => updatePart(part.id, { title: v })}
                        className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground"
                      />
                      <EditableText
                        value={part.sub}
                        onChange={(v) => updatePart(part.id, { sub: v })}
                        className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary"
                      />
                      <EditableText
                        value={part.hint}
                        onChange={(v) => updatePart(part.id, { hint: v })}
                        className="mt-2 mb-4 text-sm text-muted-foreground"
                      />
                      <RichEditor
                        storageKey={`analytical-part-${part.id}`}
                        placeholder="Write your notes for this section…"
                        minHeight={300}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                      <h3 className="text-xl font-semibold uppercase tracking-[0.18em] text-foreground">
                        Analytical Essay
                      </h3>
                      <h4 className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                        Pick a bone
                      </h4>
                      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                        Hover the skull, spine, limbs or feet on the render, then click to open that
                        part. Every heading here is editable — rewrite it to match your own formula.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : section === SHORT_ANSWER_ID ? (
              <div className="purple-outline rounded-2xl bg-card/50 p-5 fade-in-up">
                <h3 className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground">
                  Short Answers
                </h3>
                <p className="mt-2 mb-4 text-sm text-muted-foreground">
                  Draft a response, get it marked by Atlas AI, and keep your formulas in the notes
                  below.
                </p>
                <ShortAnswerLab />
              </div>
            ) : (
              <div key={section} className="purple-outline rounded-2xl bg-card/50 p-5 fade-in-up">
                <EditableText
                  value={docSection?.label ?? ""}
                  onChange={(v) => docSection && renameSection(docSection.id, v)}
                  className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground"
                />
                <p className="mt-2 mb-4 text-sm text-muted-foreground">{docSection?.blurb}</p>
                {docSection?.vault && (
                  <div className="mb-4">
                    <MemoriseLinkBox
                      storageKey="analytical-memorise-by-heart"
                      label="Memorise By Heart"
                    />
                  </div>
                )}
                <RichEditor
                  storageKey={`analytical-doc-${section}`}
                  placeholder="Add a table, list or notes — formatting is saved automatically…"
                  minHeight={340}
                />
              </div>
            )}
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
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => onChange(e.currentTarget.textContent?.trim() || value)}
      className={`${className ?? ""} cursor-text rounded-md outline-none transition-colors focus:bg-primary/10 focus:ring-1 focus:ring-primary/40`}
    >
      {value}
    </div>
  );
}

function SideItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
        active
          ? "bg-primary/15 text-foreground shadow-[0_0_0_1px_var(--color-border)]"
          : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
