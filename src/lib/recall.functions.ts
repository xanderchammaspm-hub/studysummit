import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI, extractJson, strArray, GRADING_PHILOSOPHY } from "@/lib/recall.server";
import { z } from "zod";

/* --------------------------- PDF text extraction -------------------------- */

export const extractMaterialText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z.string().max(200).default("upload.pdf"),
        mime: z.string().max(120).default("application/pdf"),
        base64: z.string().min(10),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ text: string }> => {
    const text = await callAI(
      [
        {
          role: "system",
          content:
            "You transcribe study documents. Return the full readable text of the document as clean plain text with markdown headings and bullet points preserved. Use LaTeX ($...$) for mathematics. No commentary, no preamble.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe this study material in full." },
            {
              type: "file",
              file: {
                filename: data.filename,
                file_data: `data:${data.mime};base64,${data.base64}`,
              },
            },
          ],
        },
      ],
      0.1,
    );
    return { text: text.trim().slice(0, 60000) };
  });

/* ----------------------------- Question set ------------------------------- */

export type RecallQuestion = { n: number; question: string; concept: string; kind: string };

export const generateRecallSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().max(120).optional(),
        topic: z.string().max(120).optional(),
        source: z.string().min(20).max(60000),
        count: z.number().min(5).max(20).default(15),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ questions: RecallQuestion[] }> => {
    const raw = await callAI(
      [
        {
          role: "system",
          content: `You build active-recall tests from a student's own study material.
Reply with RAW JSON ONLY: {"questions":[{"question":string,"concept":string,"kind":"define"|"explain"|"why"|"how"|"compare"|"cause"|"apply"|"recall"}]}
Rules:
- Produce exactly ${data.count} questions grounded in the supplied material only.
- Vary the question types across the list; never convert sentences mechanically into questions.
- Test recall and understanding, not recognition. No multiple choice. No answers.
- "concept" is a 2-5 word label of the idea being tested.
- Keep each question under 25 words.`,
        },
        {
          role: "user",
          content: `${data.subject ? `Subject: ${data.subject}\n` : ""}${data.topic ? `Topic: ${data.topic}\n` : ""}STUDY MATERIAL:\n${data.source}`,
        },
      ],
      0.5,
    );
    const parsed = extractJson(raw) as { questions?: unknown };
    const list = Array.isArray(parsed.questions) ? parsed.questions : [];
    const questions = list
      .map((q, i) => {
        const o = (q ?? {}) as Record<string, unknown>;
        return {
          n: i + 1,
          question: String(o["question"] ?? "").trim(),
          concept: String(o["concept"] ?? "").trim(),
          kind: String(o["kind"] ?? "recall").trim(),
        };
      })
      .filter((q) => q.question.length > 0)
      .slice(0, data.count);
    if (!questions.length) throw new Error("Atlas couldn't build a test from that material.");
    return { questions };
  });

/* ---------------------------- Answer analysis ----------------------------- */

export type RecallVerdict = "correct" | "mostly" | "partial" | "incorrect";
export type RecallGrade = {
  verdict: RecallVerdict;
  score: number;
  gotRight: string[];
  couldAdd: string[];
  checkThis: string[];
  feedback: string;
};

export const gradeRecallAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string().min(1).max(2000),
        answer: z.string().max(8000),
        source: z.string().max(30000),
        subject: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<RecallGrade> => {
    if (!data.answer.trim()) {
      return {
        verdict: "incorrect",
        score: 0,
        gotRight: [],
        couldAdd: [],
        checkThis: [],
        feedback: "No answer given — have a go from memory next time, even a partial attempt helps.",
      };
    }
    const raw = await callAI(
      [
        {
          role: "system",
          content: `You mark one active-recall answer against the student's own study material. ${GRADING_PHILOSOPHY}
Reply with RAW JSON ONLY: {"verdict":"correct"|"mostly"|"partial"|"incorrect","score":0-100,"gotRight":[string],"couldAdd":[string],"checkThis":[string],"feedback":string}
Each array item is a short phrase (max 12 words), max 4 items. "feedback" is one or two sentences.`,
        },
        {
          role: "user",
          content: `${data.subject ? `Subject: ${data.subject}\n` : ""}SOURCE MATERIAL (ground truth):\n${data.source.slice(0, 20000)}\n\nQUESTION: ${data.question}\n\nSTUDENT ANSWER: ${data.answer}`,
        },
      ],
      0.2,
    );
    try {
      const o = extractJson(raw) as Record<string, unknown>;
      const verdictRaw = String(o["verdict"] ?? "partial");
      const verdict: RecallVerdict = (["correct", "mostly", "partial", "incorrect"] as const).includes(
        verdictRaw as RecallVerdict,
      )
        ? (verdictRaw as RecallVerdict)
        : "partial";
      const scoreNum = Number(o["score"]);
      return {
        verdict,
        score: Math.max(0, Math.min(100, Number.isFinite(scoreNum) ? Math.round(scoreNum) : 50)),
        gotRight: strArray(o["gotRight"], 4),
        couldAdd: strArray(o["couldAdd"], 4),
        checkThis: strArray(o["checkThis"], 3),
        feedback: String(o["feedback"] ?? "").slice(0, 600),
      };
    } catch {
      return {
        verdict: "partial",
        score: 50,
        gotRight: [],
        couldAdd: [],
        checkThis: [],
        feedback: raw.slice(0, 400) || "Atlas couldn't analyse that answer — try again.",
      };
    }
  });

