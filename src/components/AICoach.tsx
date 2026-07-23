import { useRef, useState } from "react";
import { Sparkles, Upload, Send, Loader2, X, FileText, Brain, ListChecks, Network, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { askCoach, studyKit } from "@/lib/ai.functions";

type Mode = "explain" | "generate" | "mark" | "quiz" | "mistake" | "chat";
type Output = "summary" | "flashcards" | "quiz" | "mindmap";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "chat", label: "Ask", hint: "Ask anything about your studies" },
  { id: "explain", label: "Explain", hint: "Paste a syllabus dot point" },
  { id: "generate", label: "HSC Qs", hint: "Topic to generate exam questions on" },
  { id: "mark", label: "Mark", hint: "Question — then paste your answer below" },
  { id: "mistake", label: "Mistake", hint: "Your wrong answer + the question" },
  { id: "quiz", label: "Quiz", hint: "Paste notes to quiz yourself on" },
];

const OUTPUTS: { id: Output; label: string; icon: typeof BookOpen }[] = [
  { id: "summary", label: "Summary", icon: BookOpen },
  { id: "flashcards", label: "Flashcards", icon: ListChecks },
  { id: "quiz", label: "Quiz", icon: Brain },
  { id: "mindmap", label: "Mind map", icon: Network },
];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function AICoach() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open AI Study Coach"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-primary/40 bg-gradient-to-br from-primary/90 to-primary/70 px-4 py-3 text-primary-foreground shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.7)] backdrop-blur transition hover:scale-105 hover:shadow-[0_10px_40px_-8px_hsl(var(--primary)/0.9)]"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">AI Coach</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-xl flex-col gap-0 border-l border-primary/30 bg-background/95 p-0 backdrop-blur">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Study Coach
          </SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="coach" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-4 mt-3 grid grid-cols-2">
            <TabsTrigger value="coach">Tutor</TabsTrigger>
            <TabsTrigger value="kit">Study Kit</TabsTrigger>
          </TabsList>
          <TabsContent value="coach" className="min-h-0 flex-1 overflow-hidden">
            <CoachPanel />
          </TabsContent>
          <TabsContent value="kit" className="min-h-0 flex-1 overflow-hidden">
            <StudyKitPanel />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function CoachPanel() {
  const ask = useServerFn(askCoach);
  const [mode, setMode] = useState<Mode>("chat");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  const activeMode = MODES.find((m) => m.id === mode)!;

  async function run() {
    if (!input.trim()) return;
    setBusy(true);
    setResult("");
    try {
      const res = await ask({
        data: {
          mode,
          input: input.trim(),
          subject: subject.trim() || undefined,
          studentAnswer: mode === "mark" || mode === "mistake" ? answer.trim() || undefined : undefined,
        },
      });
      setResult(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-4 pt-3">
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              mode === m.id
                ? "border-primary/60 bg-primary/20 text-foreground"
                : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject (optional) — e.g. Physics"
        className="h-9"
      />
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={activeMode.hint}
        rows={3}
        className="resize-none"
      />
      {(mode === "mark" || mode === "mistake") && (
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer…"
          rows={4}
          className="resize-none"
        />
      )}
      <Button onClick={run} disabled={busy || !input.trim()} className="gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {busy ? "Thinking…" : "Ask coach"}
      </Button>
      <ResultView text={result} busy={busy} />
    </div>
  );
}

function StudyKitPanel() {
  const process = useServerFn(studyKit);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [output, setOutput] = useState<Output>("summary");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function run() {
    if (!file && !text.trim()) {
      toast.error("Upload a file or paste some notes");
      return;
    }
    setBusy(true);
    setResult("");
    try {
      let payload: {
        output: Output;
        text?: string;
        filename?: string;
        mime?: string;
        fileBase64?: string;
      } = { output };
      if (file) {
        const b64 = await fileToBase64(file);
        payload = { ...payload, filename: file.name, mime: file.type || "application/pdf", fileBase64: b64 };
      }
      if (text.trim()) payload.text = text.trim();
      const res = await process({ data: payload });
      setResult(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-4 pt-3">
      <div className="grid grid-cols-4 gap-1.5">
        {OUTPUTS.map((o) => {
          const Icon = o.icon;
          return (
            <button
              key={o.id}
              onClick={() => setOutput(o.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition ${
                output === o.id
                  ? "border-primary/60 bg-primary/20 text-foreground"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {o.label}
            </button>
          );
        })}
      </div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-5 text-center transition hover:border-primary/60 hover:bg-primary/10"
      >
        {file ? (
          <>
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> remove
            </button>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Drop PDF / PowerPoint here</span>
            <span className="text-xs text-muted-foreground">or click to browse</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.pptx,.ppt,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="…or paste your notes here"
        rows={4}
        className="resize-none"
      />
      <Button onClick={run} disabled={busy || (!file && !text.trim())} className="gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Generating…" : `Generate ${output}`}
      </Button>
      <ResultView text={result} busy={busy} />
    </div>
  );
}

function ResultView({ text, busy }: { text: string; busy: boolean }) {
  if (!text && !busy) return null;
  return (
    <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border/60 bg-muted/20 p-4">
      {busy && !text ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Working through it…
        </div>
      ) : (
        <div className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-code:text-primary">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}
    </ScrollArea>
  );
}
