import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { CAMPS, useMountainProgress } from "@/hooks/useMountainProgress";

const HIGHEST_KEY = "summit-highest-camp-v1";

export function MountainProgress() {
  const { progress, currentCamp, nextCamp, topics, green, papers, assessments } =
    useMountainProgress();
  const prevCamp = useRef<string | null>(null);

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

  // Ridge waypoints — x/y in SVG coords, one per camp
  const pts: [number, number][] = [
    [45, 300],
    [220, 240],
    [400, 190],
    [580, 130],
    [755, 55],
  ];
  const W = 800;
  const H = 340;
  const mountainPath = `M0,${H} L${pts.map(([x, y]) => `${x},${y}`).join(" L ")} L${W},${H} Z`;
  const ridgePath = `M${pts.map(([x, y]) => `${x},${y}`).join(" L ")}`;

  // Marker position along ridge
  const seg = Math.max(0, Math.min(4, progress / 25));
  const i0 = Math.min(Math.floor(seg), pts.length - 2);
  const t = seg - i0;
  const mx = pts[i0][0] + (pts[i0 + 1][0] - pts[i0][0]) * t;
  const my = pts[i0][1] + (pts[i0 + 1][1] - pts[i0][1]) * t;

  return (
    <div className="mx-auto max-w-4xl purple-outline rounded-2xl bg-card/50 backdrop-blur-sm p-5 sm:p-6 relative overflow-hidden fade-in-up">
      <div className="absolute inset-x-0 top-0 h-px shimmer-line" />

      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Your Climb
          </div>
          <div className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl leading-none">{currentCamp.emoji}</span>
            <span className="gradient-text">{currentCamp.name}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {currentCamp.desc}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-semibold tabular-nums gradient-text leading-none">
            {progress}%
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            {nextCamp ? `Next: ${nextCamp.name}` : "Summited"}
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Mountain progress: ${progress}% — currently at ${currentCamp.name}`}
      >
        <defs>
          <linearGradient id="mtn-body" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.45 0.16 295 / 0.55)" />
            <stop offset="100%" stopColor="oklch(0.18 0.05 285 / 0.9)" />
          </linearGradient>
          <linearGradient id="mtn-done" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.75 0.22 300)" />
            <stop offset="100%" stopColor="oklch(0.88 0.13 82)" />
          </linearGradient>
          <linearGradient id="mtn-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.3 0.1 300 / 0.15)" />
            <stop offset="100%" stopColor="oklch(0.2 0.06 285 / 0)" />
          </linearGradient>
        </defs>

        {/* faint sky wash */}
        <rect x="0" y="0" width={W} height={H} fill="url(#mtn-sky)" />

        {/* Mountain body */}
        <path
          d={mountainPath}
          fill="url(#mtn-body)"
          stroke="oklch(0.55 0.18 295 / 0.5)"
          strokeWidth="1.2"
        />

        {/* Ridge base */}
        <path d={ridgePath} fill="none" stroke="oklch(0.4 0.1 285)" strokeWidth="2" />

        {/* Ridge progress */}
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
            transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)",
            filter: "drop-shadow(0 0 6px oklch(0.7 0.22 300 / 0.6))",
          }}
        />

        {/* Camps */}
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
                fill={reached ? "oklch(0.88 0.13 82)" : "oklch(0.25 0.05 285)"}
                stroke={reached ? "oklch(0.95 0.05 82)" : "oklch(0.55 0.18 295 / 0.7)"}
                strokeWidth="2"
                style={{
                  filter: reached
                    ? "drop-shadow(0 0 8px oklch(0.88 0.13 82 / 0.75))"
                    : "none",
                  transition: "all 500ms ease",
                }}
              />
              <text
                x={x}
                y={above ? y - 26 : y - 14}
                textAnchor="middle"
                fontSize="15"
                style={{ pointerEvents: "none" }}
              >
                {c.emoji}
              </text>
              <text
                x={x}
                y={above ? y - 42 : y + 22}
                textAnchor="middle"
                fill={reached ? "oklch(0.95 0.02 285)" : "oklch(0.6 0.03 285)"}
                fontSize="10"
                fontWeight="700"
                style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {c.name}
              </text>
            </g>
          );
        })}

        {/* Hiker marker */}
        <g
          style={{
            transform: `translate(${mx}px, ${my - 18}px)`,
            transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <circle
            r="11"
            fill="oklch(0.7 0.22 300)"
            stroke="oklch(0.98 0.02 285)"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 12px oklch(0.7 0.22 300 / 0.9))" }}
          />
          <text y="4" textAnchor="middle" fontSize="12" style={{ pointerEvents: "none" }}>
            🚩
          </text>
        </g>
      </svg>

      {/* Progress bar to next camp */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1">
            <span>{currentCamp.emoji}</span> {currentCamp.name}
          </span>
          {nextCamp ? (
            <span>
              {nextCamp.pct - progress}% to {nextCamp.name} {nextCamp.emoji}
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
              background:
                "linear-gradient(90deg, oklch(0.7 0.22 300), oklch(0.88 0.13 82))",
              boxShadow: "0 0 12px oklch(0.7 0.22 300 / 0.6)",
            }}
          />
        </div>
      </div>

      {/* Contribution breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
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
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
