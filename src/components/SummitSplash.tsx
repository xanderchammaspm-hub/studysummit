import { useEffect, useState } from "react";
import { SummitLogo } from "@/components/SummitLogo";

const SEEN_KEY = "summit-splash-seen-v1";

/** Cinematic mountain-logo intro that dissolves into the app. */
export function SummitSplash() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">(() => {
    if (typeof window === "undefined") return "in";
    try {
      if (sessionStorage.getItem(SEEN_KEY) === "1") return "gone";
    } catch {
      /* ignore */
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "gone";
    if (document.documentElement.classList.contains("reduce-motion")) return "gone";
    return "in";
  });

  useEffect(() => {
    if (phase === "gone") return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }

    let t2 = 0;
    const dismiss = () => {
      setPhase((p) => (p === "in" ? "out" : p));
      window.clearTimeout(t2);
      t2 = window.setTimeout(() => setPhase("gone"), 700);
    };

    const t1 = window.setTimeout(dismiss, 2200);
    window.addEventListener("pointerdown", dismiss, { once: true });
    window.addEventListener("keydown", dismiss, { once: true });
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 40%, oklch(0.22 0.06 300) 0%, oklch(0.13 0.03 290) 60%, oklch(0.11 0.02 285) 100%)",
        opacity: phase === "out" ? 0 : 1,
        transform: phase === "out" ? "scale(1.05)" : "scale(1)",
        transition:
          "opacity 680ms cubic-bezier(0.22,1,0.36,1), transform 680ms cubic-bezier(0.22,1,0.36,1)",
        willChange: "opacity, transform",
        contain: "strict",
        pointerEvents: "none",
      }}
    >

      <div className="aurora" />

      {/* Soft expanding halo behind the mark */}
      <div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.7 0.22 300 / 0.28) 0%, oklch(0.7 0.22 300 / 0.08) 45%, transparent 70%)",
          animation: "splashHalo 2600ms cubic-bezier(0.22,1,0.36,1) both",
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <div style={{ animation: "splashRise 1100ms cubic-bezier(0.22,1,0.36,1) both" }}>
          <SummitLogo size={110} />
        </div>
        <div className="overflow-hidden">
          <h1
            className="text-4xl font-semibold tracking-[0.34em] gradient-text"
            style={{ animation: "splashRise 1100ms 240ms cubic-bezier(0.22,1,0.36,1) both" }}
          >
            SUMMIT
          </h1>
        </div>
        <p
          className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground"
          style={{ animation: "splashRise 1000ms 520ms cubic-bezier(0.22,1,0.36,1) both" }}
        >
          Climb higher. Study smarter.
        </p>
        <div className="relative h-px w-52 overflow-hidden rounded-full bg-border/60">
          <span
            className="absolute inset-y-0 left-0 block rounded-full"
            style={{
              background: "linear-gradient(90deg, oklch(0.72 0.22 300), oklch(0.9 0.13 82))",
              animation: "splashBar 2500ms cubic-bezier(0.4,0,0.2,1) both",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splashRise {
          from { opacity: 0; transform: translateY(20px) scale(0.93); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes splashHalo {
          from { opacity: 0; transform: scale(0.6); }
          60% { opacity: 1; }
          to { opacity: 0.85; transform: scale(1.15); }
        }
        @keyframes splashBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default SummitSplash;
