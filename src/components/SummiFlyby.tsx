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
            height: run.size * 0.2,
            width: run.size * 6.5,
            background:
              "linear-gradient(to left, color-mix(in oklab, var(--primary) 90%, white), color-mix(in oklab, var(--primary) 40%, transparent) 40%, transparent)",
            filter: "blur(3px)",
            clipPath: "polygon(0% 12%, 100% 47%, 100% 53%, 0% 88%)",
            animation: "summiTrail 1.8s ease-in-out infinite",
          }}
        />
        {/* glistening star specks shedding off the trail */}
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="absolute right-full"
            style={
              {
                marginRight: s.offset,
                width: s.size,
                height: s.size,
                background: s.gold ? "oklch(0.92 0.15 85)" : "oklch(0.88 0.16 300)",
                color: s.gold ? "oklch(0.92 0.15 85)" : "oklch(0.88 0.16 300)",
                clipPath:
                  "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)",
                boxShadow: "0 0 12px currentColor",
                "--drift": `${s.drift}px`,
                animation: `summiSparkTrail ${1.5 + (s.id % 3) * 0.4}s ease-out ${s.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
        {/* Summi himself — bobbing, banking and swimming through the sky */}
        <div style={{ animation: "summiBob 2.1s ease-in-out infinite" }}>
          <div style={{ animation: "summiBank 3.4s ease-in-out infinite" }}>
            <div
              className="relative"
              style={{
                width: run.size,
                height: run.size,
                animation: "summiSwim 1.6s ease-in-out infinite",
              }}
            >
              <span
                className="absolute inset-0 rounded-full blur-xl"
                style={{
                  background:
                    "radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--primary) 65%, transparent), transparent 70%)",
                }}
              />
              <img
                src={summiAsset.url}
                alt=""
                width={run.size}
                height={run.size}
                className="h-full w-full select-none object-contain opacity-90"
                style={{ filter: "drop-shadow(0 0 14px oklch(0.65 0.22 300 / 0.8))" }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default SummiFlyby;
