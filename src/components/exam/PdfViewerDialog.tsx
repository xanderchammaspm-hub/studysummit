import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Download, Loader2, Minus, Plus, X } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

type Props = {
  url: string;
  title: string;
  subject?: string;
  onClose: () => void;
};

/**
 * Full-screen glass PDF reader — the paper scrolls page by page inside the app
 * instead of being handed off to a raw browser tab.
 */
export function PdfViewerDialog({ url, title, subject, onClose }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const measure = () => setWidth(Math.min(900, Math.max(320, window.innerWidth - 140)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || numPages === 0) return;
    const pages = Array.from(el.querySelectorAll<HTMLElement>("[data-page]"));
    const mid = el.scrollTop + el.clientHeight / 2;
    let active = 1;
    for (const p of pages) {
      if (p.offsetTop <= mid) active = Number(p.dataset["page"]);
    }
    setCurrent(active);
  }, [numPages]);

  const pages = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6">
      <button
        aria-label="Close viewer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/80 backdrop-blur-xl"
      />

      <div className="scale-in relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-primary/30 bg-card/80 shadow-[0_40px_120px_-40px_var(--primary)] backdrop-blur-2xl">
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
            {subject && (
              <span className="mt-1 inline-block rounded-full border border-border bg-surface/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                {subject}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
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
                <div
                  key={p}
                  data-page={p}
                  className="overflow-hidden rounded-xl border border-border/80 shadow-[0_18px_50px_-24px_var(--primary)]"
                >
                  <Page
                    pageNumber={p}
                    width={width}
                    scale={scale}
                    renderAnnotationLayer={false}
                    renderTextLayer
                    loading={<PageSkeleton />}
                  />
                </div>
              ))}
            </Document>
          )}
        </div>
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
