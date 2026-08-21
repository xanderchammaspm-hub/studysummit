import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AtlasMarkdown } from "@/components/AtlasMarkdown";
import { usePacedText } from "@/hooks/usePacedText";
import { ATLAS_SYSTEM_PROMPT } from "@/lib/atlasPrompt";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const SYSTEM = `${ATLAS_SYSTEM_PROMPT}

FOCUS: HSC English short answers (1–6 marks). Always show the mark allocation, model the structure (technique → example → effect → link to question), and mark the student's attempts against NESA criteria.`;


function id() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export function AtlasSectionChat({ storageKey }: { storageKey: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`atlas-section:${storageKey}`);
      setMessages(raw ? (JSON.parse(raw) as Msg[]) : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`atlas-section:${storageKey}`, JSON.stringify(messages));
    } catch {
      // ignore
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, storageKey]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const user: Msg = { id: id(), role: "user", content: text };
    const asst: Msg = { id: id(), role: "assistant", content: "" };
    const history = [...messages, user];
    setMessages([...history, asst]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text().catch(() => "")) || `Error ${res.status}`);
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
            const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => m.map((x) => (x.id === asst.id ? { ...x, content: acc } : x)));
            }
          } catch {
            // partial line
          }
        }
      }
      if (!acc) {
        setMessages((m) => m.filter((x) => x.id !== asst.id));
        toast.error("No response from Atlas — try again.");
      }
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== asst.id));
      toast.error((e as Error).message || "Atlas is unavailable right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="purple-outline overflow-hidden rounded-2xl bg-surface/40">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Atlas AI
        </span>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="max-h-[320px] min-h-[120px] space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Paste a short-answer question and your attempt — Atlas will mark it and model a Band 6 response.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`fade-in-up rounded-xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto max-w-[85%] bg-primary/15 text-foreground"
                  : "max-w-full bg-surface/70 text-foreground"
              }`}
            >
              {m.role === "assistant" ? (
                <AtlasAnswer content={m.content} streaming={busy} />
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-border/60 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="Ask Atlas about a short answer question…"
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none transition-colors focus:border-primary/70"
        />
        <button
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-primary/50 bg-primary/20 text-foreground transition-all hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function AtlasAnswer({ content, streaming }: { content: string; streaming: boolean }) {
  const live = streaming && !content.endsWith("\u0000");
  const shown = usePacedText(content, live);
  return <AtlasMarkdown caret={live && shown.length < content.length}>{shown || "…"}</AtlasMarkdown>;
}
