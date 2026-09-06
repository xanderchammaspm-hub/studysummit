import { ATLAS_SYSTEM_PROMPT } from "@/lib/atlasPrompt";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  X,
  FileText,
  Brain,
  ListChecks,
  Network,
  BookOpen,
  Plus,
  StopCircle,
  Upload,
  Copy,
  Check,
} from "lucide-react";
import { AtlasMarkdown } from "@/components/AtlasMarkdown";
import { HistoryRail } from "@/components/AtlasHistory";
import { useServerFn } from "@tanstack/react-start";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { studyKit } from "@/lib/ai.functions";
import { QuestionBankPanel } from "@/components/QuestionBank";
import { SummitLogo } from "@/components/SummitLogo";

/* --------------------------------- Chat --------------------------------- */

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; ts: number };

const CHAT_KEY = "atlas-ai-chat-v1";
const SYSTEM_PROMPT = ATLAS_SYSTEM_PROMPT;


const SUGGESTIONS: { label: string; prompt: string }[] = [
  {
    label: "Explain a syllabus dot point",
    prompt: "Explain this HSC syllabus dot point clearly with a worked example:\n\n",
  },
  {
    label: "Generate 3 HSC-style questions",
    prompt:
      "Generate 3 HSC-style exam questions with marks and a marking rubric on the topic:\n\n",
  },
  {
    label: "Mark my answer",
    prompt:
      "Mark my HSC answer against the criteria — estimate marks, what I did well, what's missing, and a model answer.\n\nQuestion:\n\n\nMy answer:\n",
  },
  {
    label: "Explain my mistake",
    prompt:
      "Here's a question I got wrong. Explain the misconception and teach me the correct concept.\n\nQuestion:\n\nMy answer:\n",
  },
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export function AICoach() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open Atlas AI"
          className="group fixed z-50 flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-to-br from-primary/90 to-primary/70 px-4 py-3 text-primary-foreground shadow-[0_10px_40px_-8px_oklch(0.7_0.22_300_/_0.8)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_50px_-8px_oklch(0.75_0.24_305_/_0.95)]"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary-foreground/20 blur-sm" />
            <Sparkles className="h-4 w-4 relative" />
          </span>
          <span className="text-sm font-semibold hidden sm:inline">Atlas AI</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="overlay-glass flex w-full sm:max-w-lg md:max-w-2xl flex-col gap-0 border-l border-primary/30 p-0"
      >
        <Tabs defaultValue="chat" className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="border-b border-border/60 px-4 py-3 space-y-0">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="flex items-center gap-2 text-base">
                <SummitLogo size={26} />
                <span>Atlas AI</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-normal">
                  Study coach
                </span>
              </SheetTitle>
              <TabsList className="h-8 grid-cols-3 grid">
                <TabsTrigger value="chat" className="text-xs px-3">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="questions" className="text-xs px-3">
                  Questions
                </TabsTrigger>
                <TabsTrigger value="kit" className="text-xs px-3">
                  Study Kit
                </TabsTrigger>
              </TabsList>
            </div>
          </SheetHeader>
          <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden m-0">
            <ChatPanel />
          </TabsContent>
          <TabsContent value="questions" className="min-h-0 flex-1 overflow-hidden m-0">
            <QuestionBankPanel />
          </TabsContent>
          <TabsContent value="kit" className="min-h-0 flex-1 overflow-hidden m-0">
            <StudyKitPanel />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

type Thread = { id: string; title: string; ts: number; messages: Message[] };
const THREADS_KEY = "atlas-ai-threads-v1";

function titleFrom(messages: Message[]) {
  const first = messages.find((m) => m.role === "user")?.content.trim() ?? "";
  if (!first) return "New chat";
  return first.length > 42 ? `${first.slice(0, 42)}…` : first;
}

function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Thread[];
      if (Array.isArray(parsed)) return parsed;
    }
    // migrate the single legacy thread
    const legacy = localStorage.getItem(CHAT_KEY);
    const msgs = legacy ? (JSON.parse(legacy) as Message[]) : [];
    if (Array.isArray(msgs) && msgs.length) {
      return [{ id: makeId(), title: titleFrom(msgs), ts: Date.now(), messages: msgs }];
    }
  } catch {
    // ignore
  }
  return [];
}

