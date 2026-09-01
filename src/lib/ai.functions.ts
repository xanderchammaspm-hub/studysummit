import { ATLAS_SYSTEM_PROMPT } from "@/lib/atlasPrompt";
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

/* ------------------------- HSC question generator ------------------------ */

const QuestionsInput = z.object({
  topic: z.string().min(1).max(500),
  subject: z.string().max(120).optional(),
  focus: z.enum(["Mixed", "Easy", "Medium", "Hard", "HSC"]).default("Mixed"),
  /** Optional study material (Quick Recall notes) to ground the questions in. */
  source: z.string().max(45000).optional(),
});

export const generateQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => QuestionsInput.parse(d))
  .handler(async ({ data }) => {
    const focusLine =
      data.focus === "Mixed"
        ? "Spread them evenly across the four difficulty bands (7 Easy, 7 Medium, 7 Hard, 7 HSC)."
        : `Weight the set heavily toward ${data.focus} difficulty (at least 16 of the 28), and include a few of the other bands.`;

    const system = `${SYSTEM_BASE}

You are generating an exam question bank. Reply with RAW JSON ONLY — no prose, no markdown fences.
Schema: {"questions":[{"n":1,"difficulty":"Easy"|"Medium"|"Hard"|"HSC","marks":number,"question":string,"rubric":string}]}
Return EXACTLY 28 questions. "rubric" is a compact NESA-style marking guide (2-4 short lines, may use "•").`;

    const user = `${data.subject ? `Subject: ${data.subject}\n` : ""}Topic: ${data.topic}\n${focusLine}${
      data.source
        ? `\n\nBase every question strictly on the student's own study material below. Only test content that appears in it.\n\n--- STUDY MATERIAL ---\n${data.source}\n--- END ---`
        : ""
    }`;

    const raw = await callAI([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);

    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
    } catch {
      throw new Error("Atlas returned an unreadable question set — try again.");
    }
    const shape = z.object({
      questions: z
        .array(
          z.object({
            n: z.number().optional(),
            difficulty: z.enum(["Easy", "Medium", "Hard", "HSC"]).catch("Medium"),
            marks: z.number().catch(2),
            question: z.string(),
            rubric: z.string().default(""),
          }),
        )
        .min(1),
    });
    const out = shape.parse(parsed);
    return { questions: out.questions.map((q, i) => ({ ...q, n: i + 1 })) };
  });

/* --------------------------- AI weekly report ---------------------------- */

const WeeklyInput = z.object({
  weekLabel: z.string().max(60),
  summary: z.string().min(1).max(6000),
});

export const weeklyReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => WeeklyInput.parse(d))
  .handler(async ({ data }) => {
    const system = `${SYSTEM_BASE}

Write a Sunday weekly study report for a Year 10 student aiming for a 97 ATAR (Class of 2028).
Structure exactly:
### 📈 [THE WEEK IN NUMBERS]
a compact markdown table of the supplied metrics
### 🎯 [WHAT WENT WELL]
2-3 bullets
### ⚠️ [WHAT SLIPPED]
2-3 bullets
### 🚀 [THREE MOVES FOR NEXT WEEK]
exactly 3 numbered, specific, time-boxed actions
Keep the whole report under 300 words.`;

    const text = await callAI([
      { role: "system", content: system },
      { role: "user", content: `Week: ${data.weekLabel}\n\nData:\n${data.summary}` },
    ]);
    return { text };
  });

/* ---------------------- Question bank answer marking --------------------- */

const MarkInput = z.object({
  question: z.string().min(1).max(4000),
  rubric: z.string().max(4000).default(""),
  marks: z.number().min(1).max(40),
  answer: z.string().min(1).max(8000),
  subject: z.string().max(120).optional(),
});

export const markAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MarkInput.parse(d))
  .handler(async ({ data }) => {
    const system = `${SYSTEM_BASE}

You are marking one HSC-style response. Reply with RAW JSON ONLY — no prose, no markdown fences.
Schema: {"awarded":number,"feedback":string}
"awarded" is the mark out of ${data.marks} (may be a whole number or .5).
"feedback" is markdown with exactly these sections, blank line between each:
## Marks awarded
one short line explaining the mark
## What earned marks
2-4 bullets
## What was missing
2-4 bullets
## Model answer
a concise band 6 response`;

    const user = `${data.subject ? `Subject: ${data.subject}\n` : ""}Question (${data.marks} marks):\n${data.question}\n\nMarking rubric:\n${data.rubric || "(none supplied — use NESA standards)"}\n\nStudent answer:\n${data.answer}`;

    const raw = await callAI([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    try {
      const parsed = JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
      const shape = z.object({
        awarded: z.number().min(0).max(data.marks).catch(0),
        feedback: z.string().min(1),
      });
      return shape.parse(parsed);
    } catch {
      return { awarded: 0, feedback: raw || "Atlas couldn't mark that — try again." };
    }
  });
