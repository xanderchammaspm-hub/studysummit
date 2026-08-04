import { useEffect, useState } from "react";
import { SummitLogo } from "@/components/SummitLogo";

/** Cinematic mountain-logo intro that dissolves into the app. */
export function SummitSplash() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("out"), 1500);
    const t2 = window.setTimeout(() => setPhase("gone"), 2350);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
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
        transform: phase === "out" ? "scale(1.06)" : "scale(1)",
        transition: "opacity 800ms cubic-bezier(0.22,1,0.36,1), transform 800ms cubic-bezier(0.22,1,0.36,1)",
        pointerEvents: phase === "out" ? "none" : "auto",
      }}
    >
      <div className="aurora" />
      <div className="relative flex flex-col items-center gap-5">
        <div
          style={{
            animation: "splashRise 900ms cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <SummitLogo size={96} />
        </div>
        <div className="overflow-hidden">
          <h1
            className="text-4xl font-semibold tracking-[0.3em] gradient-text"
            style={{ animation: "splashRise 900ms 180ms cubic-bezier(0.22,1,0.36,1) both" }}
          >
            SUMMIT
          </h1>
        </div>
        <div className="h-px w-40 shimmer-line" />
      </div>
      <style>{`
        @keyframes splashRise {
          from { opacity: 0; transform: translateY(18px) scale(0.94); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}

export default SummitSplash;
