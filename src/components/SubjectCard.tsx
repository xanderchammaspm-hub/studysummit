import { useState } from "react";
import {
  ChevronDown,
  FileText,
  TrafficCone,
  Plus,
  X,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  BellRing,
} from "lucide-react";
import {
  useSubject,
  uid,
  renameSubject,
  deleteSubject,
  type Paper,
  type Topic,
  type Assessment,
  type TrafficColor,
  type YearKey,
} from "@/hooks/useSubjectStore";
import { DraggableList } from "@/components/DraggableList";

type Props = {
  index: number;
  id: string;
  name: string;
  year: YearKey;
  defaultOpen?: boolean;
};

const EMOJI_CHOICES = [
  "📘", "📗", "📕", "📙", "📓", "🧪", "🧮", "🔬", "⚗️", "🧬",
  "🖥️", "💻", "📐", "📏", "🧠", "🌍", "🗺️", "🏛️", "🎨", "🎼",
  "🎭", "⚙️", "🔧", "🧾", "📊", "📈", "✒️", "📝", "🔭", "🧲",
];

export function SubjectCard({ index, id, name, year, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const { state, update } = useSubject(id);
  const label = name.trim() || `Subject ${index + 1}`;

  const [paperTitle, setPaperTitle] = useState("");
  const [paperUrl, setPaperUrl] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [aTitle, setATitle] = useState("");
  const [aUrl, setAUrl] = useState("");
  const [aDue, setADue] = useState("");

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

  return (
    <div
      className="purple-outline purple-glow-hover rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left group">
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
              <span>{state.emoji || "📘"}</span>
            </button>
            {pickerOpen && (
              <>
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setPickerOpen(false)}
                  tabIndex={-1}
                  aria-label="Close emoji picker"
                />
                <div className="absolute z-50 mt-2 grid w-64 grid-cols-6 gap-1 rounded-lg border border-border bg-popover p-2 shadow-xl">
                  {EMOJI_CHOICES.map((em) => (
                    <button
                      key={em}
                      onClick={() => {
                        update({ emoji: em });
                        setPickerOpen(false);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded hover:bg-primary/20 text-lg"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-widest text-primary/80">
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
          <div className="border-t border-border/60 px-5 py-6 space-y-6">
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
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
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

            {/* Topics / traffic light */}
            <Section
              icon={<TrafficCone className="h-4 w-4" />}
              title="Traffic Light System"
              accent
            >
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
                    No topics yet. Add one, then set red / amber / green.
                  </p>
                }
                renderItem={(t) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          topics: s.topics.map((x) =>
                            x.id === t.id
                              ? { ...x, status: cycle(x.status) }
                              : x,
                          ),
                        }))
                      }
                      title={`Status: ${t.status} — click to cycle`}
                      className="shrink-0"
                    >
                      <StatusDot status={t.status} />
                    </button>
                    <span className="flex-1 truncate text-sm">{t.title}</span>
                    <QuickChips
                      status={t.status}
                      onSet={(status) =>
                        update((s) => ({
                          ...s,
                          topics: s.topics.map((x) =>
                            x.id === t.id ? { ...x, status } : x,
                          ),
                        }))
                      }
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

const STATUS_COLOR: Record<TrafficColor, string> = {
  none: "oklch(0.5 0.02 285)",
  red: "oklch(0.65 0.24 25)",
  amber: "oklch(0.82 0.17 85)",
  green: "oklch(0.72 0.19 145)",
};

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
    { key: "amber", label: "A" },
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
            title={active ? "Clear" : `Set ${it.key}`}
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

function Section({
  icon,
  title,
  accent = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
          {title}
        </h3>
        {accent && (
          <span className="ml-auto flex items-center gap-1.5">
            <StatusDot status="red" />
            <StatusDot status="amber" />
            <StatusDot status="green" />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
