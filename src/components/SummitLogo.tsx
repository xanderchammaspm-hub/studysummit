import logoSrc from "@/assets/summit-logo.png";

type Props = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  glow?: boolean;
};

export function SummitLogo({
  size = 32,
  className = "",
  withWordmark = false,
  glow = true,
}: Props) {
  const img = (
    <img
      src={logoSrc}
      alt="Summit logo"
      width={size}
      height={size}
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
