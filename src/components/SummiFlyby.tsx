import { useEffect, useRef, useState } from "react";
import summiAsset from "@/assets/summi-mascot-transparent.png.asset.json";

/**
 * Every couple of minutes Summi comets across the background with a glistening
 * star trail. Purely decorative, never interactive, pauses when the tab hides.
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
        window.setTimeout(() => setRun(null), dur * 1000 + 200);
        schedule(85000 + Math.random() * 70000);
      }, delay);
    };

    schedule(18000 + Math.random() * 20000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!run) return null;

  return (
    <div
      key={run.id}
      aria-hidden
      className="summi-flyby pointer-events-none fixed left-0 z-0 will-change-transform"
      style={{
        top: `${run.top}vh`,
        animation: `summiFlyby ${run.dur}s linear forwards`,
      }}
    >
      <div className="relative flex items-center">
        {/* comet trail */}
        <span
          className="absolute right-full mr-1 h-[2px] w-40 origin-right rounded-full"
          style={{
            background:
              "linear-gradient(to left, color-mix(in oklab, var(--primary) 75%, white), transparent)",
            animation: "summiTrail 1.6s ease-in-out infinite",
          }}
        />
        {[0.55, 0.4, 0.28].map((o, i) => (
          <span
            key={i}
            className="absolute right-full rounded-full"
            style={{
              marginRight: 18 + i * 34,
              width: 3 - i * 0.6,
              height: 3 - i * 0.6,
              background: i % 2 ? "oklch(0.9 0.14 82)" : "oklch(0.85 0.16 300)",
              opacity: o,
              boxShadow: "0 0 8px currentColor",
              animation: `twinkle ${2 + i}s ease-in-out infinite`,
            }}
          />
        ))}
        <img
          src={summiAsset.url}
          alt=""
          width={run.size}
          height={run.size}
          className="select-none object-contain opacity-80"
          style={{
            width: run.size,
            height: run.size,
            filter: "drop-shadow(0 0 14px oklch(0.65 0.22 300 / 0.8))",
            animation: "mascotFloat 5s ease-in-out infinite",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default SummiFlyby;
