import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parsePaperFile } from "@/lib/exam.functions";
import type { Paper } from "./types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MathMarkdown } from "@/components/MathMarkdown";
import { ImportTray } from "./ImportTray";
import { useImportQueue, type ImportJob } from "@/hooks/useImportQueue";
import {
  FileText,
  Loader2,
  Trash2,
  Upload,
  Play,
  Library,
  Sparkles,
  X,
  Wand2,
  FileDown,
  ChevronRight,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";

const PdfViewerDialog = lazy(() =>
  import("./PdfViewerDialog").then((m) => ({ default: m.PdfViewerDialog })),
);

type Props = {
  papers: Paper[];
  loading: boolean;
  onStart: (paper: Paper) => void;
  onRefresh: () => void;
  userId: string;
};

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

type Parsed = Awaited<ReturnType<typeof parsePaperFile>>;

type ImportPref = "ask" | "interactive" | "pdf";
const IMPORT_PREF_KEY = "summit-exam-import-mode";

export function ExamLibrary({ papers, loading, onStart, onRefresh, userId }: Props) {
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [importPref, setImportPref] = useState<ImportPref>("ask");
  const [preview, setPreview] = useState<{ parsed: Parsed; filename: string; jobId: string } | null>(
    null,
  );
  const [viewing, setViewing] = useState<{ url: string; paper: Paper } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Remember the student's upload preference across sessions and devices.
  useEffect(() => {
    const saved = localStorage.getItem(IMPORT_PREF_KEY) as ImportPref | null;
    if (saved === "ask" || saved === "interactive" || saved === "pdf") setImportPref(saved);
  }, []);

  const choosePref = (next: ImportPref) => {
    setImportPref(next);
    try {
      localStorage.setItem(IMPORT_PREF_KEY, next);
    } catch {
      // ignore
    }
  };


  /** Background worker for every queued import. */
  const runJob = useCallback(
    async (job: ImportJob, { setPct, setStage }: { setPct: (n: number) => void; setStage: (s: ImportJob["stage"]) => void }) => {
      if (job.mode === "pdf") {
        setStage("uploading");
        setPct(20);
        const safe = job.file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${userId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("exam-papers")
          .upload(path, job.file, {
            contentType: job.file.type || "application/pdf",
            upsert: false,
          });
        if (upErr) throw upErr;
        setPct(80);

        const { error } = await supabase.from("exam_papers").insert({
          owner_id: userId,
          is_library: false,
          title: job.file.name.replace(/\.[^.]+$/, ""),
          subject: "Uploaded",
          exam_type: "PDF",
          description: "Stored as a file — open or download it any time.",
          file_path: path,
        });
        if (error) throw error;
        onRefresh();
        return null;
      }

      // Interactive: read → extract, with a smooth stage-based bar.
      setStage("extracting");
      setPct(10);
      const isText = job.file.type.startsWith("text/") || job.file.name.endsWith(".txt");
      const payload = isText
        ? {
            filename: job.file.name,
            mimeType: job.file.type || "text/plain",
            text: await job.file.text(),
          }
        : {
            filename: job.file.name,
            mimeType: job.file.type || "application/pdf",
            dataUrl: await readAsDataUrl(job.file),
          };
      setPct(25);

      let crawl = 25;
      const timer = setInterval(() => {
        crawl = Math.min(95, crawl + Math.max(0.6, (95 - crawl) * 0.06));
        setPct(crawl);
      }, 500);
      try {
        return await parsePaperFile({ data: payload });
      } finally {
        clearInterval(timer);
      }
    },
    [onRefresh, userId],
  );

  const { jobs, enqueue, dismiss, retry, patch } = useImportQueue(runJob);

  /** The student reviewed the extraction and wants the interactive paper. */
  const savePreview = useCallback(async () => {
    if (!preview) return;
    const { parsed, filename, jobId } = preview;
    setSaving(true);
    patch(jobId, { stage: "saving", pct: 60 });
    const t = toast.loading("Building your interactive paper…");
    try {
      const { data: paper, error } = await supabase
        .from("exam_papers")
        .insert({
          owner_id: userId,
          is_library: false,
          title: parsed.title,
          subject: parsed.subject,
          year: parsed.year,
          exam_type: "Uploaded Paper",
          description: `${parsed.questions.length} questions extracted from ${filename}`,
        })
        .select()
        .single();
      if (error) throw error;

      const rows = parsed.questions.map((q, i) => ({
        paper_id: (paper as Paper).id,
        position: i + 1,
        qtype: q.qtype,
        prompt: q.prompt,
        options: q.options,
        correct_option: q.correctOption,
        marks: q.marks,
        criteria: q.criteria,
        exemplar: q.exemplar,
        topic: q.topic,
      }));
      const { error: qErr } = await supabase.from("exam_questions").insert(rows);
      if (qErr) throw qErr;

      toast.success(`"${parsed.title}" is ready to sit`, { id: t });
      setPreview(null);
      dismiss(jobId);
      onRefresh();
    } catch (err) {
      patch(jobId, { stage: "ready", pct: 100 });
      toast.error(err instanceof Error ? err.message : "Could not save that paper", { id: t });
    } finally {
      setSaving(false);
    }
  }, [preview, onRefresh, userId, patch, dismiss]);

  async function remove(paper: Paper) {
    if (paper.file_path) {
      await supabase.storage.from("exam-papers").remove([paper.file_path]);
    }
    const { error } = await supabase.from("exam_papers").delete().eq("id", paper.id);
    if (error) return toast.error(error.message);
    toast.success("Paper removed");
    onRefresh();
  }

  async function openPdf(paper: Paper) {
    if (!paper.file_path) return;
    const { data, error } = await supabase.storage
      .from("exam-papers")
      .createSignedUrl(paper.file_path, 60 * 60);
    if (error || !data) return toast.error(error?.message ?? "Could not open that file");
    setViewing({ url: data.signedUrl, paper });
  }


  const library = papers.filter((p) => p.is_library);
  const mine = papers.filter((p) => !p.is_library);
  const mineBySubject = [
    ...mine
      .reduce((map, p) => {
        const key = p.subject || "General";
        map.set(key, [...(map.get(key) ?? []), p]);
        return map;
      }, new Map<string, Paper[]>())
      .entries(),
  ].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-8">
      {pending && (
        <ImportChoiceDialog
          file={pending}
          busy={false}
          onClose={() => setPending(null)}
          onInteractive={() => {
            const f = pending;
            setPending(null);
            enqueue(f, "interactive");
            toast.info("Extracting in the background — keep working.");
          }}
          onPdf={() => {
            const f = pending;
            setPending(null);
            enqueue(f, "pdf");
          }}
        />
      )}

      <ImportTray
        jobs={jobs}
        onDismiss={dismiss}
        onRetry={retry}
        onReview={(job) =>
          setPreview({
            parsed: job.result as Parsed,
            filename: job.file.name,
            jobId: job.id,
          })
        }
      />

      {viewing && (
        <Suspense fallback={null}>
          <PdfViewerDialog
            paperId={viewing.paper.id}
            url={viewing.url}
            title={viewing.paper.title}
            subject={viewing.paper.subject}
            onClose={() => setViewing(null)}
          />
        </Suspense>
      )}

      {preview && (
        <InteractivePreviewDialog
          parsed={preview.parsed}
          busy={saving}
          onCancel={() => setPreview(null)}
          onConfirm={() => void savePreview()}
        />
      )}



      {/* Uploader */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`relative overflow-hidden rounded-2xl border border-dashed p-8 text-center transition-all duration-300 ${
          dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border bg-card/50 hover:border-primary/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <div className="rounded-xl border border-border bg-surface/70 p-3 pulse-glow">
            {jobs.some((j) => j.stage === "uploading" || j.stage === "extracting") ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-primary" />
            )}
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Upload a past paper</h3>
          <p className="text-sm text-muted-foreground">
            Drop a PDF, image or text file here — your choice below decides what happens next.
          </p>

          {/* Always-visible import choice */}
          <div className="mt-1 flex w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-border/70 bg-surface/50 p-1.5 backdrop-blur">
            {(
              [
                { id: "ask", label: "Ask each time", icon: <Sparkles className="h-3.5 w-3.5" /> },
                {
                  id: "interactive",
                  label: "Interactive exam",
                  icon: <Wand2 className="h-3.5 w-3.5" />,
                },
                { id: "pdf", label: "PDF view", icon: <FileDown className="h-3.5 w-3.5" /> },
              ] as { id: ImportPref; label: string; icon: React.ReactNode }[]
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => choosePref(o.id)}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all duration-300 ${
                  importPref === o.id
                    ? "bg-primary/20 text-foreground shadow-[0_0_0_1px_var(--color-border)]"
                    : "text-muted-foreground hover:bg-surface/80 hover:text-foreground"
                }`}
              >
                {o.icon} {o.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={false}
            onClick={() => inputRef.current?.click()}
            className="gap-2 border-border bg-surface/60"
          >
            <Sparkles className="h-4 w-4 text-yellow" /> Choose file
          </Button>
        </div>

      </div>


      <Section
        icon={<Library className="h-4 w-4 text-primary" />}
        title="Paper library"
        subtitle="Curated HSC-style papers, ready to sit."
      >
        {loading ? (
          <SkeletonGrid />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {library.map((p, i) => (
              <PaperCard key={p.id} paper={p} index={i} onStart={onStart} />
            ))}
          </div>
        )}
      </Section>

      <Section
        icon={<FileText className="h-4 w-4 text-yellow" />}
        title="My uploads"
        subtitle="Your own papers, filed by subject."
      >
        {mine.length === 0 ? (
          <p className="rounded-xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
            Nothing uploaded yet — drop a past paper above to build your own quiz.
          </p>
        ) : (
          <div className="space-y-3">
            {mineBySubject.map(([subject, rows], si) => (
              <details
                key={subject}
                open
                className="fade-in-up group overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-md transition-all duration-300 hover:border-primary/50"
                style={{ animationDelay: `${si * 60}ms` }}
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-open:rotate-90 group-open:text-primary" />
                  <FolderOpen className="h-4 w-4 text-yellow" />
                  <span className="text-sm font-medium">{subject}</span>
                  <span className="ml-auto rounded-full border border-border bg-surface/70 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    {rows.length} {rows.length === 1 ? "paper" : "papers"}
                  </span>
                </summary>
                <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((p, i) => (
                    <PaperCard
                      key={p.id}
                      paper={p}
                      index={i}
                      onStart={onStart}
                      onDelete={remove}
                      onOpenPdf={openPdf}
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="rounded-lg border border-border bg-surface/70 p-2">{icon}</span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-card/40" />
      ))}
    </div>
  );
}

function PaperCard({
  paper,
  index,
  onStart,
  onDelete,
  onOpenPdf,
}: {
  paper: Paper;
  index: number;
  onStart: (p: Paper) => void;
  onDelete?: (p: Paper) => void;
  onOpenPdf?: (p: Paper) => void;
}) {
  const isPdf = Boolean(paper.file_path);
  return (
    <article
      className="fade-in-up group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-md purple-glow-hover"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {paper.exam_type}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(paper)}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
            aria-label="Delete paper"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <h3 className="text-sm font-semibold leading-snug tracking-tight">{paper.title}</h3>
      <p className="mt-1 text-xs text-primary">
        {paper.subject}
        {paper.year ? ` · ${paper.year}` : ""}
      </p>
      {paper.description && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{paper.description}</p>
      )}
      {isPdf ? (
        <Button
          onClick={() => onOpenPdf?.(paper)}
          size="sm"
          variant="outline"
          className="mt-4 w-full gap-2 border-border bg-surface/60"
        >
          <FileDown className="h-3.5 w-3.5 text-yellow" /> Open PDF
        </Button>
      ) : (
        <Button onClick={() => onStart(paper)} size="sm" className="mt-4 w-full gap-2">
          <Play className="h-3.5 w-3.5" /> Start paper
        </Button>
      )}
    </article>
  );
}

/** Glossy choice sheet shown right after a file lands. */
function ImportChoiceDialog({
  file,
  busy,
  onClose,
  onInteractive,
  onPdf,
}: {
  file: File;
  busy: boolean;
  onClose: () => void;
  onInteractive: () => void;
  onPdf: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-md"
      />
      <div className="scale-in relative w-full max-w-lg overflow-hidden rounded-2xl border border-primary/30 bg-card/80 p-6 shadow-2xl backdrop-blur-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
        />
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Cancel import"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="bg-gradient-to-r from-primary to-yellow bg-clip-text text-lg font-semibold tracking-tight text-transparent">
          How should this paper be added?
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{file.name}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            disabled={busy}
            onClick={onInteractive}
            className="group rounded-xl border border-border bg-surface/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_0_28px_-12px_var(--primary)] disabled:opacity-60"
          >
            <Wand2 className="h-5 w-5 text-primary" />
            <div className="mt-2 text-sm font-medium">Interactive exam</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Summit extracts the questions, marks and criteria so you can sit it and get feedback.
            </p>
          </button>

          <button
            disabled={busy}
            onClick={onPdf}
            className="group rounded-xl border border-border bg-surface/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-yellow/60 hover:shadow-[0_0_28px_-12px_var(--yellow)] disabled:opacity-60"
          >
            <FileDown className="h-5 w-5 text-yellow" />
            <div className="mt-2 text-sm font-medium">Just the PDF</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Save the file as-is in your uploads and open it whenever you want.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Glossy confirmation showing exactly what the interactive exam will contain. */
function InteractivePreviewDialog({
  parsed,
  busy,
  onCancel,
  onConfirm,
}: {
  parsed: Parsed;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const totalMarks = parsed.questions.reduce((s, q) => s + q.marks, 0);
  const mcq = parsed.questions.filter((q) => q.qtype === "mcq").length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-md"
      />
      <div className="scale-in relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card/85 shadow-2xl backdrop-blur-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
        />
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="min-w-0">
            <h3 className="truncate bg-gradient-to-r from-primary to-yellow bg-clip-text text-lg font-semibold tracking-tight text-transparent">
              {parsed.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {parsed.subject}
              {parsed.year ? ` · ${parsed.year}` : ""} · {parsed.questions.length} questions ·{" "}
              {totalMarks} marks · {mcq} multiple choice
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Discard"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 pb-4">
          {parsed.questions.slice(0, 6).map((q, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/50 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Q{i + 1} · {q.qtype === "mcq" ? "Multiple choice" : q.qtype === "extended" ? "Extended" : "Short"}
                </span>
                <span className="rounded-full border border-yellow/40 bg-yellow/10 px-2 py-0.5 text-[10px] text-yellow">
                  {q.marks} {q.marks === 1 ? "mark" : "marks"}
                </span>
              </div>
              <MathMarkdown className="text-sm leading-relaxed text-foreground">
                {q.prompt}
              </MathMarkdown>
              {q.options.length > 0 && (
                <div className="mt-2 space-y-1">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex gap-2 text-xs text-muted-foreground">
                      <span>{String.fromCharCode(65 + oi)}.</span>
                      <MathMarkdown className="flex-1">{o}</MathMarkdown>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {parsed.questions.length > 6 && (
            <p className="text-center text-xs text-muted-foreground">
              + {parsed.questions.length - 6} more questions
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Discard
          </Button>
          <Button onClick={onConfirm} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Create interactive exam
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExamLibrary;


