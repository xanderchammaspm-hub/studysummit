/** Server-only helpers for the Quick Recall study system. */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } };

export type Msg = { role: "system" | "user"; content: string | ContentBlock[] };

export async function callAI(messages: Msg[], temperature = 0.3): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, messages, temperature }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Atlas is busy — wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1]! : raw;
  const start = body.search(/[[{]/);
  if (start === -1) throw new Error("Atlas returned an unreadable response — try again.");
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  return JSON.parse(body.slice(start, end + 1));
}

export function strArray(v: unknown, max = 8): string[] {
  return Array.isArray(v)
    ? v
        .map((x) => String(x).trim())
        .filter(Boolean)
        .slice(0, max)
    : [];
}

export const GRADING_PHILOSOPHY = [
  "You grade by MEANING, never by keyword matching.",
  "A different wording, informal language, spelling mistakes, or a concise phrasing that still shows understanding is CORRECT.",
  "Only flag something as missing when it is a genuinely important concept from the source material.",
  "Only flag something as incorrect when it is factually wrong or shows a real misconception.",
  "Be encouraging, specific and extremely concise — the student should be able to read your feedback in seconds.",
].join(" ");
