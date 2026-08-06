import { rankStyle } from "@/lib/progression";

type Props = {
  name: string;
  rankName: string;
  level?: number;
  emoji?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Rank-coloured nameplate. The name gradient, border and glow all upgrade as
 * the climber levels up — top ranks also earn an animated sheen.
 */
export function Nameplate({ name, rankName, level, emoji, size = "md", className = "" }: Props) {
  const s = rankStyle(rankName);
  const pad = size === "sm" ? "px-2.5 py-1" : size === "lg" ? "px-4 py-2" : "px-3 py-1.5";
  const text = size === "sm" ? "text-[13px]" : size === "lg" ? "text-lg" : "text-sm";

  return (
    <span
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full ${pad} ${className} ${
        s.animated ? "nameplate-sheen" : ""
      }`}
      style={{
        background: s.fill,
        border: `1px solid ${s.border}`,
        boxShadow: s.glow,
        backdropFilter: "blur(10px)",
      }}
      title={`${rankName}${level ? ` · Level ${level}` : ""}`}
    >
      {emoji && <span className="text-xs leading-none">{emoji}</span>}
      <span
        className={`font-semibold leading-none tracking-tight ${text}`}
        style={{
          backgroundImage: s.nameGradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {name}
      </span>
      {level != null && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
          style={{ background: "oklch(0.14 0.02 285 / 0.55)", color: "oklch(0.9 0.03 285)" }}
        >
          {level}
        </span>
      )}
    </span>
  );
}

export default Nameplate;
