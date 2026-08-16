import { normalizeUrl } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  Plus,
  X,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  BellRing,
  ListChecks,
  NotebookPen,
} from "lucide-react";
import { TrafficLightIcon } from "@/components/TrafficLightIcon";
import {
  useSubject,
  useSubjectTerm,
  TERMS_BY_YEAR,
  TERM_LABEL,
  uid,
  renameSubject,
  deleteSubject,
  type Paper,
  type Topic,
  type Assessment,
  type TrafficColor,
  type TermKey,
  type YearKey,
} from "@/hooks/useSubjectStore";

import { DraggableList } from "@/components/DraggableList";
import { EmojiPicker } from "@/components/EmojiPicker";
import { SubjectColorPicker, DEFAULT_SUBJECT_COLOR } from "@/components/SubjectColorPicker";
import { useProfile } from "@/hooks/useProfile";

type Props = {
  index: number;
  id: string;
  name: string;
  year: YearKey;
  defaultOpen?: boolean;
};




export function SubjectCard({ index, id, name, year, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const terms = TERMS_BY_YEAR[year];
  const [term, setTerm] = useState<TermKey>(terms[0]);
  const { state: subject, update: updateSubject } = useSubject(id);
  const { state, update } = useSubjectTerm(id, term);

  const { awardXp } = useProfile();
  const label = name.trim() || `Subject ${index + 1}`;

  const [paperTitle, setPaperTitle] = useState("");
  const [paperUrl, setPaperUrl] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [aTitle, setATitle] = useState("");
  const [aUrl, setAUrl] = useState("");
  const [aDue, setADue] = useState("");
  const [dotText, setDotText] = useState("");

  // Switching terms must never carry half-typed drafts across.
  useEffect(() => {
    setPaperTitle("");
    setPaperUrl("");
    setTopicTitle("");
    setATitle("");
    setAUrl("");
    setADue("");
    setDotText("");
  }, [term, id]);

  const greenCount = state.topics.filter((t) => t.status === "green").length;
  const yellowCount = state.topics.filter((t) => t.status === "amber").length;
  const redCount = state.topics.filter((t) => t.status === "red").length;
  const trafficPct = state.topics.length
    ? Math.round(((greenCount + yellowCount * 0.5) / state.topics.length) * 100)
    : 0;



  const dotPct =
    state.syllabus.length === 0
      ? 0
      : Math.round((state.syllabus.filter((p) => p.done).length / state.syllabus.length) * 100);

  const addDot = () => {
    const t = dotText.trim();
    if (!t) return;
    update((s) => ({ ...s, syllabus: [...s.syllabus, { id: uid(), text: t, done: false }] }));
    setDotText("");
  };

  const addPaper = () => {
    const t = paperTitle.trim();
    if (!t) return;
    const paper: Paper = {
      id: uid(),
      title: t,
      url: paperUrl.trim() || undefined,
    };
    update((s) => ({ ...s, papers: [...s.papers, paper] }));
    setPaperTitle("");
    setPaperUrl("");
  };

  const addTopic = () => {
    const t = topicTitle.trim();
    if (!t) return;
    const topic: Topic = { id: uid(), title: t, status: "none" };
    update((s) => ({ ...s, topics: [...s.topics, topic] }));
    setTopicTitle("");
  };

  const addAssessment = () => {
    const t = aTitle.trim();
    if (!t) return;
    const a: Assessment = {
      id: uid(),
      title: t,
      url: aUrl.trim() || undefined,
      due: aDue || undefined,
    };
    update((s) => ({ ...s, assessments: [...s.assessments, a] }));
    setATitle("");
    setAUrl("");
    setADue("");
  };

  const commitRename = () => {
    renameSubject(year, id, nameDraft.trim());
    setEditing(false);
  };

  const removeSubject = () => {
    if (confirm(`Delete "${label}"? This can't be undone.`)) {
      deleteSubject(year, id);
    }
  };

  const accent = subject.color || DEFAULT_SUBJECT_COLOR;

  return (
    <div
      className="subject-card lift-hover rounded-xl fade-in-up"
      style={
        {
          animationDelay: `${index * 60}ms`,
          ["--acc" as string]: accent,
        } as React.CSSProperties
      }
    >
      <div className="subject-card-sheen w-full flex items-center justify-between gap-3 rounded-t-xl px-6 py-5 text-left group">

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative">

            <button
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen((o) => !o);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-lg hover:border-primary/70 transition-colors"
              aria-label="Change emoji"
              title="Change emoji"
            >
              <span>{subject.emoji || "📘"}</span>
            </button>
            {pickerOpen && (
              <EmojiPicker
                onPick={(em) => {
                  updateSubject({ emoji: em });
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            )}

          </div>
          <SubjectColorPicker value={accent} onChange={(hex) => updateSubject({ color: hex })} />
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-widest" style={{ color: `color-mix(in oklab, ${accent} 80%, white 5%)` }}>
              {year} · Subject {index + 1}
            </div>
            {editing ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") {
                      setNameDraft(name);
                      setEditing(false);
                    }
                  }}
                  placeholder="Subject name"
                  className="flex-1 rounded-md border border-border bg-background/60 px-2 py-1 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={commitRename}
                  className="p-1 text-primary hover:text-foreground"
                  aria-label="Save name"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOpen((o) => !o)}
                className="min-w-0 text-left w-full"
              >
                <div className="truncate text-lg font-medium">
                  {name.trim() ? (
                    <span className="text-foreground">{label}</span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Untitled subject
                    </span>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <>
              <button
                onClick={() => {
                  setNameDraft(name);
                  setEditing(true);
                }}
                className="p-1.5 text-muted-foreground hover:text-primary"
                aria-label="Rename"
                title="Rename"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={removeSubject}
                className="p-1.5 text-muted-foreground hover:text-destructive"
                aria-label="Delete subject"
                title="Delete subject"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Collapse" : "Expand"}
                className="p-1"
              >
                <ChevronDown
                  className={`h-5 w-5 text-primary transition-transform duration-300 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60 px-6 py-7 space-y-7">

            {/* Term switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">
                Term
              </span>
              {terms.map((t) => {
                const active = t === term;
                return (
                  <button
                    key={t}
                    onClick={() => setTerm(t)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs transition-all duration-300 ${
                      active
                        ? "border-primary/70 bg-primary/25 text-foreground shadow-[0_0_14px_oklch(0.7_0.22_300/0.35)]"
                        : "border-border/70 bg-surface/50 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {TERM_LABEL[t]}
                  </button>
                );
              })}
            </div>

            {/* Papers */}

            <Section
              icon={<FileText className="h-4 w-4" />}
              title="Past Paper Resources"
            >
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPaper()}
                  placeholder="Paper title (e.g. 2023 Paper 1)"
                  className="flex-1 rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
                <input
                  value={paperUrl}
                  onChange={(e) => setPaperUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPaper()}
                  placeholder="Link (optional)"
                  className="sm:w-40 rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={addPaper}
                  className="flex items-center justify-center gap-1 rounded-md border border-primary/60 bg-primary/20 px-3 py-1.5 text-sm text-foreground hover:bg-primary/30"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <DraggableList
                items={state.papers}
                onReorder={(papers) => update({ papers })}
                empty={
                  <p className="text-xs text-muted-foreground italic px-1">
                    No papers yet. Add one above.
                  </p>
                }
                renderItem={(p) => (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm">{p.title}</span>
                    {p.url && (
                      <a
                        href={normalizeUrl(p.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary/80 hover:text-primary"
                        title="Open link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          papers: s.papers.filter((x) => x.id !== p.id),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              />
            </Section>

            {/* Notes doc */}
            <Section
              icon={<NotebookPen className="h-4 w-4" />}
              title="Notes Doc"
            >
              <NotesDocInput
                url={state.notesUrl}
                onChange={(notesUrl) => update({ notesUrl })}
              />
            </Section>


            {/* Assessment notifications */}
            <Section
              icon={<BellRing className="h-4 w-4" />}
              title="Assessment Notifications"
            >
              <div className="grid gap-2 mb-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto]">
                <input
                  value={aTitle}
                  onChange={(e) => setATitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAssessment()}
                  placeholder="Assessment (e.g. Trial Exam)"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
                <input
                  value={aUrl}
                  onChange={(e) => setAUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAssessment()}
                  placeholder="Notification link"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
                <input
                  type="date"
                  value={aDue}
                  onChange={(e) => setADue(e.target.value)}
                  className="rounded-md border border-border bg-background/60 px-2 py-1.5 text-sm outline-none focus:border-primary text-muted-foreground"
                />
                <button
                  onClick={addAssessment}
                  className="flex items-center justify-center gap-1 rounded-md border border-primary/60 bg-primary/20 px-3 py-1.5 text-sm text-foreground hover:bg-primary/30"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <DraggableList
                items={state.assessments}
                onReorder={(assessments) => update({ assessments })}
                empty={
                  <p className="text-xs text-muted-foreground italic px-1">
                    No assessments yet. Paste a link when your teacher posts one.
                  </p>
                }
                renderItem={(a) => {
                  const badge = dueBadge(a.due);
                  return (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate text-sm">{a.title}</span>
                      {badge && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            background: badge.bg,
                            color: badge.fg,
                            boxShadow: `0 0 10px ${badge.bg}`,
                          }}
                          title={a.due}
                        >
                          {badge.text}
                        </span>
                      )}
                      {a.url && (
                        <a
                          href={normalizeUrl(a.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary/80 hover:text-primary"
                          title="Open notification"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            assessments: s.assessments.filter(
                              (x) => x.id !== a.id,
                            ),
                          }))
                        }
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove assessment"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                }}
              />
            </Section>

            {/* Topics / traffic light */}

            <Section
              icon={<TrafficLightIcon size={14} />}
              title="Traffic Light System"
              accent
            >
              <TrafficStats label={label} topics={state.topics} />
              <div className="flex gap-2 mb-3">

                <input
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTopic()}
                  placeholder="Topic name"
                  className="flex-1 rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={addTopic}
                  className="flex items-center justify-center gap-1 rounded-md border border-primary/60 bg-primary/20 px-3 py-1.5 text-sm text-foreground hover:bg-primary/30"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <DraggableList
                items={state.topics}
                onReorder={(topics) => update({ topics })}
                empty={
                  <p className="text-xs text-muted-foreground italic px-1">
                    No topics yet. Add one, then set red / yellow / green.
                  </p>
                }
                renderItem={(t) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = cycle(t.status);
                        if (next === "green") void awardXp("syllabusPoint");
                        update((s) => ({
                          ...s,
                          topics: s.topics.map((x) =>
                            x.id === t.id ? { ...x, status: next } : x,
                          ),
                        }));
                      }}
                      title={`Status: ${t.status} — click to cycle`}
                      className="shrink-0"
                    >
                      <StatusDot status={t.status} />
                    </button>
                    <span className="flex-1 truncate text-sm">{t.title}</span>
                    <QuickChips
                      status={t.status}
                      onSet={(status) => {
                        if (status === "green" && t.status !== "green") void awardXp("syllabusPoint");
                        return update((s) => ({
                          ...s,
                          topics: s.topics.map((x) =>
                            x.id === t.id ? { ...x, status } : x,
                          ),
                        }));
                      }}
                    />

                    <button
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          topics: s.topics.filter((x) => x.id !== t.id),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove topic"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              />
            </Section>

            {/* Syllabus dot points */}
            <Section icon={<ListChecks className="h-4 w-4" />} title="Syllabus Dot Points">
              <div className="flex gap-2 mb-3">
                <input
                  value={dotText}
                  onChange={(e) => setDotText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDot()}
                  placeholder="Paste a NESA dot point"
                  className="flex-1 rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={addDot}
                  className="flex items-center justify-center gap-1 rounded-md border border-primary/60 bg-primary/20 px-3 py-1.5 text-sm text-foreground hover:bg-primary/30"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              {state.syllabus.length > 0 && (
                <div className="mb-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${dotPct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {state.syllabus.filter((p) => p.done).length}/{state.syllabus.length} covered · {dotPct}%
                  </div>
                </div>
              )}
              <DraggableList
                items={state.syllabus}
                onReorder={(syllabus) => update({ syllabus })}
                empty={
                  <p className="text-xs text-muted-foreground italic px-1">
                    No dot points yet. Paste them from the syllabus and tick them off as you master each one.
                  </p>
                }
                renderItem={(p) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!p.done) void awardXp("syllabusPoint");
                        update((s) => ({
                          ...s,
                          syllabus: s.syllabus.map((x) =>
                            x.id === p.id ? { ...x, done: !x.done } : x,
                          ),
                        }));
                      }}
                      aria-label={p.done ? "Mark as not covered" : "Mark as covered"}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        p.done
                          ? "border-primary bg-primary/70 text-background"
                          : "border-border hover:border-primary/70"
                      }`}
                    >
                      {p.done && <Check className="h-3 w-3" />}
                    </button>
                    <span
                      className={`flex-1 truncate text-sm ${
                        p.done ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {p.text}
                    </span>
                    <button
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          syllabus: s.syllabus.filter((x) => x.id !== p.id),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove dot point"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function cycle(s: TrafficColor): TrafficColor {
  return s === "none"
    ? "red"
    : s === "red"
      ? "amber"
      : s === "amber"
        ? "green"
        : "none";
}

function dueBadge(due?: string): { text: string; bg: string; fg: string } | null {
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(due + "T00:00:00");
  if (Number.isNaN(target.getTime())) return null;
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  const fg = "oklch(0.14 0.02 285)";
  if (days < 0)
    return { text: `${-days}d overdue`, bg: "oklch(0.65 0.24 25)", fg };
  if (days === 0) return { text: "today", bg: "oklch(0.82 0.17 85)", fg };
  if (days <= 7) return { text: `in ${days}d`, bg: "oklch(0.82 0.17 85)", fg };
  return { text: `in ${days}d`, bg: "oklch(0.72 0.19 145)", fg };
}


const STATUS_COLOR: Record<TrafficColor, string> = {
  none: "oklch(0.5 0.02 285)",
  red: "oklch(0.65 0.24 25)",
  amber: "oklch(0.82 0.17 85)",
  green: "oklch(0.72 0.19 145)",
};


/** Mastery meter + counts for a subject's traffic-light topics. */
/** Smoothly animates a number towards its target. */
function useCountUp(value: number, ms = 650) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

function TrafficStats({ label, topics }: { label: string; topics: Topic[] }) {
  const total = topics.length;
  const green = topics.filter((t) => t.status === "green").length;
  const yellow = topics.filter((t) => t.status === "amber").length;
  const red = topics.filter((t) => t.status === "red").length;
  const pct = total ? Math.round(((green + yellow * 0.5) / total) * 100) : 0;
  const shownPct = useCountUp(pct);

  return (
    <div className="group/stats mb-4 rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--acc)_55%,transparent)] hover:shadow-[0_10px_30px_-18px_var(--acc)]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium">{label || "Untitled subject"}</span>
        <span className="font-mono text-sm tabular-nums" style={{ color: "var(--acc)" }}>
          {shownPct}%
        </span>
      </div>

      <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-elevated/80 ring-1 ring-inset ring-border/60">
        <div className="flex h-full w-full">
          <Seg pct={total ? (green / total) * 100 : 0} color={STATUS_COLOR.green} />
          <Seg pct={total ? (yellow / total) * 100 : 0} color={STATUS_COLOR.amber} />
          <Seg pct={total ? (red / total) * 100 : 0} color={STATUS_COLOR.red} />
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover/stats:translate-x-[300%]"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <CountPill status="green" n={green} />
        <CountPill status="amber" n={yellow} />
        <CountPill status="red" n={red} />
        {total > green + yellow + red && (
          <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors duration-200 hover:text-foreground">
            {total - green - yellow - red} untagged
          </span>
        )}
      </div>
    </div>
  );
}

function Seg({ pct, color }: { pct: number; color: string }) {
  if (pct <= 0) return null;
  return (
    <span
      className="h-full transition-[width] duration-700 ease-out"
      style={{
        width: `${pct}%`,
        background: `linear-gradient(180deg, color-mix(in oklab, ${color} 85%, white 15%), ${color})`,
        boxShadow: `0 0 10px -2px ${color}`,
      }}
    />
  );
}

function CountPill({ status, n }: { status: TrafficColor; n: number }) {
  const c = STATUS_COLOR[status];
  const shown = useCountUp(n, 500);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
      style={{
        borderColor: `color-mix(in oklab, ${c} 45%, transparent)`,
        background: `color-mix(in oklab, ${c} 12%, transparent)`,
        color: `color-mix(in oklab, ${c} 80%, white 20%)`,
        boxShadow: n > 0 ? `0 0 14px -8px ${c}` : undefined,
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
      {shown}
    </span>
  );
}

export function StatusDot({ status }: { status: TrafficColor }) {

  const color = STATUS_COLOR[status];
  const glow = status === "none" ? "none" : `0 0 8px ${color}`;
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${
        status === "none" ? "border border-border" : ""
      }`}
      style={{
        background: status === "none" ? "transparent" : color,
        boxShadow: glow,
      }}
    />
  );
}

function QuickChips({
  status,
  onSet,
}: {
  status: TrafficColor;
  onSet: (s: TrafficColor) => void;
}) {
  const items: { key: TrafficColor; label: string }[] = [
    { key: "red", label: "R" },
    { key: "amber", label: "Y" },
    { key: "green", label: "G" },
  ];
  return (
    <div className="hidden sm:flex items-center gap-1">
      {items.map((it) => {
        const active = status === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onSet(active ? "none" : it.key)}
            title={active ? "Clear" : `Set ${it.key === "amber" ? "yellow" : it.key}`}
            className="h-5 w-5 rounded-full text-[10px] font-semibold flex items-center justify-center border transition-colors"
            style={{
              borderColor: active ? STATUS_COLOR[it.key] : "var(--color-border)",
              background: active ? STATUS_COLOR[it.key] : "transparent",
              color: active ? "oklch(0.14 0.02 285)" : "var(--color-muted-foreground)",
              boxShadow: active ? `0 0 8px ${STATUS_COLOR[it.key]}` : "none",
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

const SECTIONS_KEY = "study-hub-sections-v1";

function readSections(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SECTIONS_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

/** Remembers a collapsible section's open state per subject + term. */
function useSectionOpen(key: string, fallback: boolean) {
  const [open, setOpen] = useState(fallback);
  useEffect(() => {
    const saved = readSections()[key];
    setOpen(typeof saved === "boolean" ? saved : fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      try {
        localStorage.setItem(SECTIONS_KEY, JSON.stringify({ ...readSections(), [key]: next }));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return [open, toggle] as const;
}

function Section({
  icon,
  title,
  accent = false,
  children,
  collapsible = false,
  sectionKey,
  defaultOpen = true,
  summary,
}: {
  icon: React.ReactNode;
  title: string;
  accent?: boolean;
  children: React.ReactNode;
  collapsible?: boolean;
  sectionKey?: string;
  defaultOpen?: boolean;
  summary?: React.ReactNode;
}) {
  const [open, toggle] = useSectionOpen(sectionKey ?? title, defaultOpen);
  const isOpen = collapsible ? open : true;

  const header = (
    <div className="flex items-center gap-2">
      <span className="text-primary shrink-0">{icon}</span>
      <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground truncate">
        {title}
      </h3>
      <span className="ml-auto flex items-center gap-2 shrink-0">
        {collapsible && !isOpen && summary}
        {accent && (
          <span className="flex items-center gap-1.5">
            <StatusDot status="red" />
            <StatusDot status="amber" />
            <StatusDot status="green" />
          </span>
        )}
        {collapsible && (
          <ChevronDown
            className={`h-4 w-4 text-primary transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </span>
    </div>
  );

  return (
    <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
      {collapsible ? (
        <button
          onClick={toggle}
          aria-expanded={isOpen}
          className="w-full text-left transition-colors hover:opacity-90"
        >
          {header}
        </button>
      ) : (
        header
      )}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}


function NotesDocInput({
  url,
  onChange,
}: {
  url: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url ?? "");
  const save = () => {
    const v = draft.trim();
    onChange(v || undefined);
    setEditing(false);
  };
  if (!url && !editing) {
    return (
      <button
        onClick={() => {
          setDraft("");
          setEditing(true);
        }}
        className="w-full rounded-md border border-dashed border-border/70 bg-surface/40 px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
      >
        <Plus className="inline h-3.5 w-3.5 mr-1" />
        Paste a Google Docs link for your summary notes
      </button>
    );
  }
  if (editing) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="https://docs.google.com/document/…"
          className="flex-1 rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={save}
          className="flex items-center gap-1 rounded-md border border-primary/60 bg-primary/20 px-3 py-1.5 text-sm text-foreground hover:bg-primary/30"
        >
          <Check className="h-4 w-4" /> Save
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-surface/60 px-3 py-2">
      <NotebookPen className="h-4 w-4 text-primary shrink-0" />
      <a
        href={normalizeUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 truncate text-sm text-foreground hover:text-primary"
      >
        {url!.replace(/^https?:\/\//, "")}
      </a>
      <a
        href={normalizeUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary/80 hover:text-primary"
        title="Open notes"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <button
        onClick={() => {
          setDraft(url ?? "");
          setEditing(true);
        }}
        className="text-muted-foreground hover:text-primary"
        aria-label="Edit notes link"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onChange(undefined)}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Remove notes link"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

