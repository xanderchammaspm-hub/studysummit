import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

type Msg = { role: "system" | "user"; content: string | ContentBlock[] };

async function callAI(messages: Msg[], temperature = 0.4): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, messages, temperature }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limit reached — wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw;
  const start = body.search(/[[{]/);
  if (start === -1) throw new Error("AI returned no JSON");
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  return JSON.parse(body.slice(start, end + 1));
}

/* ---------------- Auto-grader ---------------- */

const GradeInput = z.object({
  prompt: z.string().min(1).max(6000),
  answer: z.string().min(1).max(12000),
  marks: z.number().min(1).max(30),
  criteria: z.string().max(4000).optional(),
  exemplar: z.string().max(6000).optional(),
  subject: z.string().max(120).optional(),
  topic: z.string().max(120).optional(),
});

export type GradeResult = {
  awarded: number;
  maxMarks: number;
  band: string;
  strengths: string[];
  missingKeywords: string[];
  improvements: string[];
  feedback: string;
  exemplar: string;
};

export const gradeAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GradeInput.parse(input))
  .handler(async ({ data }): Promise<GradeResult> => {
    const raw = await callAI([
      {
        role: "system",
        content:
          "You are a senior NSW HSC marker. Mark strictly against the official marking criteria. Reply with ONLY a JSON object, no prose, no code fences. Keys: awarded (number, may be a .5), band (string like 'Band 5'), strengths (array of short strings), missingKeywords (array of short syllabus keywords/concepts the response omitted), improvements (array of short actionable strings), feedback (2-4 sentence markdown paragraph), exemplar (a full model response worth full marks).",
      },
      {
        role: "user",
        content: [
          `SUBJECT: ${data.subject ?? "General"}`,
          `TOPIC: ${data.topic ?? "N/A"}`,
          `QUESTION (${data.marks} marks): ${data.prompt}`,
          `MARKING CRITERIA: ${data.criteria ?? "Standard HSC criteria for this question type."}`,
          data.exemplar ? `REFERENCE EXEMPLAR: ${data.exemplar}` : "",
          `STUDENT RESPONSE: ${data.answer}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ]);

    let parsed: Record<string, unknown> = {};
    try {
      parsed = extractJson(raw) as Record<string, unknown>;
    } catch {
      return {
        awarded: 0,
        maxMarks: data.marks,
        band: "Unmarked",
        strengths: [],
        missingKeywords: [],
        improvements: [],
        feedback: raw.slice(0, 1200) || "The marker could not produce feedback. Try again.",
        exemplar: data.exemplar ?? "",
      };
    }

    const toArr = (v: unknown) =>
      Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, 8) : [];
    const awardedNum = Number(parsed["awarded"]);

    return {
      awarded: Math.max(0, Math.min(data.marks, Number.isFinite(awardedNum) ? awardedNum : 0)),
      maxMarks: data.marks,
      band: String(parsed["band"] ?? ""),
      strengths: toArr(parsed["strengths"]),
      missingKeywords: toArr(parsed["missingKeywords"]),
      improvements: toArr(parsed["improvements"]),
      feedback: String(parsed["feedback"] ?? ""),
      exemplar: String(parsed["exemplar"] ?? data.exemplar ?? ""),
    };
  });

/* ---------------- PDF / notes → questions ---------------- */

const ParseInput = z.object({
  filename: z.string().max(200),
  mimeType: z.string().max(120),
  dataUrl: z.string().max(14_000_000).optional(),
  text: z.string().max(60_000).optional(),
  subjectHint: z.string().max(120).optional(),
});

export type ParsedQuestion = {
  qtype: "mcq" | "short" | "extended";
  prompt: string;
  options: string[];
  correctOption: number | null;
  marks: number;
  criteria: string;
  exemplar: string;
  topic: string;
};

export type ParsedPaper = {
  title: string;
  subject: string;
  year: number | null;
  questions: ParsedQuestion[];
};

const PARSE_SYSTEM =
  "You convert exam papers into structured interactive quizzes. Reply with ONLY a JSON object, no prose, no code fences. Shape: {\"title\": string, \"subject\": string, \"year\": number|null, \"questions\": [{\"qtype\": \"mcq\"|\"short\"|\"extended\", \"prompt\": string, \"options\": string[], \"correctOption\": number|null, \"marks\": number, \"criteria\": string, \"exemplar\": string, \"topic\": string}]}. Use qtype 'mcq' only when the paper gives choices (options array with the exact choices, correctOption = 0-based index of the correct one). Use 'extended' for responses worth 6+ marks. ALWAYS write a marking criteria breakdown and a full-mark exemplar answer for every non-mcq question, even if the paper does not provide one. Extract up to 25 questions.";

export const parsePaperFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ParseInput.parse(input))
  .handler(async ({ data }): Promise<ParsedPaper> => {
    const blocks: ContentBlock[] = [
      {
        type: "text",
        text: `Extract every question from this ${data.subjectHint ? data.subjectHint + " " : ""}exam paper "${data.filename}".`,
      },
    ];

    if (data.dataUrl) {
      if (data.mimeType.startsWith("image/")) {
        blocks.push({ type: "image_url", image_url: { url: data.dataUrl } });
      } else {
        blocks.push({
          type: "file",
          file: { filename: data.filename, file_data: data.dataUrl },
        });
      }
    } else if (data.text) {
      blocks.push({ type: "text", text: data.text.slice(0, 60_000) });
    } else {
      throw new Error("No file content supplied");
    }

    const raw = await callAI([
      { role: "system", content: PARSE_SYSTEM },
      { role: "user", content: blocks },
    ]);

    const parsed = extractJson(raw) as Record<string, unknown>;
    const rawQuestions = Array.isArray(parsed["questions"]) ? parsed["questions"] : [];

    const questions: ParsedQuestion[] = rawQuestions
      .slice(0, 25)
      .map((q) => {
        const item = q as Record<string, unknown>;
        const qtypeRaw = String(item["qtype"] ?? "short");
        const qtype: ParsedQuestion["qtype"] =
          qtypeRaw === "mcq" || qtypeRaw === "extended" ? qtypeRaw : "short";
        const options = Array.isArray(item["options"])
          ? (item["options"] as unknown[]).map((o) => String(o)).slice(0, 6)
          : [];
        const marksNum = Number(item["marks"]);
        const correct = Number(item["correctOption"]);
        return {
          qtype,
          prompt: String(item["prompt"] ?? "").slice(0, 4000),
          options,
          correctOption: qtype === "mcq" && Number.isFinite(correct) ? correct : null,
          marks: Number.isFinite(marksNum) && marksNum > 0 ? Math.min(30, Math.round(marksNum)) : 1,
          criteria: String(item["criteria"] ?? "").slice(0, 3000),
          exemplar: String(item["exemplar"] ?? "").slice(0, 5000),
          topic: String(item["topic"] ?? "General").slice(0, 120),
        };
      })
      .filter((q) => q.prompt.length > 0);

    if (questions.length === 0) throw new Error("No questions could be read from that file.");

    const yearNum = Number(parsed["year"]);
    return {
      title: String(parsed["title"] ?? data.filename).slice(0, 200),
      subject: String(parsed["subject"] ?? data.subjectHint ?? "General").slice(0, 120),
      year: Number.isFinite(yearNum) && yearNum > 1990 ? yearNum : null,
      questions,
    };
  });
