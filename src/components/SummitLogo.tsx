import logoAsset from "@/assets/summit-logo.webp.asset.json";

export const SUMMIT_LOGO_SRC = logoAsset.url;

type Props = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  glow?: boolean;
  priority?: boolean;
};

export function SummitLogo({
  size = 32,
  className = "",
  withWordmark = false,
  glow = true,
  priority = false,
}: Props) {
  const img = (
    <img
      src={SUMMIT_LOGO_SRC}
      alt="Summit logo"
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      // @ts-expect-error -- fetchpriority is a valid HTML attribute
      fetchpriority={priority ? "high" : undefined}
      className={`shrink-0 select-none ${glow ? "summit-logo-glow" : ""}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
  if (!withWordmark) return <span className={className}>{img}</span>;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {img}
      <span className="text-lg font-semibold tracking-tight gradient-text leading-none">
        Summit
      </span>
    </span>
  );
}

export default SummitLogo;
