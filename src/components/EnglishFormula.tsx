import { useRef, useState } from "react";
import { ChevronDown, Maximize2, PenLine, Sparkles } from "lucide-react";
import { RichEditor } from "@/components/RichEditor";
import { MemoriseLinkBox } from "@/components/MemoriseLinkBox";
import { SkeletonFigure } from "@/components/SkeletonFigure";
import { MODES } from "@/data/englishFormula";

export function EnglishFormula() {
  const [open, setOpen] = useState(false);
  const [modeId, setModeId] = useState(MODES[0].id);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [section, setSection] = useState<string>("skeleton");
  const sectionRef = useRef<HTMLDivElement>(null);

  const mode = MODES.find((m) => m.id === modeId) ?? MODES[0];
  const part = mode.parts.find((p) => p.id === activePart) ?? null;
  const docSection = mode.sections.find((s) => s.id === section) ?? null;

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
                ? "Click to close the writing workspaces."
                : "Five writing skeletons — analytical, imaginative, discursive, persuasive and reflection."}
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
                className={`flex-1 rounded-xl px-3 py-2.5 text-xs sm:text-sm transition-all duration-300 ${
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
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" /> Skeleton Blueprint
              </SideItem>
              {mode.sections.map((s) => (
                <SideItem key={s.id} active={section === s.id} onClick={() => setSection(s.id)}>
                  {s.label}
                </SideItem>
              ))}
            </aside>

            {/* Workspace */}
            {section === "skeleton" ? (
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
                      className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface/80 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur hover:border-primary/60 hover:text-foreground transition-colors"
                    >
                      <Maximize2 className="h-3 w-3" /> Reset view
                    </button>
                  )}

                  <div className="relative mt-1 flex flex-wrap gap-1.5">
                    {mode.parts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => pick(p.id)}
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
                    <div key={`${mode.id}-${part.id}`} className="fade-in-up">
                      <h3 className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground">
                        {part.title}
                      </h3>
                      <h4 className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                        {part.sub}
                      </h4>
                      <p className="mt-2 mb-4 text-sm text-muted-foreground">{part.hint}</p>
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
                        Click the skull, spine, vertebrae, limbs or feet to zoom in and write the
                        structure for this workspace.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                key={`${mode.id}-${section}`}
                className="purple-outline rounded-2xl bg-card/50 p-5 fade-in-up"
              >
                <h3 className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground">
                  {docSection?.label}
                </h3>
                <h4 className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {mode.label}
                </h4>
                <p className="mt-2 mb-4 text-sm text-muted-foreground">{docSection?.blurb}</p>
                {docSection?.vault && (
                  <div className="mb-4">
                    <MemoriseLinkBox
                      storageKey={`${mode.id}-memorise-by-heart`}
                      label="Memorise By Heart"
                    />
                  </div>
                )}
                <RichEditor
                  storageKey={`${mode.id}-doc-${section}`}
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
