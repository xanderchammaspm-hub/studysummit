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
  const mountainPath = `M0,${H} L${pts.map(([x, y]) => `${x},${y}`).join(" L ")} L${W},${H} Z`;
  const ridgePath = `M${pts.map(([x, y]) => `${x},${y}`).join(" L ")}`;

  // Marker position along ridge
  const span = 100 / (pts.length - 1);
  const seg = Math.max(0, Math.min(pts.length - 1, progress / span));
  const i0 = Math.min(Math.floor(seg), pts.length - 2);
  const t = seg - i0;
  const mx = pts[i0][0] + (pts[i0 + 1][0] - pts[i0][0]) * t;
  const my = pts[i0][1] + (pts[i0 + 1][1] - pts[i0][1]) * t;

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
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Mountain progress: ${progress}% — currently at ${currentCamp.name}`}
      >
        <defs>
          <linearGradient id="mtn-body" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.21 300 / 0.9)" />
            <stop offset="45%" stopColor="oklch(0.36 0.13 295 / 0.92)" />
            <stop offset="100%" stopColor="oklch(0.15 0.04 285 / 0.96)" />
          </linearGradient>
          <linearGradient id="mtn-back" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.4 0.15 300 / 0.5)" />
            <stop offset="100%" stopColor="oklch(0.16 0.04 285 / 0)" />
          </linearGradient>
          <linearGradient id="mtn-far" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.45 0.12 310 / 0.16)" />
            <stop offset="100%" stopColor="oklch(0.16 0.04 285 / 0)" />
          </linearGradient>
          <linearGradient id="mtn-done" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.75 0.22 300)" />
            <stop offset="60%" stopColor="oklch(0.82 0.18 320)" />
            <stop offset="100%" stopColor="oklch(0.92 0.14 82)" />
          </linearGradient>
          <linearGradient id="mtn-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.34 0.12 305 / 0.3)" />
            <stop offset="55%" stopColor="oklch(0.24 0.08 290 / 0.12)" />
            <stop offset="100%" stopColor="oklch(0.2 0.06 285 / 0)" />
          </linearGradient>
          <linearGradient id="mtn-aurora" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.7 0.2 300 / 0)" />
            <stop offset="45%" stopColor="oklch(0.72 0.2 310 / 0.22)" />
            <stop offset="100%" stopColor="oklch(0.88 0.14 82 / 0)" />
          </linearGradient>
          <radialGradient id="summit-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.95 0.14 82 / 0.9)" />
            <stop offset="100%" stopColor="oklch(0.9 0.13 82 / 0)" />
          </radialGradient>
          <radialGradient id="moon-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.96 0.06 90 / 0.5)" />
            <stop offset="100%" stopColor="oklch(0.96 0.06 90 / 0)" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#mtn-sky)" />

        {/* Aurora ribbon */}
        <path
          d="M-40,90 C160,30 320,120 500,60 C640,14 740,80 860,44 L860,0 L-40,0 Z"
          fill="url(#mtn-aurora)"
          className="mtn-aurora"
        />

        {/* Summit crown corona — permanent HSC beacon, intensifies near summit */}
        <g
          style={{
            opacity: 0.45 + Math.min(0.55, progress / 100) * 0.55,
            transition: "opacity 900ms ease",
            transformOrigin: `${pts[5][0]}px ${pts[5][1]}px`,
            animation: "crownPulse 3.6s ease-in-out infinite",
          }}
        >
          <path
            d={`M${pts[5][0] - 34},${pts[5][1] + 10} L${pts[5][0] - 22},${pts[5][1] - 34} L${pts[5][0] - 8},${pts[5][1] - 12} L${pts[5][0]},${pts[5][1] - 42} L${pts[5][0] + 8},${pts[5][1] - 12} L${pts[5][0] + 22},${pts[5][1] - 34} L${pts[5][0] + 34},${pts[5][1] + 10} Q${pts[5][0]},${pts[5][1] + 18} ${pts[5][0] - 34},${pts[5][1] + 10} Z`}
            fill="oklch(0.92 0.14 82 / 0.22)"
            stroke="oklch(0.9 0.14 82 / 0.65)"
            strokeWidth="1.4"
            style={{ filter: "drop-shadow(0 0 18px oklch(0.9 0.14 82 / 0.85))" }}
          />
          <circle
            cx={pts[5][0]}
            cy={pts[5][1]}
            r={44}
            fill="url(#summit-glow)"
            opacity={0.55}
          />
        </g>



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

        <g style={{ opacity: 0.35 }}>
          <ellipse cx="0" cy="140" rx="55" ry="9" fill="oklch(0.9 0.03 285)"
            style={{ animation: "cloudDrift 38s linear infinite" }} />
          <ellipse cx="0" cy="210" rx="70" ry="11" fill="oklch(0.85 0.04 285)"
            style={{ animation: "cloudDrift 55s linear -18s infinite" }} />
          <ellipse cx="0" cy="90" rx="40" ry="7" fill="oklch(0.92 0.03 285)"
            style={{ animation: "cloudDrift 46s linear -30s infinite" }} />
        </g>

        {/* Far haze ridge */}
        <path
          d={`M-60,${H} L110,236 L230,188 L360,232 L520,168 L680,214 L${W + 60},${H} Z`}
          fill="url(#mtn-far)"
        />

        <path
          d={`M-50,${H} L120,180 L280,120 L440,175 L620,90 L820,200 L${W + 50},${H} Z`}
          fill="url(#mtn-back)"
        />

        <path
          d={mountainPath}
          fill="url(#mtn-body)"
          stroke="oklch(0.66 0.21 300 / 0.6)"
          strokeWidth="1.2"
        />


        {pts.map(([x, y], i) => {
          const reached = progress >= CAMPS[i].pct;
          const size = reached ? 12 + i * 1.6 : 6;
          return (
            <path
              key={`snow${i}`}
              d={`M${x - size},${y + size * 0.6} Q${x - size / 2},${y + 2} ${x},${y + size * 0.2} Q${x + size / 2},${y + 2} ${x + size},${y + size * 0.6} Z`}
              fill="oklch(0.98 0.01 285)"
              opacity={reached ? 0.9 : 0.25}
              style={{ transition: "all 700ms ease" }}
            />
          );
        })}

        <path d={ridgePath} fill="none" stroke="oklch(0.4 0.1 285)" strokeWidth="2" />

        <path
          d={ridgePath}
          fill="none"
          stroke="url(#mtn-done)"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - progress}
          style={{
            transition: "stroke-dashoffset 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
            filter: "drop-shadow(0 0 8px oklch(0.75 0.22 300 / 0.75))",
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
                fill={reached ? "oklch(0.9 0.14 82)" : "oklch(0.25 0.05 285)"}
                stroke={reached ? "oklch(0.96 0.06 82)" : "oklch(0.55 0.18 295 / 0.7)"}
                strokeWidth="2"
                style={{
                  filter: reached ? "drop-shadow(0 0 10px oklch(0.9 0.14 82 / 0.85))" : "none",
                  transition: "all 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              <text
                x={x}
                y={above ? y - 26 : y - 14}
                textAnchor="middle"
                fontSize="14"
                style={{
                  pointerEvents: "none",
                  filter: above
                    ? "drop-shadow(0 0 8px oklch(0.9 0.14 82 / 0.9))"
                    : "none",
                }}
              >
                {c.emoji}
              </text>

              <text
                x={i === 0 ? x - 12 : i === CAMPS.length - 1 ? x + 12 : x}
                y={above ? y - 42 : y + 20}
                textAnchor={i === 0 ? "start" : i === CAMPS.length - 1 ? "end" : "middle"}
                fill={reached ? "oklch(0.95 0.02 285)" : "oklch(0.6 0.03 285)"}
                fontSize="9.5"
                fontWeight="700"
                style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {CAMP_LABEL[c.key]}
              </text>

            </g>
          );
        })}

        <g
          style={{
            transform: `translate(${mx}px, ${my}px)`,
            transition: "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          className="mtn-waypoint"
        >
          <circle r="22" fill="url(#summit-glow)" opacity="0.75" />
          <circle
            r="15"
            fill="none"
            stroke="oklch(0.9 0.14 82 / 0.55)"
            strokeWidth="1.5"
            style={{ animation: "ringPulse 2.4s ease-out infinite", transformOrigin: "center" }}
          />
          <circle
            r="8"
            fill="oklch(0.92 0.15 84)"
            stroke="oklch(0.99 0.05 82)"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 10px oklch(0.9 0.14 82 / 0.95))" }}
          />
          <circle r="3" fill="oklch(0.99 0.03 90)" opacity="0.9" />
        </g>


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
