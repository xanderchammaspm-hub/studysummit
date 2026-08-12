import { useEffect, useMemo, useState } from "react";
import { EMOJI_GROUPS, ALL_EMOJIS } from "@/data/emojis";
import { Search } from "lucide-react";

const RECENTS_KEY = "summit:emoji-recents";

function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 12) : [];
  } catch {
    return [];
  }
}

/** Searchable, grouped emoji popover for subject cards. */
export function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => setRecents(loadRecents()), []);

  const pick = (char: string) => {
    const next = [char, ...recents.filter((r) => r !== char)].slice(0, 12);
    setRecents(next);
    try {
      window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — ignore */
    }
    onPick(char);
  };

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      q
        ? ALL_EMOJIS.filter((e) => e.keywords.includes(q) || e.char === q).slice(0, 90)
        : null,
    [q],
  );

  return (
    <>
      <button
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Close emoji picker"
      />
      <div className="absolute z-50 mt-2 w-72 overflow-hidden rounded-xl border border-primary/25 bg-popover/90 shadow-[0_24px_60px_-30px_var(--primary)] backdrop-blur-2xl">
        <div
          aria-hidden
          className="pointer-events-none h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
        />
        <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            placeholder="Search or paste an emoji…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter") {
                const v = query.trim();
                if (!v) return;
                const first = results?.[0];
                pick(first ? first.char : ([...v][0] ?? v));
              }
            }}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {results ? (
            results.length === 0 ? (
              <p className="px-1 py-3 text-xs text-muted-foreground">
                No matches — press Enter to use what you typed.
              </p>
            ) : (
              <Grid emojis={results.map((e) => e.char)} onPick={pick} />
            )
          ) : (
            <>
              {recents.length > 0 && (
                <Group label="Recent">
                  <Grid emojis={recents} onPick={pick} />
                </Group>
              )}
              {EMOJI_GROUPS.map((group) => (
                <Group key={group.label} label={group.label}>
                  <Grid emojis={group.emojis.map((e) => e.char)} onPick={pick} />
                </Group>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-1 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Grid({ emojis, onPick }: { emojis: string[]; onPick: (e: string) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {emojis.map((em, i) => (
        <button
          key={`${em}-${i}`}
          onClick={() => onPick(em)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all duration-200 hover:scale-110 hover:bg-primary/20"
        >
          {em}
        </button>
      ))}
    </div>
  );
}

export default EmojiPicker;
