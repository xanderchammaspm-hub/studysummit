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
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  GripHorizontal,
} from "lucide-react";

const PREFIX = "summit-english-formula-v1:";
const HEIGHT_PREFIX = "summit-rich-editor-height-v1:";

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

function loadHeight(key: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  try {
    const n = Number(localStorage.getItem(HEIGHT_PREFIX + key));
    return Number.isFinite(n) && n >= 120 ? n : fallback;
  } catch {
    return fallback;
  }
}

function saveHeight(key: string, height: number) {
  try {
    localStorage.setItem(HEIGHT_PREFIX + key, String(Math.round(height)));
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
  resizable?: boolean;
};

export function RichEditor({ storageKey, placeholder, minHeight = 280, resizable = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(true);
  const [saved, setSaved] = useState(false);
  const [editorHeight, setEditorHeight] = useState(() => loadHeight(storageKey, minHeight));
  const [toolbar, setToolbar] = useState<{ visible: boolean; top: number; left: number } | null>(null);
  const resizeStart = useRef<{ y: number; height: number } | null>(null);

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

  const insertTable = (rows: number, cols: number, header: boolean) => {
    const html =
      '<table class="ef-table"><tbody>' +
      Array.from({ length: rows })
        .map(
          (_, r) =>
            "<tr>" +
            Array.from({ length: cols })
              .map(() => (header && r === 0 ? "<th>&nbsp;</th>" : "<td>&nbsp;</td>"))
              .join("") +
            "</tr>",
        )
        .join("") +
      "</tbody></table><p><br/></p>";
    cmd("insertHTML", html);
  };

  const updateToolbar = () => {
    if (!ref.current) return;
    const sel = window.getSelection();
    const cell = findCell(sel?.anchorNode ?? null, ref.current);
    if (!cell) {
      setToolbar(null);
      return;
    }
    const cellRect = cell.getBoundingClientRect();
    const editorRect = ref.current.getBoundingClientRect();
    setToolbar({
      visible: true,
      top: cellRect.top - editorRect.top + ref.current.scrollTop - 36,
      left: Math.min(
        cellRect.left - editorRect.left + ref.current.scrollLeft,
        editorRect.width - 240,
      ),
    });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onSelectionChange = () => {
      window.setTimeout(updateToolbar, 0);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    el.addEventListener("keyup", onSelectionChange);
    el.addEventListener("mouseup", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      el.removeEventListener("keyup", onSelectionChange);
      el.removeEventListener("mouseup", onSelectionChange);
    };
  }, []);

  const tableAction = (action: TableAction) => {
    if (!ref.current) return;
    const sel = window.getSelection();
    const cell = findCell(sel?.anchorNode ?? null, ref.current);
    if (!cell) return;
    performTableAction(cell, action);
    persist();
    ref.current.focus();
    window.setTimeout(updateToolbar, 0);
  };

  const startResize = (e: React.MouseEvent) => {
    if (!resizable || !ref.current) return;
    e.preventDefault();
    resizeStart.current = { y: e.clientY, height: editorHeight };
    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeEnd);
  };

  const onResizeMove = (e: MouseEvent) => {
    if (!resizeStart.current) return;
    const delta = e.clientY - resizeStart.current.y;
    const next = Math.max(120, resizeStart.current.height + delta);
    setEditorHeight(next);
  };

  const onResizeEnd = () => {
    if (!resizeStart.current) return;
    saveHeight(storageKey, editorHeight);
    resizeStart.current = null;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeEnd);
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
        <TablePicker onPick={insertTable} />
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
        {toolbar?.visible && (
          <div
            className="absolute z-20 flex items-center gap-0.5 rounded-lg border border-primary/40 bg-card/95 px-1.5 py-1 shadow-lg backdrop-blur-xl"
            style={{ top: toolbar.top, left: toolbar.left }}
          >
            <TableToolButton onClick={() => tableAction("rowAbove")} label="Row above">
              <ArrowUp className="h-3 w-3" />
            </TableToolButton>
            <TableToolButton onClick={() => tableAction("rowBelow")} label="Row below">
              <ArrowDown className="h-3 w-3" />
            </TableToolButton>
            <TableToolButton onClick={() => tableAction("colBefore")} label="Column before">
              <ArrowLeft className="h-3 w-3" />
            </TableToolButton>
            <TableToolButton onClick={() => tableAction("colAfter")} label="Column after">
              <ArrowRight className="h-3 w-3" />
            </TableToolButton>
            <span className="mx-1 h-3.5 w-px bg-border/60" />
            <TableToolButton onClick={() => tableAction("deleteRow")} label="Delete row">
              <span className="text-[9px] font-semibold">R</span>
            </TableToolButton>
            <TableToolButton onClick={() => tableAction("deleteCol")} label="Delete column">
              <span className="text-[9px] font-semibold">C</span>
            </TableToolButton>
            <TableToolButton onClick={() => tableAction("deleteTable")} label="Delete table" destructive>
              <Trash2 className="h-3 w-3" />
            </TableToolButton>
          </div>
        )}

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
          onKeyDown={(e) => {
            if (e.key === "Escape" && toolbar?.visible) {
              e.preventDefault();
              setToolbar(null);
            }
          }}
          spellCheck
          className="ef-editor px-4 py-3 text-[15px] leading-relaxed outline-none focus:bg-surface/20 transition-colors"
          style={{ minHeight: editorHeight, height: editorHeight }}
        />

        {resizable && (
          <div
            role="separator"
            aria-label="Resize editor"
            onMouseDown={startResize}
            className="group flex h-4 cursor-ns-resize items-center justify-center border-t border-border/40 bg-surface/30 hover:bg-primary/10"
          >
            <GripHorizontal className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary/70" />
          </div>
        )}
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

function TableToolButton({
  onClick,
  label,
  children,
  destructive,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] transition-colors ${
        destructive
          ? "text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
          : "text-muted-foreground hover:bg-primary/15 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-border/60" />;
}

/** Google-Docs style hover grid for choosing table size. */
function TablePicker({ onPick }: { onPick: (rows: number, cols: number, header: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const [header, setHeader] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const N = 8;
  return (
    <div ref={wrap} className="relative">
      <ToolButton onClick={() => setOpen((o) => !o)} label="Insert table">
        <TableIcon className="h-3.5 w-3.5" />
      </ToolButton>
      {open && (
        <div className="absolute left-0 top-9 z-50 w-max rounded-xl border border-primary/40 bg-card/95 p-3 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${N}, 1rem)` }}
            onMouseLeave={() => setHover({ r: 0, c: 0 })}
          >
            {Array.from({ length: N * N }, (_, i) => {
              const r = Math.floor(i / N) + 1;
              const c = (i % N) + 1;
              const on = r <= hover.r && c <= hover.c;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(r, c, header);
                    setOpen(false);
                  }}
                  className={`h-4 w-4 rounded-[3px] border transition-colors ${
                    on
                      ? "border-primary bg-primary/50"
                      : "border-border/60 bg-surface/60 hover:border-primary/50"
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span className="tabular-nums">
              {hover.r > 0 ? `${hover.c} × ${hover.r}` : "Pick a size"}
            </span>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={header}
                onChange={(e) => setHeader(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              Header row
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

type TableAction =
  | "rowAbove"
  | "rowBelow"
  | "colBefore"
  | "colAfter"
  | "deleteRow"
  | "deleteCol"
  | "deleteTable";

function findCell(node: Node | null, boundary: HTMLElement): HTMLTableCellElement | null {
  let el: Element | null = node instanceof Element ? node : node?.parentElement ?? null;
  while (el && el !== boundary) {
    if (el.tagName === "TD" || el.tagName === "TH") return el as HTMLTableCellElement;
    el = el.parentElement;
  }
  return null;
}

function placeCaret(node: Node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function performTableAction(cell: HTMLTableCellElement, action: TableAction) {
  const row = cell.parentElement as HTMLTableRowElement;
  const table = row.closest("table") as HTMLTableElement | null;
  if (!table) return;

  switch (action) {
    case "rowAbove": {
      const newRow = table.insertRow(row.rowIndex);
      for (let i = 0; i < row.cells.length; i++) {
        const c = newRow.insertCell();
        c.innerHTML = "&nbsp;";
      }
      placeCaret(newRow.cells[cell.cellIndex]);
      break;
    }
    case "rowBelow": {
      const newRow = table.insertRow(row.rowIndex + 1);
      for (let i = 0; i < row.cells.length; i++) {
        const c = newRow.insertCell();
        c.innerHTML = "&nbsp;";
      }
      placeCaret(newRow.cells[cell.cellIndex]);
      break;
    }
    case "colBefore": {
      const idx = cell.cellIndex;
      for (const r of Array.from(table.rows)) {
        const c = r.insertCell(idx);
        c.innerHTML = "&nbsp;";
      }
      placeCaret(row.cells[idx]);
      break;
    }
    case "colAfter": {
      const idx = cell.cellIndex + 1;
      for (const r of Array.from(table.rows)) {
        const c = r.insertCell(idx);
        c.innerHTML = "&nbsp;";
      }
      placeCaret(row.cells[idx]);
      break;
    }
    case "deleteRow": {
      if (table.rows.length <= 1) {
        table.remove();
      } else {
        const focusRow = Math.max(0, Math.min(row.rowIndex, table.rows.length - 2));
        table.deleteRow(row.rowIndex);
        placeCaret(table.rows[focusRow].cells[Math.min(cell.cellIndex, table.rows[focusRow].cells.length - 1)]);
      }
      break;
    }
    case "deleteCol": {
      const idx = cell.cellIndex;
      for (const r of Array.from(table.rows)) {
        if (r.cells.length > 1) r.deleteCell(idx);
      }
      if (table.rows[0]?.cells.length === 0 || table.rows.length === 0) {
        table.remove();
      } else {
        const focusCol = Math.min(idx, table.rows[0].cells.length - 1);
        placeCaret(row.cells[focusCol] ?? table.rows[0].cells[focusCol]);
      }
      break;
    }
    case "deleteTable": {
      table.remove();
      break;
    }
  }
}
