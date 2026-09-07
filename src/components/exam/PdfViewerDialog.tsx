import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Download,
  Highlighter,
  Loader2,
  Minus,
  MousePointer2,
  PanelRight,
  Plus,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { usePaperAnnotations } from "@/hooks/usePaperAnnotations";
import {
  HIGHLIGHT_COLOURS,
  type HighlightColour,
  type NormRect,
} from "./types";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

type Props = {
  paperId: string;
  url: string;
  title: string;
  subject?: string;
  onClose: () => void;
};

type Mode = "read" | "highlight" | "note";

const COLOUR_ORDER: HighlightColour[] = ["purple", "gold", "green", "red"];

/**
 * Full-screen glass PDF reader with highlight + note tools. Annotations are
 * stored per paper and restored on reopen.
 */
export function PdfViewerDialog({ paperId, url, title, subject, onClose }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [width, setWidth] = useState(760);

  const [mode, setMode] = useState<Mode>("read");
  const [colour, setColour] = useState<HighlightColour>("purple");
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<
    { page: number; x: number; y: number; id?: string; body: string } | null
  >(null);

  const ann = usePaperAnnotations(paperId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (draft) setDraft(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, draft]);

  useEffect(() => {
    const measure = () =>
      setWidth(Math.min(900, Math.max(320, window.innerWidth - (panelOpen ? 460 : 140))));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [panelOpen]);

  const onScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const el = scrollRef.current;
      if (!el || numPages === 0) return;
      const pages = Array.from(el.querySelectorAll<HTMLElement>("[data-page]"));
      const mid = el.scrollTop + el.clientHeight / 2;
      let active = 1;
      for (const page of pages) {
        if (page.offsetTop <= mid) active = Number(page.dataset["page"]);
      }
      setCurrent((previous) => (previous === active ? previous : active));
    });
  }, [numPages]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    },
    [],
  );

  const goToPage = useCallback((page: number) => {
    const el = scrollRef.current;
    const target = el?.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if (!el || !target) return;
    el.scrollTo({ top: target.offsetTop - 16, behavior: "smooth" });
  }, []);

  const pages = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);

  /** Turn the live text selection into normalised rects on the given page. */
  const captureSelection = useCallback(
    (page: number, host: HTMLElement) => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!host.contains(range.commonAncestorContainer)) return;
      const box = host.getBoundingClientRect();
      const rects: NormRect[] = Array.from(range.getClientRects())
        .filter((r) => r.width > 1 && r.height > 1)
        .map((r) => ({
          x: (r.left - box.left) / box.width,
          y: (r.top - box.top) / box.height,
          w: r.width / box.width,
          h: r.height / box.height,
        }));
      if (!rects.length) return;
      ann.addHighlight({ page, rects, colour, text: sel.toString().slice(0, 400) });
      sel.removeAllRanges();
    },
    [ann, colour],
  );

  const onPageClick = useCallback(
    (page: number, host: HTMLElement, e: React.MouseEvent) => {
      if (mode !== "note") return;
      const box = host.getBoundingClientRect();
      setDraft({
        page,
        x: (e.clientX - box.left) / box.width,
        y: (e.clientY - box.top) / box.height,
        body: "",
      });
    },
    [mode],
  );

  const saveDraft = useCallback(() => {
    if (!draft) return;
    const body = draft.body.trim();
    if (!body) {
      if (draft.id) ann.removeNote(draft.id);
      setDraft(null);
      return;
    }
    if (draft.id) ann.updateNote(draft.id, body);
    else ann.addNote({ page: draft.page, x: draft.x, y: draft.y, body });
    setDraft(null);
  }, [ann, draft]);

  const entries = useMemo(() => {
    const list = [
      ...ann.highlights.map((h) => ({ kind: "highlight" as const, ...h })),
      ...ann.notes.map((n) => ({ kind: "note" as const, ...n })),
    ];
    return list.sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);
  }, [ann.highlights, ann.notes]);

  const toolBtn = (active: boolean) =>
    `rounded-lg border p-1.5 transition-all ${
      active
        ? "border-primary/70 bg-primary/15 text-foreground shadow-[0_0_18px_-6px_var(--primary)]"
        : "border-border bg-surface/60 text-muted-foreground hover:border-primary/60 hover:text-foreground"
    }`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6">
      <button
        aria-label="Close viewer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/80 backdrop-blur-xl"
      />

      <div className="scale-in relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-primary/30 bg-card/80 shadow-[0_40px_120px_-40px_var(--primary)] backdrop-blur-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow/50 to-transparent"
        />

        {/* Header */}
        <header className="flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="truncate bg-gradient-to-r from-primary to-yellow bg-clip-text text-sm font-semibold tracking-tight text-transparent sm:text-base">
              {title}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              {subject && (
                <span className="inline-block rounded-full border border-border bg-surface/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {subject}
                </span>
              )}
              {ann.count > 0 && (
                <span className="inline-block rounded-full border border-yellow/40 bg-yellow/10 px-2 py-0.5 text-[10px] tracking-wide text-yellow">
                  {ann.count} annotation{ann.count === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!failed && (
              <>
                <div className="mr-1 flex items-center gap-1 rounded-xl border border-border/70 bg-surface/40 p-1">
                  <button
                    onClick={() => setMode("read")}
                    className={toolBtn(mode === "read")}
                    aria-label="Read mode"
                    title="Read"
                  >
                    <MousePointer2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setMode("highlight")}
                    className={toolBtn(mode === "highlight")}
                    aria-label="Highlight mode"
                    title="Highlight — select text"
                  >
                    <Highlighter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setMode("note")}
                    className={toolBtn(mode === "note")}
                    aria-label="Note mode"
                    title="Note — click a page"
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                  </button>
                </div>

                {mode === "highlight" && (
                  <div className="mr-1 flex items-center gap-1">
                    {COLOUR_ORDER.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColour(c)}
                        aria-label={`${c} highlight`}
                        className={`h-4 w-4 rounded-full border transition-transform ${
                          colour === c
                            ? "scale-110 border-foreground/70"
                            : "border-border/70 hover:scale-105"
                        }`}
                        style={{ background: HIGHLIGHT_COLOURS[c] }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            <span className="rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground">
              {numPages ? `${current} / ${numPages}` : "—"}
            </span>
            <button
              onClick={() => setScale((s) => Math.max(0.6, +(s - 0.15).toFixed(2)))}
              className="rounded-lg border border-border bg-surface/60 p-1.5 text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground"
              aria-label="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center text-[11px] tabular-nums text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.4, +(s + 0.15).toFixed(2)))}
              className="rounded-lg border border-border bg-surface/60 p-1.5 text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground"
              aria-label="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {!failed && (
              <button
                onClick={() => setPanelOpen((v) => !v)}
                className={toolBtn(panelOpen)}
                aria-label="Toggle notes and highlights panel"
                title="Notes & highlights"
              >
                <PanelRight className="h-3.5 w-3.5" />
              </button>
            )}
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-surface/60 p-1.5 text-muted-foreground transition-all hover:border-yellow/60 hover:text-yellow"
              aria-label="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-surface/60 p-1.5 text-muted-foreground transition-all hover:border-destructive/60 hover:text-destructive"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Document */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="min-h-0 flex-1 overflow-auto px-3 py-6 sm:px-6"
          >
            {failed ? (
              <iframe
                title={title}
                src={url}
                className="h-full min-h-[70vh] w-full rounded-2xl border border-border bg-surface/40"
              />
            ) : (
              <Document
                file={url}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                onLoadError={() => setFailed(true)}
                loading={<PageSkeleton />}
                error={<PageSkeleton />}
                className="flex flex-col items-center gap-6"
              >
                {pages.map((p) => (
                  <PageLayer
                    key={p}
                    page={p}
                    width={width}
                    scale={scale}
                    mode={mode}
                    highlights={ann.highlights.filter((h) => h.page === p)}
                    notes={ann.notes.filter((n) => n.page === p)}
                    onSelect={captureSelection}
                    onClickPage={onPageClick}
                    onRemoveHighlight={ann.removeHighlight}
                    onOpenNote={(n) =>
                      setDraft({ page: n.page, x: n.x, y: n.y, id: n.id, body: n.body })
                    }
                    draft={draft && draft.page === p ? draft : null}
                    onDraftChange={(body) => setDraft((d) => (d ? { ...d, body } : d))}
                    onDraftSave={saveDraft}
                    onDraftCancel={() => setDraft(null)}
                    onDraftDelete={() => {
                      if (draft?.id) ann.removeNote(draft.id);
                      setDraft(null);
                    }}
                  />
                ))}
              </Document>
            )}
          </div>

          {/* Side panel */}
          {panelOpen && !failed && (
            <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-border/70 bg-surface/30 p-4 backdrop-blur-xl md:flex">
              <h3 className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                Notes &amp; highlights
              </h3>
              {entries.length === 0 ? (
                <p className="rounded-xl border border-border/70 bg-surface/40 p-3 text-xs leading-relaxed text-muted-foreground">
                  Pick the highlighter and select text to mark it, or the note tool and click
                  anywhere on a page to pin a thought. Everything saves to this paper
                  automatically.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {entries.map((e) => (
                    <li key={e.id}>
                      <div className="group relative rounded-xl border border-border/70 bg-card/60 p-3 transition-all hover:border-primary/50">
                        <button
                          onClick={() => goToPage(e.page)}
                          className="w-full text-left"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                background:
                                  e.kind === "highlight"
                                    ? HIGHLIGHT_COLOURS[e.colour]
                                    : "var(--yellow)",
                              }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              {e.kind === "highlight" ? "Highlight" : "Note"} · p{e.page}
                            </span>
                          </div>
                          <p className="line-clamp-3 text-xs leading-relaxed text-foreground/85">
                            {e.kind === "highlight" ? e.text || "(no text)" : e.body}
                          </p>
                        </button>
                        <button
                          onClick={() =>
                            e.kind === "highlight"
                              ? ann.removeHighlight(e.id)
                              : ann.removeNote(e.id)
                          }
                          aria-label="Delete annotation"
                          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

type LayerProps = {
  page: number;
  width: number;
  scale: number;
  mode: Mode;
  highlights: import("./types").Highlight[];
  notes: import("./types").PaperNote[];
  onSelect: (page: number, host: HTMLElement) => void;
  onClickPage: (page: number, host: HTMLElement, e: React.MouseEvent) => void;
  onRemoveHighlight: (id: string) => void;
  onOpenNote: (n: import("./types").PaperNote) => void;
  draft: { page: number; x: number; y: number; id?: string; body: string } | null;
  onDraftChange: (body: string) => void;
  onDraftSave: () => void;
  onDraftCancel: () => void;
  onDraftDelete: () => void;
};

function PageLayer({
  page,
  width,
  scale,
  mode,
  highlights,
  notes,
  onSelect,
  onClickPage,
  onRemoveHighlight,
  onOpenNote,
  draft,
  onDraftChange,
  onDraftSave,
  onDraftCancel,
  onDraftDelete,
}: LayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={hostRef}
      data-page={page}
      onMouseUp={() => {
        if (mode === "highlight" && hostRef.current) onSelect(page, hostRef.current);
      }}
      onClick={(e) => {
        if (hostRef.current) onClickPage(page, hostRef.current, e);
      }}
      className={`relative overflow-hidden rounded-xl border border-border/80 shadow-[0_18px_50px_-24px_var(--primary)] ${
        mode === "note" ? "cursor-crosshair" : ""
      }`}
    >
      <Page
        pageNumber={page}
        width={width}
        scale={scale}
        renderAnnotationLayer={false}
        renderTextLayer
        loading={<PageSkeleton />}
      />

      {/* Highlights */}
      <div className="pointer-events-none absolute inset-0">
        {highlights.map((h) =>
          h.rects.map((r, i) => (
            <button
              key={`${h.id}-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveHighlight(h.id);
              }}
              title="Click to remove highlight"
              className="pointer-events-auto absolute rounded-[3px] mix-blend-screen transition-opacity hover:opacity-90"
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
                background: HIGHLIGHT_COLOURS[h.colour],
                opacity: 0.32,
                boxShadow: `0 0 12px -2px ${HIGHLIGHT_COLOURS[h.colour]}`,
              }}
            />
          )),
        )}

        {/* Note pins */}
        {notes.map((n, i) => (
          <button
            key={n.id}
            onClick={(e) => {
              e.stopPropagation();
              onOpenNote(n);
            }}
            title={n.body}
            className="pointer-events-auto absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-yellow/70 bg-background/90 text-[10px] font-semibold text-yellow shadow-[0_0_14px_-2px_var(--yellow)] transition-colors hover:bg-yellow/20"
            style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
          >
            {i + 1}
          </button>
        ))}

        {/* Draft composer */}
        {draft && (
          <div
            className="pointer-events-auto absolute z-10 w-56 rounded-xl border border-primary/40 bg-card/95 p-2 shadow-[0_20px_60px_-24px_var(--primary)] backdrop-blur-xl"
            style={{
              left: `${Math.min(draft.x * 100, 70)}%`,
              top: `${Math.min(draft.y * 100, 85)}%`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              autoFocus
              value={draft.body}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="Write a note…"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-surface/60 p-2 text-xs text-foreground outline-none focus:border-primary/60"
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              {draft.id ? (
                <button
                  onClick={onDraftDelete}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={onDraftCancel}
                  className="rounded-lg border border-border bg-surface/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={onDraftSave}
                  className="rounded-lg border border-primary/60 bg-primary/15 px-2 py-1 text-[11px] text-foreground transition-colors hover:bg-primary/25"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto flex h-[70vh] w-full max-w-[760px] animate-pulse items-center justify-center rounded-xl border border-border bg-surface/40">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}

export default PdfViewerDialog;