/* ------------------------------ Set summary ------------------------------- */

export type RecallSummary = {
  strengths: string[];
  review: string[];
  missed: string[];
  summary: string;
};

export const summariseRecall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().max(120).optional(),
        topic: z.string().max(120).optional(),
        transcript: z.string().min(1).max(20000),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<RecallSummary> => {
    const raw = await callAI(
      [
        {
          role: "system",
          content: `You summarise a completed active-recall session for a student.
Reply with RAW JSON ONLY: {"strengths":[string],"review":[string],"missed":[string],"summary":string}
Arrays: 3-5 short concept phrases each. "summary" is 2-3 sentences of concrete revision advice.`,
        },
        {
          role: "user",
          content: `${data.subject ? `Subject: ${data.subject}\n` : ""}${data.topic ? `Topic: ${data.topic}\n` : ""}SESSION RESULTS:\n${data.transcript}`,
        },
      ],
      0.3,
    );
    try {
      const o = extractJson(raw) as Record<string, unknown>;
      return {
        strengths: strArray(o["strengths"], 6),
        review: strArray(o["review"], 6),
        missed: strArray(o["missed"], 6),
        summary: String(o["summary"] ?? "").slice(0, 900),
      };
    } catch {
      return { strengths: [], review: [], missed: [], summary: raw.slice(0, 600) };
    }
  });

/* -------------------------------- Blurt ----------------------------------- */

export type BlurtAnalysis = {
  coverage: number;
  remembered: string[];
  missing: string[];
  incorrect: string[];
  strongest: string[];
  revise: string[];
  summary: string;
};

export const analyseBlurt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().max(120).optional(),
        topic: z.string().max(120).optional(),
        source: z.string().min(20).max(40000),
        blurt: z.string().min(1).max(20000),
        previous: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<BlurtAnalysis> => {
    const raw = await callAI(
      [
        {
          role: "system",
          content: `You analyse a "brain dump" against the student's own study material. ${GRADING_PHILOSOPHY}
Reply with RAW JSON ONLY: {"coverage":0-100,"remembered":[string],"missing":[string],"incorrect":[string],"strongest":[string],"revise":[string],"summary":string}
- "coverage" = share of the important concepts in the source that the student genuinely recalled.
- "remembered"/"missing": up to 12 short concept phrases each.
- "incorrect": up to 5 short statements of the misconception, each with the correction in the same phrase.
- "strongest": up to 3 areas of particularly strong understanding.
- "revise": the 3-5 most important things to review, ordered by importance.
- "summary": 2-3 encouraging, specific sentences.`,
        },
        {
          role: "user",
          content: `${data.subject ? `Subject: ${data.subject}\n` : ""}${data.topic ? `Topic: ${data.topic}\n` : ""}SOURCE MATERIAL (ground truth):\n${data.source}\n\nSTUDENT BLURT:\n${data.blurt}${
            data.previous ? `\n\nPREVIOUS ATTEMPT CONCEPTS RECALLED:\n${data.previous}` : ""
          }`,
        },
      ],
      0.2,
    );
    try {
      const o = extractJson(raw) as Record<string, unknown>;
      const cov = Number(o["coverage"]);
      return {
        coverage: Math.max(0, Math.min(100, Number.isFinite(cov) ? Math.round(cov) : 0)),
        remembered: strArray(o["remembered"], 12),
        missing: strArray(o["missing"], 12),
        incorrect: strArray(o["incorrect"], 5),
        strongest: strArray(o["strongest"], 3),
        revise: strArray(o["revise"], 5),
        summary: String(o["summary"] ?? "").slice(0, 900),
      };
    } catch {
      throw new Error("Atlas couldn't analyse that blurt — try again.");
    }
  });
