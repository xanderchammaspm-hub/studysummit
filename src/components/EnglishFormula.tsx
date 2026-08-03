import { useRef, useState } from "react";
import { ChevronDown, Maximize2, PenLine, Sparkles } from "lucide-react";
import { RichEditor } from "@/components/RichEditor";
import { MemoriseLinkBox } from "@/components/MemoriseLinkBox";
import { SkeletonFigure } from "@/components/SkeletonFigure";


type Part = { id: string; title: string; sub: string; hint: string };

const PARTS: Part[] = [
  {
    id: "skull",
    title: "Skull",
    sub: "Introduction",
    hint: "The thinking head — context, text, thesis.",
  },
  {
    id: "spine",
    title: "Spine",
    sub: "Thesis Statement",
    hint: "The line that holds every paragraph upright.",
  },
  {
    id: "vertebrae",
    title: "Vertebrae",
    sub: "Sub-Theses / Topic Sentences",
    hint: "Each disc is one argument, stacked in order.",
  },
  {
    id: "limbs",
    title: "Arms & Legs",
    sub: "Body Paragraphs & Evidence",
    hint: "Where the essay does its work — technique, quote, effect.",
  },
  {
    id: "feet",
    title: "Feet",
    sub: "Conclusion",
    hint: "Where the argument lands and holds its ground.",
  },
];

const DOC_SECTIONS = [
  { id: "improvement", label: "Areas of Improvement" },
  { id: "power-verbs", label: "Power Verbs" },
  { id: "techniques", label: "Techniques" },
  { id: "flowing-phrases", label: "Flowing Phrases" },
  { id: "structure", label: "Structure" },
  { id: "comparative", label: "Comparative Structure" },
  { id: "memorisation", label: "Memorisation Technique" },
] as const;

const VB = { w: 200, h: 420 };
const PAD = 18;

