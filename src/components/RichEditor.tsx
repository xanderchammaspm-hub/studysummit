import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Table as TableIcon,
  Highlighter,
  RemoveFormatting,
} from "lucide-react";

const PREFIX = "summit-english-formula-v1:";

function load(key: string) {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(PREFIX + key) ?? "";
  } catch {
    return "";
  }
}

function save(key: string, html: string) {
  try {
    localStorage.setItem(PREFIX + key, html);
  } catch {
    // ignore
  }
}

const SIZES = [
  { label: "S", value: "2" },
  { label: "M", value: "3" },
  { label: "L", value: "5" },
  { label: "XL", value: "6" },
];

type Props = {
  storageKey: string;
  placeholder?: string;
  minHeight?: number;
};

export function RichEditor({ storageKey, placeholder, minHeight = 220 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load content whenever the target section changes
  useEffect(() => {
    const html = load(storageKey);
    if (ref.current) {
      ref.current.innerHTML = html;
      setEmpty(!ref.current.textContent?.trim() && !html.includes("<table"));
    }
  }, [storageKey]);

  const persist = () => {
    if (!ref.current) return;
    save(storageKey, ref.current.innerHTML);
    setEmpty(
      !ref.current.textContent?.trim() &&
        !ref.current.innerHTML.includes("<table"),
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const cmd = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    persist();
  };

  const insertTable = () => {
    const rows = 3;
    const cols = 2;
    let html =
      '<table class="ef-table"><tbody>' +
      Array.from({ length: rows })
        .map(
          (_, r) =>
            "<tr>" +
            Array.from({ length: cols })
              .map(() => (r === 0 ? "<th>&nbsp;</th>" : "<td>&nbsp;</td>"))
              .join("") +
            "</tr>",
        )
        .join("") +
      "</tbody></table><p><br/></p>";
    cmd("insertHTML", html);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-border/50 bg-surface/60 px-2 py-1.5">
        <ToolButton onClick={() => cmd("bold")} label="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton onClick={() => cmd("italic")} label="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton onClick={() => cmd("underline")} label="Underline">
          <Underline className="h-3.5 w-3.5" />
        </ToolButton>
        <Divider />
        {SIZES.map((s) => (
          <ToolButton
            key={s.value}
            onClick={() => cmd("fontSize", s.value)}
            label={`Font size ${s.label}`}
          >
            <span className="text-[10px] font-semibold">{s.label}</span>
          </ToolButton>
        ))}
        <Divider />
        <ToolButton onClick={() => cmd("insertUnorderedList")} label="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton onClick={() => cmd("insertOrderedList")} label="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolButton>
        <Divider />
        <ToolButton onClick={insertTable} label="Insert table">
          <TableIcon className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => cmd("foreColor", "oklch(0.86 0.11 82)")}
          label="Highlight text"
        >
          <Highlighter className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton onClick={() => cmd("removeFormat")} label="Clear formatting">
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolButton>
        <span
          className={`ml-auto text-[10px] uppercase tracking-wider transition-opacity duration-300 ${
            saved ? "opacity-100 text-primary" : "opacity-0"
          }`}
        >
          Saved
        </span>
      </div>

      <div className="relative">
        {empty && placeholder && (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground/60">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={persist}
          onBlur={persist}
          spellCheck
          className="ef-editor px-4 py-3 text-sm leading-relaxed outline-none focus:bg-surface/20 transition-colors"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}

function ToolButton({
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
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/15 hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-border/60" />;
}
