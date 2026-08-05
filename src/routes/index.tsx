import { normalizeUrl } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Search, X, Plus, ExternalLink, Link2, Pencil, Check, BookOpen, FileText, BellRing } from "lucide-react";
import { SubjectCard, StatusDot } from "@/components/SubjectCard";
import { AICoach } from "@/components/AICoach";
import { MountainProgress } from "@/components/MountainProgress";
import { StudyCalendar } from "@/components/StudyCalendar";
import { TrafficLightIcon } from "@/components/TrafficLightIcon";
import { SummitLogo } from "@/components/SummitLogo";
import { ExamEngineLogo } from "@/components/ExamEngineLogo";
import { EnglishFormula } from "@/components/EnglishFormula";
import { UpcomingExams } from "@/components/UpcomingExams";
import { DailyPlan } from "@/components/DailyPlan";
import { AccountMenu, SaveIndicator } from "@/components/AccountMenu";


import {
  useSubjects,
  useAllSubjectStates,
  flattenSubject,
  addSubject,
  useQuickLinks,
  updateQuickLink,
  type YearKey,
} from "@/hooks/useSubjectStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Summit — Year 11 & 12 Study Hub" },
      {
        name: "description",
        content:
          "Summit is a personal study hub for Year 11 and Year 12 — past papers, assessments, and a traffic light progress system for every subject.",
      },
      { property: "og:title", content: "Summit — Year 11 & 12 Study Hub" },
      {
        property: "og:description",
        content:
          "Summit is a personal study hub for Year 11 and Year 12 — past papers, assessments, and a traffic light progress system for every subject.",
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
        const flat = flattenSubject(st);
        papers += flat.papers.length;
        topics += flat.topics.length;
        assessments += flat.assessments.length;
        for (const t of flat.topics) {
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
        const st = flattenSubject(store[slot.id]);
        for (const p of st.papers) {
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
        for (const a of st.assessments) {
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
        for (const t of st.topics) {
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

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const upcoming = useMemo(() => {
    const items: { id: string; title: string; subject: string; year: string; due: string; days: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const y of YEARS) {
      subjects[y].forEach((slot, i) => {
        const subjectLabel = slot.name.trim() || `Subject ${i + 1}`;
        const st = flattenSubject(store[slot.id]);
        for (const a of st.assessments) {
          if (!a.due) continue;
          const target = new Date(a.due + "T00:00:00");
          if (Number.isNaN(target.getTime())) continue;
          const days = Math.round((target.getTime() - today.getTime()) / 86400000);
          if (days < -1) continue;
          items.push({ id: a.id, title: a.title, subject: subjectLabel, year: y, due: a.due, days });
        }
      });
    }
    return items.sort((a, b) => a.days - b.days).slice(0, 4);
  }, [subjects, store]);

  return (
    <div className="min-h-screen relative">
      <div className="aurora" aria-hidden />

      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-30 bg-background/70">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SummitLogo size={38} />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                HSC Study
              </div>
              <div className="text-lg font-semibold tracking-tight gradient-text">
                Summit
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/exam"
              className="hidden md:inline-flex items-center gap-2 rounded-full purple-outline purple-glow-hover bg-surface/60 py-1 pl-1.5 pr-4 text-sm transition-transform hover:scale-[1.03]"
            >
              <ExamEngineLogo size={26} />
              Exam Engine
            </Link>

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
            <SaveIndicator />
            <AccountMenu />
          </div>
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

        {/* Mountain progression — the core experience */}
        <div className="mt-10">
          <MountainProgress />
        </div>

        {/* Live stats + progress */}
        <StatsPanel stats={stats} />
      </section>

      {/* Quick links */}
      <div className="mx-auto max-w-3xl px-6 mb-6">
        <div className="purple-outline rounded-xl bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Quick Links
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {quickLinks.map((l) => (
              <QuickLinkTile key={l.id} link={l} />
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming assessments */}
      {upcoming.length > 0 && (
        <div className="mx-auto max-w-3xl px-6 mb-6 fade-in-up">
          <div className="purple-outline rounded-xl bg-card/50 p-4 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px shimmer-line" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow">⏰</span>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Upcoming
              </h3>
            </div>
            <ul className="space-y-1.5">
              {upcoming.map((u) => {
                const label =
                  u.days < 0
                    ? `${-u.days}d overdue`
                    : u.days === 0
                      ? "Today"
                      : u.days === 1
                        ? "Tomorrow"
                        : `In ${u.days} days`;
                const color =
                  u.days < 0
                    ? "oklch(0.65 0.24 25)"
                    : u.days <= 7
                      ? "oklch(0.82 0.17 85)"
                      : "oklch(0.72 0.19 145)";
                return (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 rounded-md border border-border/40 bg-surface/40 px-3 py-2 text-sm"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                    <span className="flex-1 truncate">{u.title}</span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:block">
                      {u.subject} · {u.year}
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold"
                      style={{ color }}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Study calendar */}
      <StudyCalendar />

      {/* Upcoming exams countdown */}
      <UpcomingExams />

      {/* Today's plan */}
      <DailyPlan />






      {/* Search */}
      <div className="mx-auto max-w-3xl px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, topics, papers… (press /)"
            className="w-full rounded-full purple-outline bg-surface/60 pl-10 pr-16 py-2.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground/70"
          />
          <kbd className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 hidden sm:block rounded border border-border/60 bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
            /
          </kbd>
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
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <TrafficLightIcon size={14} className="text-primary" />
                Traffic Light Legend
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Legend
                  color="oklch(0.72 0.19 145)"
                  title="Green"
                  desc="Confident. Ready for the exam."
                  active="green"
                />
                <Legend
                  color="oklch(0.82 0.17 85)"
                  title="Yellow"
                  desc="Getting there. Needs review."
                  active="amber"
                />
                <Legend
                  color="oklch(0.65 0.24 25)"
                  title="Red"
                  desc="Weak spot. Prioritise study."
                  active="red"
                />
              </div>
            </div>

            {/* English Formula */}
            <EnglishFormula />
          </>
        )}
      </main>


      <footer className="border-t border-border/60 mt-8">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <SummitLogo size={18} glow={false} />
          <span>Summit · Built for focused revision</span>
        </div>
      </footer>
      <AICoach />
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
    kind: "paper" | "topic" | "subject" | "assessment";
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
  active,
}: {
  color: string;
  title: string;
  desc: string;
  active: "red" | "amber" | "green";
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface/60 p-4">
      <TrafficLightIcon size={18} active={active} className="text-muted-foreground mt-0.5 shrink-0" />
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

function ProgressRing({ value }: { value: number }) {
  const size = 96;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="oklch(0.3 0.05 285 / 0.4)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="oklch(0.7 0.2 300)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 600ms ease",
            filter: "drop-shadow(0 0 6px oklch(0.7 0.2 300 / 0.6))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-semibold gradient-text">{value}%</div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
          Mastered
        </div>
      </div>
    </div>
  );
}

function QuickLinkTile({
  link,
}: {
  link: { id: string; label: string; url: string; emoji?: string; iconUrl?: string };
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(link.url);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const save = () => {
    updateQuickLink(link.id, { url: draft.trim() });
    setEditing(false);
  };
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateQuickLink(link.id, { iconUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };
  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border bg-surface/60 px-3 py-2 transition-all ${
        dragOver
          ? "border-primary bg-primary/10 shadow-[0_0_0_2px_var(--color-primary)]"
          : "border-border/60 hover:border-primary/60"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
    >
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative h-10 w-10 shrink-0 rounded-lg border border-border bg-surface-elevated flex items-center justify-center overflow-hidden hover:border-primary/70 transition-colors"
        title={link.iconUrl ? "Replace icon" : "Drop an image here or click to upload"}
      >
        {link.iconUrl ? (
          <img src={link.iconUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg">{link.emoji ?? "🔗"}</span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {link.url ? (
            <a
              href={normalizeUrl(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ) : (
            <div className="text-sm font-medium text-foreground truncate">{link.label}</div>
          )}
          {link.iconUrl && (
            <button
              onClick={() => updateQuickLink(link.id, { iconUrl: undefined })}
              className="text-[10px] text-muted-foreground hover:text-destructive"
              title="Reset icon"
            >
              reset
            </button>
          )}
        </div>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            onBlur={save}
            placeholder="Paste link…"
            className="w-full bg-transparent text-xs text-muted-foreground outline-none border-b border-primary/40 focus:border-primary"
          />
        ) : link.url ? (
          <a
            href={normalizeUrl(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary truncate block"
          >
            {link.url}
          </a>
        ) : (
          <div className="text-xs text-muted-foreground/60 italic">
            No link yet — click edit to add
          </div>
        )}
      </div>
      {link.url && !editing && (
        <a
          href={normalizeUrl(link.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary opacity-70 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity"
          aria-label="Open in new tab"
          title="Opens in a new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      <button
        onClick={() => (editing ? save() : setEditing(true))}
        className="text-muted-foreground hover:text-primary"
        aria-label={editing ? "Save" : "Edit"}
      >
        {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function StatsPanel({
  stats,
}: {
  stats: {
    subjectCount: number;
    papers: number;
    topics: number;
    assessments: number;
    red: number;
    amber: number;
    green: number;
    progress: number;
  };
}) {
  const total = stats.red + stats.amber + stats.green;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  const bars = [
    { key: "green", value: stats.green, color: "oklch(0.72 0.19 145)", label: "Green" },
    { key: "amber", value: stats.amber, color: "oklch(0.82 0.17 85)", label: "Yellow" },
    { key: "red", value: stats.red, color: "oklch(0.65 0.24 25)", label: "Red" },
  ];

  return (
    <div className="mt-10 mx-auto max-w-3xl purple-outline rounded-2xl bg-card/60 backdrop-blur-sm p-5 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px shimmer-line" />
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <ProgressRing value={stats.progress} />
        <div className="flex-1 w-full">
          <div className="grid grid-cols-3 gap-2">
            <MetricTile icon={<BookOpen className="h-3.5 w-3.5" />} label="Subjects" value={stats.subjectCount} />
            <MetricTile icon={<FileText className="h-3.5 w-3.5" />} label="Papers" value={stats.papers} />
            <MetricTile icon={<BellRing className="h-3.5 w-3.5" />} label="Assessments" value={stats.assessments} />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Topic mix
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {total} topic{total === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-border/60 bg-surface">
              {total === 0 ? (
                <div className="flex-1 bg-muted/40" />
              ) : (
                bars.map((b) => (
                  <div
                    key={b.key}
                    style={{
                      width: `${pct(b.value)}%`,
                      background: b.color,
                      boxShadow: `0 0 8px ${b.color}`,
                    }}
                    className="transition-[width] duration-500"
                  />
                ))
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-left">
              {bars.map((b) => (
                <div key={b.key} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }}
                  />
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="ml-auto font-semibold text-foreground tabular-nums">
                    {b.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2.5 text-left hover:border-primary/60 transition-colors">
      <div className="flex items-center gap-1.5 text-primary/80">
        {icon}
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-0.5 text-2xl font-semibold tracking-tight gradient-text">
        {value}
      </div>
    </div>
  );
}

