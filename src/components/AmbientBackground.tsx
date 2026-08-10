import { useMemo } from "react";

/**
 * Living background: a slow purple nebula galaxy, a deep multi-layer star
 * field, drifting glow motes and occasional shooting stars.
 * Purely decorative — never interactive, always behind the page content.
 */
export function AmbientBackground() {
  const motes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: (i * 37.5) % 100,
        top: (i * 61.7) % 100,
        size: 1.2 + ((i * 7) % 5) * 0.5,
        dur: 40 + ((i * 13) % 34),
        delay: -((i * 5) % 30),
        hue: i % 3 === 0 ? "oklch(0.9 0.14 85 / 0.38)" : "oklch(0.8 0.2 300 / 0.4)",
      })),
    [],
  );

  // Three depth layers: far (small, dim, slow), mid, near (bigger, brighter).
  const starLayers = useMemo(() => {
    const make = (count: number, seed: number, size: number, opacity: number, dur: number) =>
      Array.from({ length: count }, (_, i) => {
        const n = i + seed;
        return {
          id: `${seed}-${i}`,
          left: (n * 47.3) % 100,
          top: (n * 26.9) % 100,
          size: size + ((n * 3) % 3) * 0.35,
          opacity: opacity + ((n * 7) % 4) * 0.06,
          dur: dur + ((n * 5) % 7),
          delay: -((n * 3) % 14),
          tint:
            n % 11 === 0
              ? "oklch(0.9 0.13 85)"
              : n % 7 === 0
                ? "oklch(0.85 0.14 300)"
                : "oklch(0.99 0.01 280)",
        };
      });
    return [
      make(120, 1, 0.8, 0.28, 7),
      make(70, 211, 1.3, 0.45, 5.5),
      make(28, 617, 2.1, 0.6, 4.5),
    ];
  }, []);

  const shooting = useMemo(
    () =>
      [
        { id: 0, top: 8, left: -10, delay: 3, dur: 2.2, every: 17, angle: 18 },
        { id: 1, top: 26, left: -18, delay: 11, dur: 2.8, every: 23, angle: 26 },
        { id: 2, top: 52, left: -12, delay: 19, dur: 2.4, every: 31, angle: 12 },
        { id: 3, top: 70, left: -20, delay: 27, dur: 3, every: 41, angle: 22 },
      ] as const,
    [],
  );

  return (
    <div aria-hidden className="ambient-root">
      {/* Nebula clouds */}
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <div className="nebula nebula-c" />
      <div className="nebula nebula-d" />
      <div className="nebula nebula-e" />

      {/* Star field — three parallax depths */}
      {starLayers.map((layer, li) => (
        <div key={li} className={`star-layer star-layer-${li}`}>
          {layer.map((s) => (
            <span
              key={s.id}
              className="star"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                background: s.tint,
                opacity: s.opacity,
                boxShadow: `0 0 ${s.size * 3}px ${s.tint}`,
                animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
        </div>
      ))}

      {/* Shooting stars — rare, calm streaks */}
      {shooting.map((sh) => (
        <span
          key={sh.id}
          className="shooting-star"
          style={{
            top: `${sh.top}%`,
            left: `${sh.left}%`,
            ["--angle" as string]: `${sh.angle}deg`,
            animation: `shootAcross ${sh.every}s linear ${sh.delay}s infinite`,
          }}
        />
      ))}

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
