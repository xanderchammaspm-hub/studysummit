import { useEffect, useRef, useState } from "react";
import { Brain, ChevronDown, Plus, Trash2, X } from "lucide-react";

const PREFIX = "summit-english-formula-v1:vault:";

type VaultItem = {
  id: string;
  kind: "quote" | "thesis" | "scaffold" | "other";
  text: string;
};

function load(key: string): VaultItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as VaultItem[];
  } catch {
    // ignore
  }
  return [];
}

function save(key: string, items: VaultItem[]) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(items));
  } catch {
    // ignore
  }
}

const KINDS: { id: VaultItem["kind"]; label: string }[] = [
  { id: "quote", label: "Quote" },
  { id: "thesis", label: "Thesis" },
  { id: "scaffold", label: "Scaffold" },
  { id: "other", label: "Note" },
];

const KIND_STYLES: Record<VaultItem["kind"], string> = {
  quote: "bg-sky-400/10 text-sky-300 border-sky-400/30",
  thesis: "bg-primary/10 text-primary border-primary/30",
  scaffold: "bg-yellow/10 text-yellow border-yellow/30",
  other: "bg-surface/60 text-muted-foreground border-border/60",
};

export function MemoriseVault({ storageKey }: { storageKey: string }) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draftKind, setDraftKind] = useState<VaultItem["kind"]>("quote");
  const [draftText, setDraftText] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setItems(load(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!initialized.current) return;
    save(storageKey, items);
  }, [items, storageKey]);

  const add = () => {
    const text = draftText.trim();
    if (!text) return;
    setItems((prev) => [...prev, { id: makeId(), kind: draftKind, text }]);
    setDraftText("");
    setAdding(false);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const update = (id: string, patch: Partial<VaultItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/30 p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Brain className="h-3.5 w-3.5" />
          Memorise By Heart
          {items.length > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] text-primary">
              {items.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {items.length === 0 && !adding && (
            <p className="text-xs text-muted-foreground/80">
              Drop in quotes, thesis lines and scaffolds to memorise.
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-border/50 bg-surface/50 p-2.5 transition-colors hover:border-primary/40"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <select
                  value={item.kind}
                  onChange={(e) => update(item.id, { kind: e.target.value as VaultItem["kind"] })}
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium outline-none ${KIND_STYLES[item.kind]}`}
                >
                  {KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <textarea
                value={item.text}
                onChange={(e) => update(item.id, { text: e.target.value })}
                rows={2}
                className="w-full resize-none rounded-lg border-0 bg-transparent px-0 py-0 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/50"
                placeholder="Type the line you want to lock in…"
              />
            </div>
          ))}

          {adding ? (
            <div className="rounded-xl border border-primary/40 bg-surface/50 p-2.5">
              <div className="mb-2 flex items-center gap-2">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setDraftKind(k.id)}
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      draftKind === k.id
                        ? KIND_STYLES[k.id]
                        : "border-border/50 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <textarea
                autoFocus
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    add();
                  }
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraftText("");
                  }
                }}
                rows={3}
                placeholder="Quote, thesis line or scaffold…"
                className="w-full resize-none rounded-lg border border-border/60 bg-background/50 px-2.5 py-2 text-sm leading-snug text-foreground outline-none focus:border-primary/70"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setAdding(false);
                    setDraftText("");
                  }}
                  className="rounded-md px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-surface"
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  onClick={add}
                  disabled={!draftText.trim()}
                  className="flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/25 disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 bg-surface/30 py-2 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Plus className="h-3 w-3" /> Add memorisation item
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