function ChatPanel() {
  const [threads, setThreads] = useState<Thread[]>(loadThreads);
  const [activeId, setActiveId] = useState<string | null>(() => loadThreads()[0]?.id ?? null);
  const [railOpen, setRailOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = threads.find((t) => t.id === activeId)?.messages ?? [];

  const updateThread = (
    id: string,
    update: Message[] | ((prev: Message[]) => Message[]),
  ) => {
    setThreads((prev) => {
      const existing = prev.find((t) => t.id === id);
      const next =
        typeof update === "function"
          ? (update as (p: Message[]) => Message[])(existing?.messages ?? [])
          : update;
      if (!existing) {
        return [{ id, title: titleFrom(next), ts: Date.now(), messages: next }, ...prev];
      }
      return prev.map((t) =>
        t.id === id
          ? {
              ...t,
              messages: next,
              title: !t.title || t.title === "New chat" ? titleFrom(next) : t.title,
            }
          : t,
      );
    });
  };


  // Persist all threads
  useEffect(() => {
    try {
      localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    } catch {
      // ignore quota errors
    }
  }, [threads]);


  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    let tid = activeId;
    if (!tid || !threads.some((t) => t.id === tid)) {
      tid = makeId();
      setActiveId(tid);
    }
    const setMessages = (u: Message[] | ((prev: Message[]) => Message[])) =>
      updateThread(tid as string, u);
    const userMsg: Message = { id: makeId(), role: "user", content: text, ts: Date.now() };
    const asstMsg: Message = { id: makeId(), role: "assistant", content: "", ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages([...nextHistory, asstMsg]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;


    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...nextHistory.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      outer: while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        for (const raw of parts) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          if (data === "[DONE]") break outer;
          try {
            const json = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) {
              acc += delta;
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === asstMsg.id ? { ...msg, content: acc } : msg,
                ),
              );
            }
          } catch {
            // skip malformed partial line
          }
        }
      }
      // If nothing streamed back, drop the empty bubble
      if (!acc) {
        setMessages((m) => m.filter((x) => x.id !== asstMsg.id));
        toast.error("No response from Atlas — try again.");
      }
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name === "AbortError") {
        // keep whatever partial content was accumulated
        setMessages((m) =>
          m
            .map((msg) =>
              msg.id === asstMsg.id && !msg.content
                ? { ...msg, content: "_Stopped._" }
                : msg,
            )
            .filter((msg) => msg.content !== ""),
        );
      } else {
        toast.error(err.message || "Something went wrong");
        setMessages((m) => m.filter((x) => x.id !== asstMsg.id));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const stop = () => abortRef.current?.abort();
  const newChat = () => {
    if (busy) return;
    setActiveId(null);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  };
  const deleteThread = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (id === activeId) setActiveId(null);
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-full">
      <HistoryRail
        open={railOpen}
        onToggle={() => setRailOpen((o) => !o)}
        items={threads.map((t) => ({ id: t.id, title: t.title || "New chat", ts: t.ts }))}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
        onNew={newChat}
        onDelete={deleteThread}
        newLabel="New chat"
        title="Conversations"
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background/40">
        <span className="text-[11px] text-muted-foreground">
          {empty
            ? "Start a conversation"
            : `${messages.filter((m) => m.role === "user").length} message${
                messages.filter((m) => m.role === "user").length === 1 ? "" : "s"
              } · saved on this device`}
        </span>
        <button
          onClick={newChat}
          disabled={busy || empty}
          className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          <Plus className="h-3 w-3" /> New chat
        </button>
      </div>


      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center gap-5 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/40 to-primary/5 shadow-[0_0_30px_-4px_oklch(0.7_0.22_300_/_0.6)]">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold gradient-text">
                How can I help you study?
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Ask anything — syllabus dot points, HSC-style questions, marking,
                mistakes, or quizzes from your notes.
              </p>
            </div>
            <div className="grid gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setInput(s.prompt);
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  className="interactive-glass text-left rounded-lg px-3 py-2 text-xs"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <Bubble
              key={m.id}
              msg={m}
              thinking={busy && m.role === "assistant" && !m.content}
            />
          ))
        )}
      </div>

      <div className="border-t border-border/60 p-3 bg-background/70">
        <div className="interactive-glass relative rounded-2xl focus-within:border-primary/70 focus-within:shadow-[0_0_0_3px_oklch(0.7_0.22_300_/_0.15)]">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask Atlas anything about your studies…"
            rows={1}
            disabled={busy}
            className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 pr-12 py-3 leading-relaxed"
          />
          <div className="absolute right-2 bottom-2">
            {busy ? (
              <button
                onClick={stop}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors"
                aria-label="Stop generation"
                title="Stop"
              >
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                aria-label="Send"
                title="Send (Enter)"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-1.5 text-[10px] text-muted-foreground/70 text-center">
          Enter to send · Shift+Enter for new line · Atlas can be wrong — verify
          important facts.
        </div>
      </div>
      </div>
    </div>

  );
}

function Bubble({ msg, thinking }: { msg: Message; thinking: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-primary/40 bg-primary/20 px-4 py-2.5 text-sm whitespace-pre-wrap text-foreground">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 group">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 mt-0.5 shadow-[0_0_10px_oklch(0.7_0.22_300_/_0.5)]">
        <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        {thinking ? (
          <div className="flex items-center gap-1.5 h-7">
            <span className="atlas-dot" />
            <span className="atlas-dot" style={{ animationDelay: "0.15s" }} />
            <span className="atlas-dot" style={{ animationDelay: "0.3s" }} />
          </div>
        ) : (
          <>
            <AtlasMarkdown>{msg.content}</AtlasMarkdown>
            {msg.content && (
              <button
                onClick={copy}
                className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Copy message"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Study Kit ------------------------------ */

type Output = "summary" | "flashcards" | "quiz" | "mindmap";

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
        payload = {
          ...payload,
          filename: file.name,
          mime: file.type || "application/pdf",
          fileBase64: b64,
        };
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
    <div className="flex h-full flex-col gap-3 px-4 pb-4 pt-3 overflow-y-auto">
      <div className="grid grid-cols-4 gap-1.5">
        {OUTPUTS.map((o) => {
          const Icon = o.icon;
          const active = output === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setOutput(o.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition ${
                active
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
      <button
        onClick={run}
        disabled={busy || (!file && !text.trim())}
        className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Generating…" : `Generate ${output}`}
      </button>
      {(result || busy) && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 max-h-[50vh] overflow-y-auto">
          {busy && !result ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Working through it…
            </div>
          ) : (
            <AtlasMarkdown>{result}</AtlasMarkdown>
          )}
        </div>
      )}
    </div>
  );
}
