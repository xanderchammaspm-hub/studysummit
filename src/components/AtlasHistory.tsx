import { PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from "lucide-react";

export type HistoryItem = { id: string; title: string; ts: number };

function when(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Collapsible ChatGPT-style history rail used by the Atlas chat and question bank. */
export function HistoryRail({
  open,
  onToggle,
  items,
  activeId,
  onSelect,
  onNew,
  onDelete,
  newLabel = "New chat",
  title = "History",
}: {
  open: boolean;
  onToggle: () => void;
  items: HistoryItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  newLabel?: string;
  title?: string;
}) {
  return (
    <div
      className={`flex shrink-0 flex-col border-r border-border/50 bg-background/60 transition-[width] duration-300 ${
        open ? "w-[188px]" : "w-[44px]"
      }`}
    >
      <div className="flex items-center gap-1 border-b border-border/40 px-2 py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? `Collapse ${title.toLowerCase()}` : `Expand ${title.toLowerCase()}`}
          title={open ? "Collapse" : "Expand"}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
        {open && (
          <span className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onNew}
        aria-label={newLabel}
        title={newLabel}
        className={`m-2 flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1.5 text-[11px] text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
          open ? "" : "justify-center"
        }`}
      >
        <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
        {open && <span className="truncate">{newLabel}</span>}
      </button>

      {open && (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {items.length === 0 && (
            <li className="px-1 py-2 text-[11px] text-muted-foreground">Nothing saved yet.</li>
          )}
          {items.map((it) => (
            <li key={it.id} className="group/hist relative">
              <button
                type="button"
                onClick={() => onSelect(it.id)}
                aria-current={activeId === it.id ? "true" : undefined}
                className={`w-full cursor-pointer rounded-lg px-2 py-1.5 pr-7 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                  activeId === it.id
                    ? "bg-primary/15 text-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                    : "text-muted-foreground hover:bg-surface/70 hover:text-foreground"
                }`}
              >
                <span className="block truncate text-[11px] leading-tight">{it.title}</span>
                <span className="mt-0.5 block text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  {when(it.ts)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(it.id)}
                aria-label={`Delete ${it.title}`}
                className="absolute right-1 top-1.5 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 group-hover/hist:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
