type Props = {
  size?: number;
  className?: string;
  active?: "red" | "amber" | "green" | null;
};

/**
 * Compact traffic-light glyph — sized like a lucide icon.
 * When `active` is set only that light glows; otherwise all three glow softly.
 */
export function TrafficLightIcon({ size = 16, className = "", active }: Props) {
  const w = size;
  const h = size * 1.7;
  const dim = "oklch(0.5 0.02 285 / 0.55)";
  const red = active && active !== "red" ? dim : "oklch(0.65 0.24 25)";
  const amb = active && active !== "amber" ? dim : "oklch(0.82 0.17 85)";
  const grn = active && active !== "green" ? dim : "oklch(0.72 0.19 145)";
  const glow = (c: string, on: boolean) => (on ? { filter: `drop-shadow(0 0 3px ${c})` } : undefined);
  return (
    <svg width={w} height={h} viewBox="0 0 16 27" className={className} aria-hidden>
      <rect
        x="3"
        y="1"
        width="10"
        height="25"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.85"
      />
      <circle cx="8" cy="6.5" r="2.2" fill={red} style={glow("oklch(0.65 0.24 25)", !active || active === "red")} />
      <circle cx="8" cy="13.5" r="2.2" fill={amb} style={glow("oklch(0.82 0.17 85)", !active || active === "amber")} />
      <circle cx="8" cy="20.5" r="2.2" fill={grn} style={glow("oklch(0.72 0.19 145)", !active || active === "green")} />
    </svg>
  );
}
