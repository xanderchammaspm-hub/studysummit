import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

type Msg = { role: "system" | "user" | "assistant"; content: string | ContentBlock[] };

async function callAI(messages: Msg[]): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limit reached — please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace. Add credits to keep using the coach.");
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

const CoachInput = z.object({
  mode: z.enum(["explain", "generate", "mark", "quiz", "mistake", "chat"]),
  subject: z.string().optional(),
  input: z.string().min(1).max(8000),
  studentAnswer: z.string().max(8000).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .optional(),
});

const SYSTEM_BASE = ATLAS_SYSTEM_PROMPT;


const modePrompt: Record<z.infer<typeof CoachInput>["mode"], string> = {
  explain:
    "Explain the following syllabus dot point clearly. Give: 1) a plain-English definition, 2) why it matters, 3) a worked example, 4) 3 key things to remember.",
  generate:
    "Generate 3 HSC-style exam questions on the following topic. Mix short-answer and extended-response. For each: include marks, then a marking rubric with what earns each mark band.",
  mark:
    "Mark the student's answer against HSC criteria. Provide: 1) estimated marks (X/Y), 2) what they did well, 3) what's missing, 4) a model answer, 5) 2 improvement tips.",
  quiz:
    "Create a 5-question quiz from these notes. Number each question. After ALL questions, add a section '## Answers' with concise worked answers.",
  mistake:
    "Explain why the student's answer is wrong or incomplete. Identify the misconception, teach the correct concept, then give a similar practice question.",
  chat: "Answer the student's question in a friendly tutoring style.",
};

export const askCoach = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CoachInput.parse(d))
  .handler(async ({ data }) => {
    const subjectLine = data.subject ? `Subject context: ${data.subject}.\n` : "";
    const messages: Msg[] = [{ role: "system", content: SYSTEM_BASE + "\n" + modePrompt[data.mode] }];
    if (data.history) for (const h of data.history) messages.push(h);
    const userText =
      data.mode === "mark" && data.studentAnswer
        ? `${subjectLine}Question / task:\n${data.input}\n\nStudent's answer:\n${data.studentAnswer}`
        : `${subjectLine}${data.input}`;
    messages.push({ role: "user", content: userText });
    const text = await callAI(messages);
    return { text };
  });

const StudyKitInput = z.object({
  output: z.enum(["summary", "flashcards", "quiz", "mindmap"]),
  filename: z.string().optional(),
  mime: z.string().optional(),
  fileBase64: z.string().optional(),
  text: z.string().optional(),
});

const outputPrompt: Record<z.infer<typeof StudyKitInput>["output"], string> = {
  summary:
    "Produce a well-structured study summary with markdown: '## Overview', '## Key Concepts' (bullets), '## Definitions', '## Worth Memorising'. Be concise but comprehensive.",
  flashcards:
    "Produce 10-15 flashcards. Format EXACTLY as markdown, one per line: `- **Q:** question — **A:** answer`. No preamble.",
  quiz:
    "Produce a 6-question mixed quiz (multiple choice + short answer). Number questions. End with '## Answers' section.",
  mindmap:
    "Produce a mind map as a nested markdown bullet list. Root topic at top level, main branches as bullets, sub-branches indented. Use 3-4 levels of depth.",
};

export const studyKit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => StudyKitInput.parse(d))
  .handler(async ({ data }) => {
    if (!data.fileBase64 && !data.text) throw new Error("Provide a file or text");
    const instruction = outputPrompt[data.output];
    const userContent: ContentBlock[] = [
      { type: "text", text: `${instruction}\n\nSource material follows:` },
    ];
    if (data.fileBase64) {
      const mime = data.mime || "application/pdf";
      userContent.push({
        type: "file",
        file: {
          filename: data.filename || "upload",
          file_data: `data:${mime};base64,${data.fileBase64}`,
        },
      });
    }
    if (data.text) userContent.push({ type: "text", text: data.text });
    const messages: Msg[] = [
      { role: "system", content: SYSTEM_BASE },
      { role: "user", content: userContent },
    ];
    const text = await callAI(messages);
    return { text };
  });
