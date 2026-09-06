import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubjects, useAllSubjectStates, flattenSubject, type YearKey } from "./useSubjectStore";

export type Camp = {
  key: CampKey;
  name: string;
  emoji: string;
  pct: number;
  desc: string;
};

export type CampKey = "base" | "c1" | "c2" | "c3" | "c4" | "summit";

/** User-editable milestone dates (ISO yyyy-mm-dd). */
export type ExamDates = Record<CampKey, string>;

// Class of 2028 — Year 11 starts in 2027, HSC in October 2028.
export const DEFAULT_DATES: ExamDates = {
  base: "2027-01-28",
  c1: "2027-09-13",
  c2: "2027-10-09",
  c3: "2028-04-03",
  c4: "2028-08-01",
  summit: "2028-10-12",
};

export const CAMPS: Camp[] = [
  { key: "base", name: "Base Camp", emoji: "🏕", pct: 0, desc: "Year 11 begins — the climb starts here." },
  { key: "c1", name: "Camp 1", emoji: "⛰", pct: 20, desc: "Year 11 Prelims — first real altitude." },
  { key: "c2", name: "Camp 2", emoji: "🏔", pct: 40, desc: "Year 12 begins — the HSC year opens." },
  { key: "c3", name: "Camp 3", emoji: "🗻", pct: 60, desc: "Half Yearly exams — the air thins out." },
  { key: "c4", name: "Camp 4", emoji: "🧗", pct: 80, desc: "HSC Trials — the final ascent begins." },
  { key: "summit", name: "Summit", emoji: "👑", pct: 100, desc: "HSC — you reached the top." },
];

export const CAMP_LABEL: Record<CampKey, string> = {
  base: "Year 11 begins",
  c1: "Year 11 Prelims",
  c2: "Year 12 begins",
  c3: "Half Yearly",
  c4: "HSC Trials",
  summit: "HSC",
};

const DATES_KEY = "summit-exam-dates-v2";

export function useExamDates() {
  const [dates, setDates] = useState<ExamDates>(DEFAULT_DATES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DATES_KEY);
      if (raw) setDates({ ...DEFAULT_DATES, ...(JSON.parse(raw) as ExamDates) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((key: CampKey, value: string) => {
    setDates((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(DATES_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setDates(DEFAULT_DATES);
    try {
      localStorage.removeItem(DATES_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { dates, update, reset };
}

const YEARS: YearKey[] = ["Year 11", "Year 12"];

function ts(d: string) {
  const v = Date.parse(d);
  return Number.isNaN(v) ? 0 : v;
}

/** Percentage along the camp ladder for "now", interpolated between milestone dates. */
export function timelineProgress(dates: ExamDates, now = Date.now()) {
  const stops = CAMPS.map((c) => ({ pct: c.pct, at: ts(dates[c.key]) })).filter((s) => s.at > 0);
  if (stops.length < 2) return 0;
  stops.sort((a, b) => a.at - b.at);
  if (now <= stops[0].at) return 0;
  if (now >= stops[stops.length - 1].at) return 100;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (now >= a.at && now <= b.at) {
      const t = (now - a.at) / Math.max(1, b.at - a.at);
      return Math.round(a.pct + (b.pct - a.pct) * t);
    }
  }
  return 100;
}

export function daysUntil(date: string, now = Date.now()) {
  return Math.ceil((ts(date) - now) / 86_400_000);
}

export function useMountainProgress() {
  const subjects = useSubjects();
  const store = useAllSubjectStates();
  const { dates, update, reset } = useExamDates();
  const { user } = useAuth();
  const attempts = useQuery({
    queryKey: ["stat-attempts", user?.id ?? null],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("exam_attempts")
        .select("id, awarded_marks, total_marks, completed_at, subject")
        .not("completed_at", "is", null);
      return data ?? [];
    },
  });

  return useMemo(() => {
    let topics = 0;
    let green = 0;
    let papers = 0;
    let assessments = 0;
    let subjectCount = 0;
    let dots = 0;
    let dotsDone = 0;
    for (const y of YEARS) {
      for (const s of subjects[y]) {
        subjectCount++;
        const st = store[s.id];
        if (!st) continue;
        const flat = flattenSubject(st);
        papers += flat.papers.length;
        assessments += flat.assessments.length;
        for (const p of flat.syllabus) {
          dots++;
          if (p.done) dotsDone++;
        }
        for (const t of flat.topics) {
          topics++;
          if (t.status === "green") green++;
        }
      }
    }
    const greenRatio = topics === 0 ? 0 : green / topics;
    const dotRatio = dots === 0 ? 0 : dotsDone / dots;
    const completedAttempts = attempts.data ?? [];
    const papersDone = completedAttempts.length;
    const papersScore = Math.min(papersDone / 20, 1);
    const assessScore = Math.min(assessments / 10, 1);
    const mastery = Math.round(
      (greenRatio * 0.5 + dotRatio * 0.2 + papersScore * 0.15 + assessScore * 0.15) * 100,
    );

    const paperScores = completedAttempts
      .filter((attempt) => Number(attempt.total_marks) > 0)
      .map((attempt) => Number(attempt.awarded_marks) / Number(attempt.total_marks));
    const averagePaperScore = paperScores.length
      ? Math.round((paperScores.reduce((sum, score) => sum + score, 0) / paperScores.length) * 100)
      : 0;
    const latestPaperAt = completedAttempts
      .map((attempt) => attempt.completed_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

    // Dates remain the main ascent. Every completed interactive paper adds a visible half-step.
    const timeline = timelineProgress(dates);
    const paperClimb = Math.min(papersDone * 0.5, 10);
    const preciseProgress = Math.max(0, Math.min(100, timeline * 0.75 + mastery * 0.15 + paperClimb));
    const progress = Math.round(preciseProgress);

    const currentCamp = [...CAMPS].reverse().find((c) => progress >= c.pct) ?? CAMPS[0];
    const nextCamp = CAMPS.find((c) => c.pct > progress) ?? null;

    return {
      progress,
      timeline,
      mastery,
      currentCamp,
      nextCamp,
      topics,
      green,
      papers,
      papersDone,
      averagePaperScore,
      latestPaperAt,
      preciseProgress,
      assessments,
      subjectCount,
      dates,
      updateDate: update,
      resetDates: reset,
    };
  }, [subjects, store, dates, update, reset, attempts.data]);
}
