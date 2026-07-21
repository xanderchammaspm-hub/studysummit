import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GraduationCap, Sparkles, Search, X, Plus, ExternalLink, Link2, Pencil, Check } from "lucide-react";
import { SubjectCard, StatusDot } from "@/components/SubjectCard";
import {
  useSubjects,
  useAllSubjectStates,
  addSubject,
  useQuickLinks,
  updateQuickLink,
  type YearKey,
} from "@/hooks/useSubjectStore";

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

const YEARS: YearKey[] = ["Year 11", "Year 12"];

function Home() {
  const [activeYear, setActiveYear] = useState<YearKey>("Year 11");
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const subjects = useSubjects();
  const store = useAllSubjectStates();
  const quickLinks = useQuickLinks();
  const current = subjects[activeYear] ?? [];


  const stats = useMemo(() => {
    let subjectCount = 0;
    let papers = 0;
    let topics = 0;
    let assessments = 0;
    let red = 0;
    let amber = 0;
    let green = 0;
    for (const y of YEARS) {
      for (const s of subjects[y]) {
        subjectCount++;
        const st = store[s.id];
        if (!st) continue;
        papers += st.papers?.length ?? 0;
        topics += st.topics?.length ?? 0;
        assessments += st.assessments?.length ?? 0;
        for (const t of st.topics ?? []) {
          if (t.status === "red") red++;
          else if (t.status === "amber") amber++;
          else if (t.status === "green") green++;
        }
      }
    }
    const totalStatus = red + amber + green;
    const progress = totalStatus === 0 ? 0 : Math.round((green / totalStatus) * 100);
    return { subjectCount, papers, topics, assessments, red, amber, green, progress };
  }, [subjects, store]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const results: {
      subjectId: string;
      subjectLabel: string;
      year: string;
      kind: "paper" | "topic" | "subject" | "assessment";
      title: string;
      status?: "none" | "red" | "amber" | "green";
    }[] = [];
    for (const y of YEARS) {
      subjects[y].forEach((slot, i) => {
        const subjectLabel = slot.name.trim() || `Subject ${i + 1}`;
        if (subjectLabel.toLowerCase().includes(q)) {
          results.push({
            subjectId: slot.id,
            subjectLabel,
            year: y,
            kind: "subject",
            title: subjectLabel,
          });
        }
        const st = store[slot.id];
        if (!st) return;
        for (const p of st.papers ?? []) {
          if (p.title.toLowerCase().includes(q)) {
            results.push({
              subjectId: slot.id,
              subjectLabel,
              year: y,
              kind: "paper",
              title: p.title,
            });
          }
        }
        for (const a of st.assessments ?? []) {
          if (a.title.toLowerCase().includes(q)) {
            results.push({
              subjectId: slot.id,
              subjectLabel,
              year: y,
              kind: "assessment",
              title: a.title,
            });
          }
        }
        for (const t of st.topics ?? []) {
          if (t.title.toLowerCase().includes(q)) {
            results.push({
              subjectId: slot.id,
              subjectLabel,
              year: y,
              kind: "topic",
              title: t.title,
              status: t.status,
            });
          }
        }
      });
    }
    return results;
  }, [query, store, subjects]);

  const handleAddSubject = () => {
    addSubject(activeYear, newName.trim());
    setNewName("");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-30 bg-background/70">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg purple-outline pulse-glow">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground -mb-1">Study</div>
              <div className="text-lg font-semibold tracking-tight gradient-text">
                Hub
              </div>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-1 rounded-full purple-outline p-1 bg-surface/60">
            {YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                  activeYear === y
                    ? "bg-primary/25 text-foreground border border-primary/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {y}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-8 text-center fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full purple-outline bg-surface/50 px-3 py-1 text-xs text-yellow">
          <Sparkles className="h-3.5 w-3.5 text-yellow" />
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

        {/* Live stats */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2 max-w-3xl mx-auto">
          <Stat label="Subjects" value={stats.subjectCount} />
          <Stat label="Papers" value={stats.papers} />
          <StatTraffic label="Red" value={stats.red} status="red" />
          <StatTraffic label="Amber" value={stats.amber} status="amber" />
          <StatTraffic label="Green" value={stats.green} status="green" />
        </div>
      </section>

      {/* Search */}
      <div className="mx-auto max-w-3xl px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, topics and past papers…"
            className="w-full rounded-full purple-outline bg-surface/60 pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground/70"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile year switch */}
      {!searchResults && (
        <div className="sm:hidden mx-auto max-w-6xl px-6 mt-6">
          <div className="flex items-center gap-1 rounded-full purple-outline p-1 bg-surface/60 w-full">
            {YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className={`flex-1 px-4 py-2 text-sm rounded-full transition-all ${
                  activeYear === y
                    ? "bg-primary/25 text-foreground border border-primary/60"
                    : "text-muted-foreground"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {searchResults ? (
          <SearchResults query={query} results={searchResults} />
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">
                {activeYear}
              </h2>
              <span className="text-sm text-muted-foreground">
                {current.length} subject{current.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Add subject */}
            <div className="mb-6 flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                placeholder={`Add a subject to ${activeYear} (name optional)`}
                className="flex-1 rounded-lg border border-border bg-surface/60 px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={handleAddSubject}
                className="flex items-center gap-1 rounded-lg border border-primary/60 bg-primary/20 px-4 py-2 text-sm text-foreground hover:bg-primary/30"
              >
                <Plus className="h-4 w-4" /> Add subject
              </button>
            </div>

            {current.length === 0 ? (
              <div className="purple-outline rounded-xl bg-card/50 p-10 text-center text-muted-foreground">
                No subjects yet. Add your first one above.
              </div>
            ) : (
              <div
                key={activeYear}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {current.map((s, i) => (
                  <SubjectCard
                    key={s.id}
                    id={s.id}
                    index={i}
                    name={s.name}
                    year={activeYear}
                  />
                ))}
              </div>
            )}

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
          </>
        )}
      </main>

      <footer className="border-t border-border/60 mt-8">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-muted-foreground">
          Study Hub · Built for focused revision
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="purple-outline rounded-lg bg-card/50 px-3 py-2 text-center">
      <div className="text-xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function StatTraffic({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: "red" | "amber" | "green";
}) {
  return (
    <div className="purple-outline rounded-lg bg-card/50 px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <StatusDot status={status} />
        <span className="text-xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SearchResults({
  query,
  results,
}: {
  query: string;
  results: {
    subjectId: string;
    subjectLabel: string;
    year: string;
    kind: "paper" | "topic" | "subject";
    title: string;
    status?: "none" | "red" | "amber" | "green";
  }[];
}) {
  return (
    <div className="fade-in-up">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          Search results
        </h2>
        <span className="text-sm text-muted-foreground">
          {results.length} match{results.length === 1 ? "" : "es"} for "{query}"
        </span>
      </div>
      {results.length === 0 ? (
        <div className="purple-outline rounded-xl bg-card/50 p-10 text-center text-muted-foreground">
          Nothing found. Try a different keyword.
        </div>
      ) : (
        <ul className="space-y-2">
          {results.map((r, i) => (
            <li
              key={`${r.subjectId}-${r.kind}-${i}`}
              className="purple-outline rounded-lg bg-card/60 px-4 py-3 flex items-center gap-3"
            >
              {r.kind === "topic" && r.status ? (
                <StatusDot status={r.status} />
              ) : (
                <span className="text-xs uppercase tracking-widest text-primary/80 w-16">
                  {r.kind}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm text-foreground">
                  {r.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.subjectLabel} · {r.year}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
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
