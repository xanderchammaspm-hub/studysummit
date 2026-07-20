import { useState } from "react";
import { ChevronDown, FileText, TrafficCone, BookOpen } from "lucide-react";

type Props = {
  index: number;
  name: string;
  year: string;
};

export function SubjectCard({ index, name, year }: Props) {
  const [open, setOpen] = useState(false);
  const label = name.trim() || `Subject ${index + 1}`;

  return (
    <div
      className="purple-outline purple-glow-hover rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group"
      >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated">
              <BookOpen className="h-4 w-4 text-yellow" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-yellow">
                {year} · Subject {index + 1}
              </div>
              <div className="truncate text-lg font-medium">
                {name.trim() ? (
                  <span className="text-foreground">{label}</span>
                ) : (
                  <span className="text-muted-foreground italic">Untitled subject</span>
                )}
              </div>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-yellow transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60 px-5 py-6 space-y-6">
            <Section
              icon={<FileText className="h-4 w-4" />}
              title="Past Paper Resources"
              hint="Add your past papers, links, and files here."
            />
            <Section
              icon={<TrafficCone className="h-4 w-4" />}
              title="Traffic Light System"
              hint="Track topics as red, amber, or green here."
              accent
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  hint,
  accent = false,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
          {title}
        </h3>
        {accent && (
          <span className="ml-auto flex items-center gap-1.5">
            <Dot color="oklch(0.65 0.24 25)" />
            <Dot color="oklch(0.82 0.17 85)" />
            <Dot color="oklch(0.72 0.19 145)" />
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{hint}</p>
      <div className="mt-4 min-h-24 rounded-md border border-dashed border-border/70 bg-background/40" />
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}
