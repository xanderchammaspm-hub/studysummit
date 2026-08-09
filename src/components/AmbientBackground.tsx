import { useEffect, useMemo } from "react";
import { usePrefs } from "@/hooks/usePrefs";

/**
 * Living background: a slow nebula galaxy, drifting glow motes and a very
 * faint scientific HUD (grids, graphs, DNA, molecules, equations,
 * constellations). Purely decorative — never interactive.
 *
 * Intensity and motion speed are user preferences; both only affect this
 * background layer, never the glass cards above it.
 */
export function AmbientBackground() {
  const { prefs } = usePrefs();
  const intensity = Math.min(100, Math.max(0, prefs.bgIntensity));
  const speed = Math.min(200, Math.max(0, prefs.bgSpeed));
  const factor = intensity / 100;
  const timeScale = speed === 0 ? 1 : 100 / speed;

  // Pause all background animation while the tab is hidden — zero cost when away.
  useEffect(() => {
    const onVis = () =>
      document.documentElement.classList.toggle("bg-paused", document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.documentElement.classList.remove("bg-paused");
    };
  }, []);

  const moteCount = Math.round(18 * factor);
  const starCount = Math.round(58 * factor);

  const motes = useMemo(
    () =>
      Array.from({ length: moteCount }, (_, i) => ({
        id: i,
        left: (i * 37.5) % 100,
        top: (i * 61.7) % 100,
        size: 1.2 + ((i * 7) % 5) * 0.5,
        dur: 40 + ((i * 13) % 34),
        delay: -((i * 5) % 30),
        hue: i % 3 === 0 ? "oklch(0.9 0.14 85 / 0.32)" : "oklch(0.78 0.2 300 / 0.34)",
      })),
    [moteCount],
  );

  const stars = useMemo(
    () =>
      Array.from({ length: starCount }, (_, i) => ({
        id: i,
        left: (i * 13.37) % 100,
        top: (i * 29.7) % 100,
        size: i % 9 === 0 ? 1.6 : 1,
        delay: -((i * 3) % 12),
      })),
    [starCount],
  );

  if (intensity === 0) return null;


  return (
    <div aria-hidden className="ambient-root">
      {/* Nebula clouds */}
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <div className="nebula nebula-c" />
      <div className="nebula nebula-d" />


      {/* Star field */}
      <div className="absolute inset-0">
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white/70"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animation: `twinkle ${6 + (s.id % 5)}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Scientific HUD — kept under 5% opacity */}
      <svg
        className="absolute inset-0 h-full w-full science-hud"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <pattern id="hud-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" stroke="currentColor" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="1200" height="800" fill="url(#hud-grid)" />

        {/* Graph curve */}
        <path
          d="M40 640 C 160 600, 200 700, 320 560 S 520 420, 640 500 S 860 300, 1160 360"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M40 700 H1160 M40 700 V120" stroke="currentColor" strokeWidth="1" />

        {/* DNA strand */}
        <g transform="translate(60,90)">
          <path d="M0 0 C 40 60, -40 120, 0 180 C 40 240, -40 300, 0 360" stroke="currentColor" strokeWidth="1.4" />
          <path d="M60 0 C 20 60, 100 120, 60 180 C 20 240, 100 300, 60 360" stroke="currentColor" strokeWidth="1.4" />
          {Array.from({ length: 10 }, (_, i) => (
            <line key={i} x1={i % 2 ? 6 : 12} y1={i * 38} x2={i % 2 ? 54 : 48} y2={i * 38} stroke="currentColor" strokeWidth="1" />
          ))}
        </g>

        {/* Molecule */}
        <g transform="translate(960,150)">
          <circle cx="0" cy="0" r="16" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="70" cy="-34" r="11" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="76" cy="46" r="13" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="-58" cy="52" r="9" stroke="currentColor" strokeWidth="1.4" />
          <path d="M14 -6 L59 -30 M15 8 L64 42 M-13 12 L-50 46" stroke="currentColor" strokeWidth="1.2" />
        </g>

        {/* Constellation network */}
        <g transform="translate(700,600)">
          <path d="M0 0 L80 -50 L160 10 L240 -40 M80 -50 L110 40 M160 10 L120 90" stroke="currentColor" strokeWidth="1" />
          {[
            [0, 0],
            [80, -50],
            [160, 10],
            [240, -40],
            [110, 40],
            [120, 90],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="currentColor" />
          ))}
        </g>

        {/* Equations */}
        <text x="330" y="140" fontSize="26" fill="currentColor" fontFamily="ui-monospace, monospace">
          E = mc²
        </text>
        <text x="470" y="220" fontSize="20" fill="currentColor" fontFamily="ui-monospace, monospace">
          F = ma
        </text>
        <text x="180" y="520" fontSize="20" fill="currentColor" fontFamily="ui-monospace, monospace">
          ∫ f(x) dx
        </text>
        <text x="880" y="700" fontSize="22" fill="currentColor" fontFamily="ui-monospace, monospace">
          λ = h / p
        </text>
      </svg>

      {/* Drifting motes */}
      <div className="absolute inset-0">
        {motes.map((m) => (
          <span
            key={m.id}
            className="absolute rounded-full"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              background: m.hue,
              boxShadow: `0 0 ${m.size * 5}px ${m.hue}`,
              animation: `moteDrift ${m.dur}s linear ${m.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default AmbientBackground;