export function EnglishFormula() {
  const [open, setOpen] = useState(false);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [section, setSection] = useState<string>("skeleton");
  const [transform, setTransform] = useState("translate(0,0) scale(1)");
  const [pop, setPop] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const groupsRef = useRef<Record<string, SVGGElement | null>>({});

  const part = PARTS.find((p) => p.id === activePart) ?? null;

  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const focus = useCallback((id: string | null) => {
    if (!id) {
      setTransform("translate(0,0) scale(1)");
      return;
    }
    const el = groupsRef.current[id];
    if (!el) return;
    let box: DOMRect;
    try {
      box = el.getBBox() as DOMRect;
    } catch {
      return;
    }
    if (!box.width || !box.height) return;
    const w = box.width + PAD * 2;
    const h = box.height + PAD * 2;
    const scale = Math.max(1, Math.min(VB.w / w, VB.h / h, 3.4));
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    setTransform(
      `translate(${VB.w / 2 - cx * scale},${VB.h / 2 - cy * scale}) scale(${scale})`,
    );
  }, []);

  const pick = (id: string | null) => {
    setActivePart(id);
    setPop((n) => n + 1);
  };

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => focus(activePart), 20);
    return () => window.clearTimeout(t);
  }, [activePart, open, focus]);

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

  const docSection = DOC_SECTIONS.find((s) => s.id === section);

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
            <h3 className="text-lg font-semibold tracking-tight gradient-text">
              English Formula
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {open
                ? "Click to close the Skeleton Essay Explorer."
                : "The skeleton of a band 6 essay — click through each bone to build your own notes."}
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
              open ? "rotate-180" : "group-hover:translate-y-0.5"
            }`}
          />
        </div>
      </button>

      {/* Explorer */}
      {open && (
        <div ref={sectionRef} className="mt-6 fade-in-up scroll-mt-24">
          {/* Section tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            <TabChip
              active={section === "skeleton"}
              onClick={() => setSection("skeleton")}
            >
              <Sparkles className="h-3.5 w-3.5" /> Skeleton Essay
            </TabChip>
            {DOC_SECTIONS.map((s) => (
              <TabChip
                key={s.id}
                active={section === s.id}
                onClick={() => setSection(s.id)}
              >
                {s.label}
              </TabChip>
            ))}
          </div>

          {section === "skeleton" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
              {/* Skeleton viewer */}
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
                <svg
                  viewBox={`0 0 ${VB.w} ${VB.h}`}
                  className="relative h-[420px] w-full sm:h-[540px]"
                  role="img"
                  aria-label="Interactive anatomical essay skeleton"
                >
                  <defs>
                    <linearGradient id="ef-bone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.93 0.02 285)" />
                      <stop offset="100%" stopColor="oklch(0.72 0.05 292)" />
                    </linearGradient>
                    <filter id="ef-glow" x="-70%" y="-70%" width="240%" height="240%">
                      <feDropShadow
                        dx="0"
                        dy="0"
                        stdDeviation="2.6"
                        floodColor="var(--primary)"
                        floodOpacity="0.95"
                      />
                      <feDropShadow
                        dx="0"
                        dy="0"
                        stdDeviation="6"
                        floodColor="var(--primary)"
                        floodOpacity="0.55"
                      />
                    </filter>
                  </defs>

                  <g
                    key={pop}
                    transform={transform}
                    style={{
                      transition: reduced
                        ? "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)"
                        : "transform 620ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    <Skeleton
                      active={activePart}
                      onPick={pick}
                      register={(id, el) => {
                        groupsRef.current[id] = el;
                      }}
                    />
                  </g>
                </svg>

                {part && (
                  <button
                    onClick={() => pick(null)}
                    className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface/80 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur hover:border-primary/60 hover:text-foreground transition-colors"
                  >
                    <Maximize2 className="h-3 w-3" /> Reset view
                  </button>
                )}

                <div className="relative mt-1 flex flex-wrap gap-1.5">
                  {PARTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pick(p.id)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                        activePart === p.id
                          ? "border-primary bg-primary/20 text-foreground"
                          : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail panel */}
              <div className="purple-outline rounded-2xl bg-card/50 p-5">
                {part ? (
                  <div key={part.id} className="fade-in-up">
                    <h3 className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground">
                      {part.title}
                    </h3>
                    <h4 className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                      {part.sub}
                    </h4>
                    <p className="mt-2 mb-4 text-sm text-muted-foreground">
                      {part.hint}
                    </p>
                    <RichEditor
                      storageKey={`part-${part.id}`}
                      placeholder="Write your notes for this section…"
                      minHeight={260}
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                    <h3 className="text-xl font-semibold uppercase tracking-[0.18em] text-foreground">
                      Skeleton Essay
                    </h3>
                    <h4 className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                      Pick a bone
                    </h4>
                    <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                      Click the skull, spine, vertebrae, limbs or feet to zoom in
                      and write notes for that part of the essay.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="purple-outline rounded-2xl bg-card/50 p-5 fade-in-up">
              <h3 className="text-2xl font-semibold uppercase tracking-[0.18em] text-foreground">
                {docSection?.label}
              </h3>
              <h4 className="mt-1 mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                English Formula
              </h4>
              {section === "memorisation" && (
                <div className="mb-4">
                  <MemoriseLinkBox
                    storageKey="memorise-by-heart"
                    label="Memorise By Heart"
                  />
                </div>
              )}
              <RichEditor
                storageKey={`doc-${section}`}
                placeholder="Add a table, list or notes — formatting is saved automatically…"
                minHeight={340}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabChip({
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
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/20 text-foreground"
          : "border-border/50 bg-surface/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Anatomical skeleton ---------- */

const RIBS = Array.from({ length: 9 }).map((_, i) => {
  const y = 104 + i * 6.4;
  const spread = 30 - Math.abs(i - 3) * 1.6 - (i > 5 ? (i - 5) * 3.6 : 0);
  const drop = 14 + i * 0.8;
  return { y, spread, drop };
});

function Mirror({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <g transform="translate(200,0) scale(-1,1)">{children}</g>
    </>
  );
}

function Skeleton({
  active,
  onPick,
  register,
}: {
  active: string | null;
  onPick: (id: string) => void;
  register: (id: string, el: SVGGElement | null) => void;
}) {
  const props = (id: string) => ({
    ref: (el: SVGGElement | null) => register(id, el),
    onClick: () => onPick(id),
    className: "ef-part",
    style: {
      cursor: "pointer",
      filter: active === id ? "url(#ef-glow)" : undefined,
      stroke: active === id ? "var(--primary)" : "color-mix(in oklab, var(--primary) 30%, oklch(0.85 0.02 285))",
      fill:
        active === id
          ? "color-mix(in oklab, var(--primary) 20%, transparent)"
          : "oklch(0.9 0.02 285 / 0.10)",
      strokeWidth: active === id ? 1.6 : 1.1,
      opacity: active && active !== id ? 0.24 : 1,
      transition: "opacity 450ms ease, stroke 450ms ease, fill 450ms ease, stroke-width 450ms ease",
    } as React.CSSProperties,
  });

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* SKULL */}
      <g {...props("skull")}>
        <path d="M100 10c-19 0-31 14-31 31 0 11 3 17 6 21l2 9c1 5 7 8 13 8h20c6 0 12-3 13-8l2-9c3-4 6-10 6-21 0-17-12-31-31-31z" />
        <path d="M78 34c4-7 12-11 22-11s18 4 22 11" fill="none" />
        <ellipse cx="89" cy="44" rx="7.5" ry="7" fill="var(--background)" />
        <ellipse cx="111" cy="44" rx="7.5" ry="7" fill="var(--background)" />
        <path d="M100 52l-4.5 10h9z" fill="var(--background)" />
        <path d="M86 68h28" fill="none" />
        <path d="M86 68q14 14 28 0 0 12-14 12t-14-12z" />
        <path d="M92 68v6M100 68v6M108 68v6" fill="none" />
      </g>

      {/* SPINE — cervical, clavicles, scapulae, sternum, ribcage */}
      <g {...props("spine")}>
        <rect x="96" y="82" width="8" height="6" rx="2.4" />
        <rect x="96" y="90" width="8" height="6" rx="2.4" />
        <path d="M98 98h4v58h-4z" />
        <Mirror>
          <path d="M99 100C90 96 80 95 74 98" fill="none" />
          <path d="M76 102c-6 6-6 16-1 22" fill="none" />
        </Mirror>
        <rect x="96.5" y="100" width="7" height="26" rx="3" />
        {RIBS.map((r, i) => (
          <Mirror key={i}>
            <path
              d={`M98 ${r.y}C${98 - r.spread} ${r.y - 2},${98 - r.spread - 6} ${r.y + r.drop * 0.5},${98 - r.spread * 0.65} ${r.y + r.drop}`}
              fill="none"
            />
          </Mirror>
        ))}
      </g>

      {/* VERTEBRAE — lumbar, sacrum, pelvis */}
      <g {...props("vertebrae")}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="94" y={160 + i * 9} width="12" height="7" rx="2.6" />
            <path d={`M94 ${163.5 + i * 9}h-7M106 ${163.5 + i * 9}h7`} fill="none" />
          </g>
        ))}
        <path d="M92 205h16l-4 16h-8z" />
        <Mirror>
          <path d="M100 206c-9-8-20-11-27-8-3 12-1 24 6 31 6 6 9 8 10 15h11" fill="none" />
          <path d="M86 226c-6-1-9 4-8 9 1 5 6 8 10 6 4-2 4-11-2-15z" />
        </Mirror>
      </g>

      {/* ARMS & LEGS */}
      <g {...props("limbs")}>
        <Mirror>
          {/* humerus */}
          <path d="M77 104c-6 18-8 34-6 48" fill="none" strokeWidth={2.2} />
          {/* radius + ulna */}
          <path d="M71 154c-4 16-8 30-9 40" fill="none" />
          <path d="M75 155c-2 16-5 29-6 39" fill="none" />
          {/* hand */}
          <path d="M62 196c-3 3-4 8-1 10l6 4 4-2" fill="none" />
          <path d="M60 204l-4 8M63 207l-3 9M67 209l-2 9M70 210l-1 8" fill="none" />
          {/* femur */}
          <path d="M90 244c-4 22-5 42-4 58" fill="none" strokeWidth={2.4} />
          {/* patella */}
          <circle cx="86" cy="306" r="4" />
          {/* tibia + fibula */}
          <path d="M86 312c-1 22-2 42-2 56" fill="none" strokeWidth={2} />
          <path d="M91 312c1 20 1 38 0 54" fill="none" />
        </Mirror>
      </g>

      {/* FEET */}
      <g {...props("feet")}>
        <Mirror>
          <path d="M80 370c-1 8-1 12-6 15-6 4-12 6-11 11 1 4 8 4 14 4h17c4 0 6-3 6-7l-1-23z" />
          <path d="M63 394l6 2M67 390l6 2M71 386l6 2" fill="none" />
        </Mirror>
      </g>
    </g>
  );
}
