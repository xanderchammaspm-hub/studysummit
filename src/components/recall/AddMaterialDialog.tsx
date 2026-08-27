import { useRef, useState } from "react";
import { FileText, Loader2, Type, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractMaterialText } from "@/lib/recall.functions";
import { LoadingStages } from "@/components/recall/RecallShared";
import { cn } from "@/lib/utils";

type Props = {
  folderName: string;
  onClose: () => void;
  onSave: (name: string, kind: string, content: string) => Promise<void> | void;
};

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function AddMaterialDialog({ folderName, onClose, onSave }: Props) {
  const [tab, setTab] = useState<"pdf" | "text">("pdf");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (file.size > 12 * 1024 * 1024) {
      setError("That file is over 12 MB — try a smaller PDF.");
      return;
    }
    setBusy(true);
    try {
      const base64 = await readAsBase64(file);
      const res = await extractMaterialText({
        data: { filename: file.name, mime: file.type || "application/pdf", base64 },
      });
      if (!res.text.trim()) throw new Error("No readable text found in that file.");
      await onSave(file.name.replace(/\.[^.]+$/, ""), "pdf", res.text);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleText() {
    setError(null);
    if (text.trim().length < 20) {
      setError("Paste a bit more material so Atlas has something to work with.");
      return;
    }
    setBusy(true);
    try {
      await onSave(title.trim() || "Pasted notes", "text", text.trim());
      onClose();
    } catch {
      setError("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md fade-in-up">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl purple-outline bg-card/90 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Add study material
            </div>
            <div className="text-lg font-semibold tracking-tight">{folderName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface/70 hover:text-foreground cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {busy && tab === "pdf" ? (
          <LoadingStages
            title="Reading your file"
            stages={["Reading your material...", "Cleaning up the text...", "Saving to this folder..."]}
          />
        ) : (
          <div className="p-6">
            <div className="mb-5 inline-flex rounded-full purple-outline bg-surface/60 p-1">
              {(
                [
                  { id: "pdf" as const, label: "Upload PDF", icon: <UploadCloud className="h-3.5 w-3.5" /> },
                  { id: "text" as const, label: "Paste text", icon: <Type className="h-3.5 w-3.5" /> },
                ]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-all duration-300 cursor-pointer",
                    tab === t.id
                      ? "border border-primary/60 bg-primary/25 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "pdf" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFile(file);
                }}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "grid cursor-pointer place-items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300",
                  dragging
                    ? "border-primary/80 bg-primary/10 scale-[1.01]"
                    : "border-border/60 bg-surface/30 hover:border-primary/50 hover:bg-surface/50",
                )}
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl purple-outline bg-card/70 text-primary">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium">Drop a PDF here</div>
                <div className="text-xs text-muted-foreground">or click to choose a file — max 12 MB</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name this resource (e.g. Trig revision notes)"
                  className="w-full rounded-xl purple-outline bg-surface/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/70"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your class notes, textbook content or summaries..."
                  className="min-h-56 w-full resize-y rounded-xl purple-outline bg-surface/50 px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary/70"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {text.trim().length.toLocaleString()} characters
                  </span>
                  <Button onClick={() => void handleText()} disabled={busy} className="cursor-pointer">
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Save material
                  </Button>
                </div>
              </div>
            )}

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
