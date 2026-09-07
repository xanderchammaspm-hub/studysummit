import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarCog, RotateCcw } from "lucide-react";

import {
  CAMPS,
  CAMP_LABEL,
  daysUntil,
  useMountainProgress,
} from "@/hooks/useMountainProgress";

const HIGHEST_KEY = "summit-highest-camp-v1";

export function MountainProgress() {
  const {
    progress,
    timeline,
    mastery,
    currentCamp,
    nextCamp,
    topics,
    green,
    papers,
    assessments,
    dates,
    updateDate,
    resetDates,
  } = useMountainProgress();
  const prevCamp = useRef<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = localStorage.getItem(HIGHEST_KEY);
    const highestIdx = CAMPS.findIndex((c) => c.key === prev);
    const curIdx = CAMPS.findIndex((c) => c.key === currentCamp.key);
    if (curIdx > highestIdx) {
      localStorage.setItem(HIGHEST_KEY, currentCamp.key);
      if (prevCamp.current !== null) {
        toast.success(`${currentCamp.emoji} ${currentCamp.name} reached!`, {
          description: currentCamp.desc,
        });
      }
    }
    prevCamp.current = currentCamp.key;
  }, [currentCamp]);

  // Ridge waypoints — x/y in SVG coords, one per camp (6 total)
  const pts: [number, number][] = [
    [70, 305],
    [180, 258],
    [320, 214],
    [460, 170],
    [610, 118],
    [736, 74],
  ];
  const W = 800;
  const H = 340;
  const ridgePath = `M${pts.map(([x, y]) => `${x},${y}`).join(" L ")}`;

  const nextDays = nextCamp ? daysUntil(dates[nextCamp.key]) : null;

  return (
    <div className="mx-auto max-w-4xl glass-panel p-5 sm:p-6 relative overflow-hidden fade-in-up">
      <div className="absolute inset-x-0 top-0 h-px shimmer-line" />

      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Your Climb
          </div>
          <div className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl leading-none">{currentCamp.emoji}</span>
            <span className="gradient-text">
              {currentCamp.name} · {CAMP_LABEL[currentCamp.key]}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{currentCamp.desc}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-semibold tabular-nums gradient-text leading-none">
            {progress}%
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            {!mounted
              ? "\u00A0"
              : nextCamp
                ? `${CAMP_LABEL[nextCamp.key]} in ${Math.max(0, nextDays ?? 0)}d`
                : "Summited"}
          </div>

          <button
            onClick={() => setEditing((v) => !v)}
            className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full purple-outline bg-surface/60 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <CalendarCog className="h-3.5 w-3.5" /> Exam dates
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-5 rounded-xl border border-border/70 bg-surface/50 p-4 fade-in-up">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Milestone calendar
            </div>
            <button
              onClick={resetDates}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {CAMPS.map((c) => (
              <label key={c.key} className="block text-xs">
                <span className="mb-1 block text-muted-foreground">
                  {c.emoji} {CAMP_LABEL[c.key]}
                </span>
                <input
                  type="date"
                  value={dates[c.key]}
                  onChange={(e) => updateDate(c.key, e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-border bg-background/70 px-2.5 py-1.5 text-foreground outline-none transition-colors focus:border-primary/70"
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            The climb tracks your exam calendar ({timeline}% by date) blended with topic mastery (
            {mastery}%).
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mountain-scene w-full h-auto overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Mountain progress: ${progress}% — currently at ${currentCamp.name}`}
      >
        <defs>
          <linearGradient id="mtn-body" x1="0" x2="0.65" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--mountain-snow-shadow)" />
            <stop offset="22%" stopColor="var(--mountain-ridge-light)" />
            <stop offset="62%" stopColor="var(--mountain-rock)" />
            <stop offset="100%" stopColor="var(--mountain-valley)" />
          </linearGradient>
          <linearGradient id="mtn-back" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--mountain-distant)" />
            <stop offset="100%" stopColor="var(--mountain-valley)" />
          </linearGradient>
          <linearGradient id="mtn-done" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.75 0.22 300)" />
            <stop offset="100%" stopColor="oklch(0.9 0.14 82)" />
          </linearGradient>
          <linearGradient id="mtn-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--mountain-sky)" />
            <stop offset="72%" stopColor="var(--mountain-horizon)" />
            <stop offset="100%" stopColor="var(--mountain-valley)" />
          </linearGradient>
          <radialGradient id="summit-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="var(--mountain-gold)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="snow-face" x1="0" x2="0.8" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--mountain-snow)" />
            <stop offset="100%" stopColor="var(--mountain-snow-shadow)" />
          </linearGradient>
          <filter id="mist-blur"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id="route-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#mtn-sky)" />

        {[
          [80, 40], [160, 70], [260, 30], [340, 90], [480, 45],
          [560, 75], [640, 35], [700, 100], [140, 110], [420, 20],
        ].map(([x, y], i) => (
          <circle
            key={`s${i}`}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 1.6 : 1}
            fill="oklch(0.95 0.05 285)"
            style={{
              animation: `twinkle ${2.4 + (i % 5) * 0.4}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}

        {progress >= 70 && (
          <circle
            cx={pts[5][0]}
            cy={pts[5][1]}
            r={60}
            fill="url(#summit-glow)"
            style={{ opacity: (progress - 60) / 40, transition: "opacity 900ms ease" }}
          />
        )}

        <g className="mountain-mist" filter="url(#mist-blur)">
          <ellipse cx="40" cy="188" rx="150" ry="18" fill="var(--mountain-mist)" />
          <ellipse cx="470" cy="136" rx="180" ry="20" fill="var(--mountain-mist)" />
        </g>

        {/* Distant ranges establish depth behind the main ascent. */}
        <path
          d="M-40 340 L95 218 L176 254 L296 150 L392 225 L515 128 L604 194 L710 106 L840 235 L840 340 Z"
          fill="url(#mtn-back)"
        />
        <path d="M-20 340 L132 246 L218 273 L337 190 L433 248 L552 166 L655 221 L804 143 L830 340 Z" fill="var(--mountain-mid)" opacity="0.76" />

        {/* Main mountain range: layered faces, gullies and snow shelves. */}
        <path
          d="M0 340 L70 305 L180 258 L320 214 L460 170 L610 118 L736 74 L800 340 Z"
          fill="url(#mtn-body)"
        />
        <path d="M70 305 L180 258 L320 214 L460 170 L610 118 L736 74 L690 155 L625 142 L573 202 L492 190 L425 242 L351 229 L286 282 L196 276 L118 326 Z" fill="var(--mountain-shadow)" opacity="0.72" />
        <path d="M736 74 L700 142 L674 120 L645 165 L610 118 L575 177 L540 164 L510 219 L460 170 L430 226 L394 213 L355 269 L320 214 L286 263 L250 252 L218 302 L180 258 L148 303 L108 292 L70 305 Z" fill="url(#snow-face)" opacity="0.92" />
        <path d="M736 74 L716 119 L701 105 L686 134 L668 122 L650 151 L631 139 L610 118 L586 158 L568 151 L548 181 L526 173 L507 201 L485 189 L460 170 L438 207 L420 199 L399 230 L377 220 L355 250 L337 239 L320 214 L299 247 L281 240 L259 270 L238 262 L218 286 L200 279 L180 258 L159 286 L141 279 L121 307 L98 298 L70 305" fill="none" stroke="var(--mountain-snow)" strokeWidth="2.2" opacity="0.7" />
        <g opacity="0.48" stroke="var(--mountain-ridge-line)" strokeWidth="1">
          <path d="M736 74 L748 230 L800 340" /><path d="M610 118 L640 237 L690 340" />
          <path d="M460 170 L492 272 L548 340" /><path d="M320 214 L352 300 L408 340" />
          <path d="M180 258 L211 317 L270 340" /><path d="M70 305 L106 340" />
        </g>
        <path d="M0 334 Q170 314 315 322 T800 310 L800 340 L0 340 Z" fill="var(--mountain-foreground)" />
        <g className="mountain-mist mountain-mist-front" filter="url(#mist-blur)">
          <ellipse cx="250" cy="302" rx="220" ry="16" fill="var(--mountain-mist)" />
          <ellipse cx="690" cy="244" rx="140" ry="13" fill="var(--mountain-mist)" />
        </g>

        <path d={ridgePath} fill="none" stroke="var(--mountain-route-muted)" strokeWidth="2.5" />

        <path
          d={ridgePath}
          fill="none"
          stroke="url(#mtn-done)"
          strokeWidth="3.5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - progress}
          style={{
            transition: "stroke-dashoffset 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
            filter: "url(#route-glow)",
          }}
        />

        {CAMPS.map((c, i) => {
          const reached = progress >= c.pct;
          const [x, y] = pts[i];
          const above = i === CAMPS.length - 1;
          return (
            <g key={c.key}>
              <circle
                cx={x}
                cy={y}
                r={reached ? 7 : 5}
                fill={reached ? "var(--mountain-gold)" : "var(--mountain-marker)"}
                stroke={reached ? "var(--mountain-gold-bright)" : "var(--mountain-route)"}
                strokeWidth="2"
                style={{
                  filter: reached ? "drop-shadow(0 0 10px var(--mountain-gold))" : "drop-shadow(0 0 5px var(--mountain-route))",
                  transition: "all 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              <text
                x={x}
                y={above ? y - 26 : y - 14}
                textAnchor="middle"
                fontSize="14"
                style={{ pointerEvents: "none" }}
              >
                {c.emoji}
              </text>
              <text
                x={i === 0 ? x - 12 : i === CAMPS.length - 1 ? x + 12 : x}
                y={above ? y - 42 : y + 20}
                textAnchor={i === 0 ? "start" : i === CAMPS.length - 1 ? "end" : "middle"}
                fill={reached ? "var(--mountain-label-active)" : "var(--mountain-label)"}
                fontSize="9.5"
                fontWeight="700"
                style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {CAMP_LABEL[c.key]}
              </text>

            </g>
          );
        })}

      </svg>

      {/* Progress bar to next camp */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1">
            <span>{currentCamp.emoji}</span> {CAMP_LABEL[currentCamp.key]}
          </span>
          {nextCamp ? (
            <span>
              {nextCamp.pct - progress}% to {CAMP_LABEL[nextCamp.key]} {nextCamp.emoji}
            </span>
          ) : (
            <span className="text-yellow">🎉 Summit reached</span>
          )}
        </div>
        <div className="h-2 rounded-full bg-surface overflow-hidden border border-border/60">
          <div
            className="h-full transition-[width] duration-700"
            style={{
              width: nextCamp
                ? `${Math.max(2, ((progress - currentCamp.pct) / Math.max(1, nextCamp.pct - currentCamp.pct)) * 100)}%`
                : "100%",
              background: "linear-gradient(90deg, oklch(0.7 0.22 300), oklch(0.88 0.13 82))",
              boxShadow: "0 0 12px oklch(0.7 0.22 300 / 0.6)",
            }}
          />
        </div>
      </div>

      {/* Countdown strip */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {CAMPS.filter((c) => c.key !== "base").map((c) => {
          const d = daysUntil(dates[c.key]);
          return (
            <div
              key={c.key}
              className="rounded-lg border border-border/60 bg-surface/50 px-3 py-2 transition-colors hover:border-primary/50"
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {CAMP_LABEL[c.key]}
              </div>
              <div className="text-sm font-semibold tabular-nums text-foreground">
                {d > 0 ? `${d} days` : "Done"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contribution breakdown */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Contrib label="Mastered" value={`${green}/${topics}`} hint="Green topics" />
        <Contrib label="Papers" value={papers} hint="Past papers logged" />
        <Contrib label="Assessments" value={assessments} hint="Tracked assessments" />
      </div>
    </div>
  );
}

function Contrib({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface/50 px-3 py-2" title={hint}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-base font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
