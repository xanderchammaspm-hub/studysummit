import logoAsset from "@/assets/quick-recall-logo.png.asset.json";

/**
 * "Quick Recall" mark — a stack of glowing glass memory cards carrying a
 * neon brain circuit. Still (never animated), matching the Exam Engine and
 * Summit emblem language.
 */
export function QuickRecallLogo({
  size = 56,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl blur-xl"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--primary) 55%, transparent), transparent 70%)",
        }}
      />
      <img
        src={logoAsset.url}
        alt="Quick Recall"
        width={size}
        height={size}
        className="relative h-full w-full select-none object-contain"
        draggable={false}
        style={{ filter: "drop-shadow(0 6px 18px oklch(0.55 0.2 300 / 0.45))" }}
      />
    </span>
  );
}

export default QuickRecallLogo;
