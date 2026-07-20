import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { yearGroups } from "@/data/subjects";
import { SubjectCard } from "@/components/SubjectCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Hub — Year 11 & 12 Subjects" },
      {
        name: "description",
        content:
          "A personal study hub for Year 11 and Year 12 — past papers and a traffic light progress system for every subject.",
      },
      { property: "og:title", content: "Study Hub — Year 11 & 12 Subjects" },
      {
        property: "og:description",
        content:
          "Organised subject-by-subject study space with past papers and traffic light tracking.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [activeYear, setActiveYear] = useState<"Year 11" | "Year 12">("Year 11");
  const current = yearGroups.find((g) => g.year === activeYear)!;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-30 bg-background/70">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg purple-outline pulse-glow">
              <GraduationCap className="h-5 w-5 text-yellow" />
            </div>
            <div>
              <div className="text-sm text-yellow -mb-1">Study</div>
              <div className="text-lg font-semibold tracking-tight gradient-text">
                Hub
              </div>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-1 rounded-full purple-outline p-1 bg-surface/60">
            {yearGroups.map((g) => (
              <button
                key={g.year}
                onClick={() => setActiveYear(g.year)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                  activeYear === g.year
                    ? "bg-yellow text-yellow-foreground shadow-lg shadow-yellow/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g.year}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full purple-outline bg-surface/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Your personal study space
        </div>
        <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight">
          <span className="gradient-text">Year 11 & 12</span>
          <br />
          <span className="text-foreground">Subject Library</span>
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-muted-foreground">
          Every subject in one place. Drop in your past papers and keep track of
          where you're at with a simple traffic light system.
        </p>
      </section>

      {/* Mobile year switch */}
      <div className="sm:hidden mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-1 rounded-full purple-outline p-1 bg-surface/60 w-full">
          {yearGroups.map((g) => (
            <button
              key={g.year}
              onClick={() => setActiveYear(g.year)}
              className={`flex-1 px-4 py-2 text-sm rounded-full transition-all ${
                activeYear === g.year
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {g.year}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects grid */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {activeYear}
          </h2>
          <span className="text-sm text-muted-foreground">
            {current.slots.length} subjects
          </span>
        </div>

        <div
          key={activeYear}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {current.slots.map((s, i) => (
            <SubjectCard key={s.id} index={i} name={s.name} year={activeYear} />
          ))}
        </div>

        {/* Traffic light legend */}
        <div className="mt-16 purple-outline rounded-xl bg-card/50 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Traffic Light Legend
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Legend
              color="oklch(0.72 0.19 145)"
              title="Green"
              desc="Confident. Ready for the exam."
            />
            <Legend
              color="oklch(0.82 0.17 85)"
              title="Amber"
              desc="Getting there. Needs review."
            />
            <Legend
              color="oklch(0.65 0.24 25)"
              title="Red"
              desc="Weak spot. Prioritise study."
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 mt-8">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-muted-foreground">
          Study Hub · Built for focused revision
        </div>
      </footer>
    </div>
  );
}

function Legend({
  color,
  title,
  desc,
}: {
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface/60 p-4">
      <span
        className="mt-1 h-3 w-3 shrink-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
      />
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
