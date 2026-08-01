import { useMemo, useRef, useState } from "react";
import { ChevronDown, Maximize2, PenLine, Sparkles } from "lucide-react";
import { RichEditor } from "@/components/RichEditor";

type Part = {
  id: string;
  title: string;
  sub: string;
  hint: string;
  focus: { x: number; y: number; w: number; h: number };
};

const PARTS: Part[] = [
  {
    id: "skull",
    title: "Skull",
    sub: "Introduction",
    hint: "The thinking head — context, text, thesis.",
    focus: { x: 60, y: 8, w: 80, h: 80 },
  },
  {
    id: "spine",
    title: "Spine",
    sub: "Thesis Statement",
    hint: "The line that holds every paragraph upright.",
    focus: { x: 62, y: 78, w: 76, h: 76 },
  },
  {
    id: "vertebrae",
    title: "Vertebrae",
    sub: "Sub-Theses / Topic Sentences",
    hint: "Each disc is one argument, stacked in order.",
    focus: { x: 62, y: 140, w: 76, h: 76 },
  },
  {
    id: "limbs",
    title: "Arms & Legs",
    sub: "Body Paragraphs & Evidence",
    hint: "Where the essay does its work — technique, quote, effect.",
    focus: { x: 18, y: 96, w: 164, h: 170 },
  },
  {
    id: "feet",
    title: "Feet",
    sub: "Conclusion",
    hint: "Where the argument lands and holds its ground.",
    focus: { x: 42, y: 300, w: 116, h: 90 },
  },
];

const DOC_SECTIONS = [
  { id: "improvement", label: "Areas of Improvement" },
  { id: "power-verbs", label: "Power Verbs" },
  { id: "techniques", label: "Techniques" },
  { id: "flowing-phrases", label: "Flowing Phrases" },
  { id: "structure", label: "Structure" },
  { id: "comparative", label: "Comparative Structure" },
] as const;

const VB = { w: 200, h: 400 };

export function EnglishFormula() {
  const [open, setOpen] = useState(false);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [section, setSection] = useState<string>("skeleton");
  const sectionRef = useRef<HTMLDivElement>(null);

  const part = PARTS.find((p) => p.id === activePart) ?? null;

  const transform = useMemo(() => {
    if (!part) return "translate(0,0) scale(1)";
    const { x, y, w, h } = part.focus;
    const scale = Math.min(VB.w / w, VB.h / h, 3.2);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const tx = VB.w / 2 - cx * scale;
    const ty = VB.h / 2 - cy * scale;
    return `translate(${tx},${ty}) scale(${scale})`;
  }, [part]);

  const reveal = () => {
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
        onClick={reveal}
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
              The skeleton of a band 6 essay — click through each bone to build
              your own notes.
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
              <div className="relative purple-outline rounded-2xl bg-card/50 p-3 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px shimmer-line" />
                <svg
                  viewBox={`0 0 ${VB.w} ${VB.h}`}
                  className="h-[420px] w-full sm:h-[520px]"
                  role="img"
                  aria-label="Interactive essay skeleton"
                >
                  <defs>
                    <linearGradient id="ef-bone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.9 0.02 285)" />
                      <stop offset="100%" stopColor="oklch(0.7 0.04 290)" />
                    </linearGradient>
                    <filter id="ef-glow" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="2.4" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <g
                    transform={transform}
                    style={{
                      transition:
                        "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <Skeleton active={activePart} onPick={setActivePart} />
                  </g>
                </svg>

                {part && (
                  <button
                    onClick={() => setActivePart(null)}
                    className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface/80 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur hover:border-primary/60 hover:text-foreground transition-colors"
                  >
                    <Maximize2 className="h-3 w-3" /> Reset view
                  </button>
                )}

                <div className="mt-1 flex flex-wrap gap-1.5">
                  {PARTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePart(p.id)}
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

function Skeleton({
  active,
  onPick,
}: {
  active: string | null;
  onPick: (id: string) => void;
}) {
  const props = (id: string) => ({
    onClick: () => onPick(id),
    className: "ef-part",
    style: {
      cursor: "pointer",
      filter: active === id ? "url(#ef-glow)" : undefined,
      stroke: active === id ? "var(--primary)" : "url(#ef-bone)",
      fill: active === id ? "color-mix(in oklab, var(--primary) 22%, transparent)" : "oklch(0.9 0.02 285 / 0.12)",
      strokeWidth: active === id ? 2 : 1.4,
      opacity: active && active !== id ? 0.35 : 1,
      transition: "all 400ms ease",
    } as React.CSSProperties,
  });

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Skull */}
      <g {...props("skull")}>
        <ellipse cx="100" cy="40" rx="22" ry="24" />
        <path d="M84 58 h32 v10 a16 8 0 0 1 -32 0 z" />
        <circle cx="92" cy="38" r="4" fill="var(--background)" />
        <circle cx="108" cy="38" r="4" fill="var(--background)" />
      </g>

      {/* Spine — upper column + ribs */}
      <g {...props("spine")}>
        <rect x="96" y="72" width="8" height="12" rx="3" />
        <rect x="96" y="86" width="8" height="12" rx="3" />
        <rect x="96" y="100" width="8" height="12" rx="3" />
        <rect x="70" y="96" width="60" height="6" rx="3" />
        <path d="M100 112 q-26 6 -30 20" />
        <path d="M100 112 q26 6 30 20" />
        <path d="M100 124 q-24 6 -27 18" />
        <path d="M100 124 q24 6 27 18" />
      </g>

      {/* Vertebrae — lumbar stack + pelvis */}
      <g {...props("vertebrae")}>
        <rect x="95" y="146" width="10" height="12" rx="3" />
        <rect x="95" y="160" width="10" height="12" rx="3" />
        <rect x="95" y="174" width="10" height="12" rx="3" />
        <rect x="95" y="188" width="10" height="12" rx="3" />
        <path d="M76 206 q24 22 48 0 q6 18 -10 24 h-28 q-16 -6 -10 -24 z" />
      </g>

      {/* Arms & legs */}
      <g {...props("limbs")}>
        <path d="M74 100 L52 148 L40 196" />
        <path d="M126 100 L148 148 L160 196" />
        <circle cx="38" cy="202" r="5" />
        <circle cx="162" cy="202" r="5" />
        <path d="M88 230 L80 286 L76 320" />
        <path d="M112 230 L120 286 L124 320" />
        <circle cx="80" cy="286" r="5" />
        <circle cx="120" cy="286" r="5" />
      </g>

      {/* Feet */}
      <g {...props("feet")}>
        <path d="M76 320 q-2 12 -14 14 q-4 6 6 8 h20 q6 -4 2 -12 z" />
        <path d="M124 320 q2 12 14 14 q4 6 -6 8 h-20 q-6 -4 -2 -12 z" />
      </g>
    </g>
  );
}
