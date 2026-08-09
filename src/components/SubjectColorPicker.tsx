import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";

/** Curated glossy accents that all sit well on the dark purple base. */
export const SUBJECT_PRESETS: { name: string; hex: string }[] = [
  { name: "Summit Purple", hex: "#A855F7" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Royal", hex: "#4F46E5" },
  { name: "Magenta", hex: "#D946EF" },
  { name: "Fuchsia", hex: "#E879F9" },
  { name: "Rose", hex: "#FB7185" },
  { name: "Crimson", hex: "#F43F5E" },
  { name: "Ember", hex: "#F97316" },
  { name: "Gold", hex: "#FDE047" },
  { name: "Amberlight", hex: "#FBBF24" },
  { name: "Lime", hex: "#A3E635" },
  { name: "Emerald", hex: "#34D399" },
  { name: "Jade", hex: "#10B981" },
  { name: "Teal", hex: "#2DD4BF" },
  { name: "Cyan", hex: "#22D3EE" },
  { name: "Ice", hex: "#7DD3FC" },
  { name: "Sky", hex: "#38BDF8" },
  { name: "Steel", hex: "#94A3B8" },
  { name: "Sand", hex: "#E7CBA9" },
];

export const DEFAULT_SUBJECT_COLOR = "#A855F7";

function hslToHex(h: number, s: number, l: number) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

/** Glossy accent picker: presets, free hue/saturation/lightness and hex entry. */
export function SubjectColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [hue, setHue] = useState(280);
  const [sat, setSat] = useState(85);
  const [lig, setLig] = useState(65);
  const [hex, setHex] = useState(value);
  const first = useRef(true);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setHex(value), [value]);

  useEffect(() => {
    if (!open) return;
    const rect = wrap.current?.getBoundingClientRect();
    if (rect) setAlignRight(rect.left + 320 > window.innerWidth - 16);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange(hslToHex(hue, sat, lig));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hue, sat, lig]);

  return (
    <div className="relative" ref={wrap}>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors"
        style={{
          borderColor: `color-mix(in oklab, ${value} 55%, transparent)`,
          background: `linear-gradient(140deg, color-mix(in oklab, ${value} 40%, transparent), color-mix(in oklab, ${value} 8%, transparent))`,
          boxShadow: `0 0 18px -6px color-mix(in oklab, ${value} 70%, transparent)`,
        }}
        aria-label="Change subject colour"
        title="Change subject colour"
      >
        <Palette className="h-4 w-4" style={{ color: value }} />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            aria-label="Close colour picker"
          />
          <div
            className={`absolute z-50 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover/95 p-4 shadow-2xl backdrop-blur-xl animate-scale-in ${
              alignRight ? "right-0" : "left-0"
            }`}
          >
            <div className="section-label mb-2">Subject colour</div>
            <div className="grid grid-cols-10 gap-2">

              {SUBJECT_PRESETS.map((p) => (
                <button
                  key={p.hex}
                  title={p.name}
                  onClick={() => {
                    onChange(p.hex);
                    setOpen(false);
                  }}
                  className="relative h-6 w-6 rounded-md transition-transform hover:scale-110"
                  style={{
                    background: `linear-gradient(140deg, ${p.hex}, color-mix(in oklab, ${p.hex} 55%, black))`,
                    boxShadow: `0 0 12px -4px ${p.hex}`,
                  }}
                >
                  {value.toLowerCase() === p.hex.toLowerCase() && (
                    <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-black/80" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <Slider label="Hue" min={0} max={360} value={hue} onChange={setHue} track="linear-gradient(90deg,#f43f5e,#fbbf24,#a3e635,#2dd4bf,#38bdf8,#a855f7,#f43f5e)" />
              <Slider
                label="Saturation"
                min={0}
                max={100}
                value={sat}
                onChange={setSat}
                track={`linear-gradient(90deg, ${hslToHex(hue, 0, lig)}, ${hslToHex(hue, 100, lig)})`}
              />
              <Slider
                label="Lightness"
                min={20}
                max={90}
                value={lig}
                onChange={setLig}
                track={`linear-gradient(90deg, ${hslToHex(hue, sat, 20)}, ${hslToHex(hue, sat, 90)})`}
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-7 w-7 shrink-0 rounded-md"
                style={{
                  background: `linear-gradient(140deg, ${value}, color-mix(in oklab, ${value} 55%, black))`,
                  boxShadow: `0 0 14px -4px ${value}`,
                }}
              />
              <input
                value={hex}
                onChange={(e) => {
                  const v = e.target.value;
                  setHex(v);
                  if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(v.trim())) onChange(v.trim());
                }}
                placeholder="#A855F7"
                className="w-full rounded-md border border-border bg-background/60 px-2 py-1.5 font-mono text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  track,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  track: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full appearance-none rounded-full outline-none"
        style={{ background: track }}
      />
    </label>
  );
}

export default SubjectColorPicker;
