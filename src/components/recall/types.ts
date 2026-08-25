import type { BlurtAnalysis, RecallGrade, RecallQuestion, RecallSummary } from "@/lib/recall.functions";

export type RecallSubject = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string | null;
  created_at: string;
};

export type RecallFolder = {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  created_at: string;
};

export type RecallMaterial = {
  id: string;
  user_id: string;
  folder_id: string;
  name: string;
  kind: string; // "pdf" | "text"
  content: string;
  created_at: string;
};

export type QuickRecallPayload = {
  kind: "quick_recall";
  materials: string[];
  questions: RecallQuestion[];
  grades: RecallGrade[];
  summary: RecallSummary | null;
};

export type BlurtPayload = {
  kind: "blurt";
  materials: string[];
  blurt: string;
  analysis: BlurtAnalysis;
};

export type RecallSession = {
  id: string;
  user_id: string;
  subject_id: string | null;
  folder_id: string | null;
  mode: string; // "quick_recall" | "blurt"
  score: number;
  payload: QuickRecallPayload | BlurtPayload;
  created_at: string;
};
