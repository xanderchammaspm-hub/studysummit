import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parsePaperFile } from "@/lib/exam.functions";
import type { Paper } from "./types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
} from "lucide-react";


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

export function ExamLibrary({ papers, loading, onStart, onRefresh, userId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ parsed: Parsed; filename: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Step 1 — parse the file, then show the confirmation preview. */
  const handleInteractive = useCallback(async (file: File) => {
    setUploading(true);
    const t = toast.loading(`Reading "${file.name}" — extracting questions…`);
    try {
      const isText = file.type.startsWith("text/") || file.name.endsWith(".txt");
      const payload = isText
        ? { filename: file.name, mimeType: file.type || "text/plain", text: await file.text() }
        : {
            filename: file.name,
            mimeType: file.type || "application/pdf",
            dataUrl: await readAsDataUrl(file),
          };

      const parsed = await parsePaperFile({ data: payload });
      toast.success(`${parsed.questions.length} questions found — check the preview`, { id: t });
      setPreview({ parsed, filename: file.name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: t });
    } finally {
      setUploading(false);
    }
  }, []);

  /** Step 2 — the student confirmed, so persist the interactive paper. */
  const savePreview = useCallback(async () => {
    if (!preview) return;
    const { parsed, filename } = preview;
    setUploading(true);
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
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that paper", { id: t });
    } finally {
      setUploading(false);
    }
  }, [preview, onRefresh, userId]);

  /** Store the file as-is so it can be opened or downloaded later. */
  const handleKeepAsPdf = useCallback(
    async (file: File) => {
      setUploading(true);
      const t = toast.loading(`Saving "${file.name}"…`);
      try {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${userId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("exam-papers")
          .upload(path, file, { contentType: file.type || "application/pdf", upsert: false });
        if (upErr) throw upErr;

        const { error } = await supabase.from("exam_papers").insert({
          owner_id: userId,
          is_library: false,
          title: file.name.replace(/\.[^.]+$/, ""),
          subject: "Uploaded",
          exam_type: "PDF",
          description: "Stored as a file — open or download it any time.",
          file_path: path,
        });
        if (error) throw error;

        toast.success("Saved to your uploads", { id: t });
        onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed", { id: t });
      } finally {
        setUploading(false);
      }
    },
    [onRefresh, userId],
  );

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
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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
          busy={uploading}
          onClose={() => setPending(null)}
          onInteractive={() => {
            const f = pending;
            setPending(null);
            void handleInteractive(f);
          }}
          onPdf={() => {
            const f = pending;
            setPending(null);
            void handleKeepAsPdf(f);
          }}
        />
      )}

      {preview && (
        <InteractivePreviewDialog
          parsed={preview.parsed}
          busy={uploading}
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
          if (f) setPending(f);
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
            if (f) setPending(f);
            e.target.value = "";
          }}
        />
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <div className="rounded-xl border border-border bg-surface/70 p-3 pulse-glow">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-primary" />
            )}
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Upload a past paper</h3>
          <p className="text-sm text-muted-foreground">
            Drop a PDF, image or text file here — then choose an interactive exam or keep it as a
            plain PDF.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
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

export default ExamLibrary;

