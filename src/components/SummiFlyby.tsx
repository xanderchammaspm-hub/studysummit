import { useEffect, useMemo, useRef, useState } from "react";
import summiAsset from "@/assets/summi-mascot-transparent.png.asset.json";

/**
 * Every couple of minutes Summi comets across the background: he swoops in an
 * arc, tumbles and paddles his little limbs, and leaves a glistening tapered
 * star trail behind him. Purely decorative, never interactive, pauses when the
 * tab hides and disabled under reduced motion.
 */
export function SummiFlyby() {
  const [run, setRun] = useState<{ id: number; top: number; dur: number; size: number } | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let timeout: number;

    const schedule = (delay: number) => {
      timeout = window.setTimeout(() => {
        if (document.hidden) {
          schedule(20000);
          return;
        }
        seq.current += 1;
        const dur = 11 + Math.random() * 5;
        setRun({
          id: seq.current,
          top: 8 + Math.random() * 42,
          dur,
          size: 26 + Math.random() * 18,
        });
        window.setTimeout(() => setRun(null), dur * 1000 + 400);
        schedule(85000 + Math.random() * 70000);
      }, delay);
    };

    schedule(18000 + Math.random() * 20000);
    return () => window.clearTimeout(timeout);
  }, []);

  const sparkles = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        offset: 14 + i * 16,
        size: 3.4 - (i % 4) * 0.5,
        drift: (i % 2 ? 1 : -1) * (4 + (i % 3) * 5),
        delay: i * 0.13,
        gold: i % 3 === 0,
      })),
    [],
  );

  if (!run) return null;

  return (
    <div
      key={run.id}
      aria-hidden
      className="summi-flyby pointer-events-none fixed left-0 z-0 will-change-transform"
      style={{
        top: `${run.top}vh`,
        animation: `summiFlyby ${run.dur}s cubic-bezier(0.42,0,0.58,1) forwards`,
      }}
    >
      <div className="relative flex items-center">
        {/* tapered comet trail */}
        <span
          className="absolute right-full mr-1 origin-right rounded-full"
          style={{
            height: run.size * 0.16,
            width: run.size * 5.5,
            background:
              "linear-gradient(to left, color-mix(in oklab, var(--primary) 85%, white), color-mix(in oklab, var(--primary) 45%, transparent) 45%, transparent)",
            filter: "blur(2px)",
            clipPath: "polygon(0% 0%, 100% 45%, 100% 55%, 0% 100%)",
            animation: "summiTrail 1.4s ease-in-out infinite",
          }}
        />
        {/* glistening star specks shedding off the trail */}
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="absolute right-full rounded-[1px]"
            style={
              {
                marginRight: s.offset,
                width: s.size,
                height: s.size,
                background: s.gold ? "oklch(0.92 0.15 85)" : "oklch(0.88 0.16 300)",
                color: s.gold ? "oklch(0.92 0.15 85)" : "oklch(0.88 0.16 300)",
                boxShadow: "0 0 10px currentColor",
                "--drift": `${s.drift}px`,
                animation: `summiSparkTrail ${1.5 + (s.id % 3) * 0.4}s ease-out ${s.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
        {/* Summi himself — tumbling and paddling, not idling */}
        <div
          className="relative"
          style={{
            width: run.size,
            height: run.size,
            animation: `summiTumble ${2.6}s ease-in-out infinite`,
          }}
        >
          {([-1, 1] as const).map((side) => (
            <span
              key={side}
              className="absolute rounded-full"
              style={
                {
                  top: "58%",
                  [side < 0 ? "left" : "right"]: "-6%",
                  width: run.size * 0.18,
                  height: run.size * 0.11,
                  background: "color-mix(in oklab, var(--primary) 70%, white)",
                  boxShadow: "0 0 8px color-mix(in oklab, var(--primary) 70%, transparent)",
                  transformOrigin: side < 0 ? "right center" : "left center",
                  opacity: 0.7,
                  animation: `${side < 0 ? "mascotLimbL" : "mascotLimbR"} 0.9s ease-in-out infinite`,
                } as React.CSSProperties
              }
            />
          ))}
          <img
            src={summiAsset.url}
            alt=""
            width={run.size}
            height={run.size}
            className="h-full w-full select-none object-contain opacity-85"
            style={{ filter: "drop-shadow(0 0 14px oklch(0.65 0.22 300 / 0.8))" }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

export default SummiFlyby;
