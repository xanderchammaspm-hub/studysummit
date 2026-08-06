import { useEffect, useState } from "react";

export type CelebrationPayload = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  xp: number;
  ring: string;
  text: string;
};

/**
 * In-place achievement celebration: light burst, minimal confetti,
 * XP count-up and a badge that slides in. No modal, no popup.
 */
export function AchievementCelebration({
  item,
  onDone,
}: {
  item: CelebrationPayload | null;
  onDone: () => void;
}) {
  const [xp, setXp] = useState(0);

  useEffect(() => {
    if (!item) return;
    setXp(0);
    const reduce =
      typeof window !== "undefined" &&
      (document.documentElement.classList.contains("reduce-motion") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    let frame = 0;
    const steps = reduce ? 1 : 28;
    const tick = window.setInterval(() => {
      frame++;
      setXp(Math.round((item.xp * frame) / steps));
      if (frame >= steps) window.clearInterval(tick);
    }, 26);

    const end = window.setTimeout(onDone, reduce ? 2200 : 4200);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(end);
    };
  }, [item, onDone]);

  if (!item) return null;

  const confetti = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {/* Light burst */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 celebrate-burst" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 celebrate-ring" />

      {/* Minimal confetti */}
      {confetti.map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 block h-2 w-1 rounded-[1px]"
          style={{
            background:
              i % 3 === 0
                ? "oklch(0.9 0.17 88)"
                : i % 3 === 1
                  ? "oklch(0.72 0.22 300)"
                  : "oklch(0.86 0.09 250)",
            animation: `confettiFly 1500ms cubic-bezier(0.16,0.9,0.3,1) ${i * 22}ms both`,
            ["--cx" as string]: `${Math.cos((i / 16) * Math.PI * 2) * (140 + (i % 4) * 40)}px`,
            ["--cy" as string]: `${Math.sin((i / 16) * Math.PI * 2) * (110 + (i % 5) * 30)}px`,
            ["--cr" as string]: `${(i % 2 ? 1 : -1) * (180 + i * 24)}deg`,
          }}
        />
      ))}

      {/* Badge slide-in */}
      <div
        className={`absolute right-6 top-24 w-[300px] rounded-2xl border ${item.ring} bg-background/80 p-4 backdrop-blur-xl celebrate-badge`}
        style={{ boxShadow: "0 22px 60px -20px oklch(0.5 0.2 300 / 0.7)" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl celebrate-emoji">{item.emoji}</span>
          <div className="min-w-0">
            <div className={`text-[10px] uppercase tracking-[0.22em] ${item.text}`}>
              Achievement unlocked
            </div>
            <div className="mt-0.5 truncate font-semibold text-foreground">{item.name}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
            <div className="mt-2 text-sm font-semibold tabular-nums gradient-text">
              +{xp} XP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AchievementCelebration;
