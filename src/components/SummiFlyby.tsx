import { useEffect, useMemo, useRef, useState } from "react";
import summiFlight from "@/assets/summi-comet-flight.png";

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
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        offset: 8 + i * 11,
        size: 2.4 + (i % 4) * 0.9,
        drift: (i % 2 ? 1 : -1) * (5 + (i % 5) * 4),
        delay: (i % 7) * 0.16,
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
        {/* layered nebula wake — soft colour, never a straight white line */}
        <span className="summi-nebula-wake" style={{ width: run.size * 7.4, height: run.size * 1.7 }} />
        <span className="summi-nebula-wake summi-nebula-wake-gold" style={{ width: run.size * 4.8, height: run.size }} />
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
                 animation: `summiSparkTrail ${1.4 + (s.id % 4) * 0.28}s ease-out ${s.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
        {/* Dedicated smiling flight pose with bank, kick and breathing layers. */}
        <div style={{ animation: "summiBob 1.7s ease-in-out infinite" }}>
          <div style={{ animation: "summiBank 2.8s ease-in-out infinite" }}>
            <div
              className="relative"
              style={{
                width: run.size,
                height: run.size,
                animation: "summiSwim 1.3s ease-in-out infinite",
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
                 src={summiFlight}
                alt=""
                width={run.size}
                height={run.size}
                 className="h-full w-full select-none object-contain opacity-95"
                 style={{ filter: "drop-shadow(-8px 4px 16px oklch(0.65 0.22 300 / 0.72))" }}
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
