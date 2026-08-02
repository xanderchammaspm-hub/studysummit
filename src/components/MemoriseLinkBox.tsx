import { useEffect, useRef, useState } from "react";
import { ExternalLink, Pencil, Check, X } from "lucide-react";

const PREFIX = "summit-english-formula-v1:link:";

type LinkState = { url: string; iconUrl: string };

function load(key: string): LinkState {
  if (typeof window === "undefined") return { url: "", iconUrl: "" };
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? { url: "", iconUrl: "", ...JSON.parse(raw) } : { url: "", iconUrl: "" };
  } catch {
    return { url: "", iconUrl: "" };
  }
}

export function MemoriseLinkBox({
  storageKey,
  label,
}: {
  storageKey: string;
  label: string;
}) {
  const [state, setState] = useState<LinkState>({ url: "", iconUrl: "" });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = load(storageKey);
    setState(s);
    setDraft(s.url);
  }, [storageKey]);

  const persist = (next: LinkState) => {
    setState(next);
    try {
      localStorage.setItem(PREFIX + storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleFile = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => persist({ ...state, iconUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-surface/60 px-3 py-3 transition-all ${
        dragOver
          ? "border-primary bg-primary/10 shadow-[0_0_0_2px_var(--primary)]"
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
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title={state.iconUrl ? "Replace image" : "Drop a PNG here or click to upload"}
        className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-elevated flex items-center justify-center hover:border-primary/70 transition-colors"
      >
        {state.iconUrl ? (
          <img src={state.iconUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg">🧠</span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {editing ? (
          <div className="mt-1 flex items-center gap-1.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  persist({ ...state, url: draft.trim() });
                  setEditing(false);
                }
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="https://…"
              className="min-w-0 flex-1 rounded-md border border-border/60 bg-surface px-2 py-1 text-xs outline-none focus:border-primary"
            />
            <IconBtn
              label="Save"
              onClick={() => {
                persist({ ...state, url: draft.trim() });
                setEditing(false);
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Cancel" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        ) : state.url ? (
          <a
            href={state.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-0.5 flex items-center gap-1 truncate text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{state.url}</span>
          </a>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add a link · drop a PNG on the tile
          </p>
        )}
      </div>

      {!editing && (
        <IconBtn
          label="Edit link"
          onClick={() => {
            setDraft(state.url);
            setEditing(true);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </IconBtn>
      )}
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/15 hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}
