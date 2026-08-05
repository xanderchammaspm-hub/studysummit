import { useCallback, useEffect, useMemo, useState } from "react";
import { useSubjects, useAllSubjectStates, type YearKey } from "./useSubjectStore";

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
  c1: "2027-06-21",
  c2: "2027-09-13",
  c3: "2028-04-03",
  c4: "2028-08-01",
  summit: "2028-10-12",
};

export const CAMPS: Camp[] = [
  { key: "base", name: "Base Camp", emoji: "🏕", pct: 0, desc: "Year 11 begins — the climb starts here." },
  { key: "c1", name: "Camp 1", emoji: "⛰", pct: 20, desc: "Year 11 course — build the foundations." },
  { key: "c2", name: "Camp 2", emoji: "🏔", pct: 40, desc: "Preliminary exams — first real altitude." },
  { key: "c3", name: "Camp 3", emoji: "🗻", pct: 60, desc: "Half Yearly exams — the air thins out." },
  { key: "c4", name: "Camp 4", emoji: "🧗", pct: 80, desc: "HSC Trials — the final ascent begins." },
  { key: "summit", name: "Summit", emoji: "👑", pct: 100, desc: "HSC — you reached the top." },
];

export const CAMP_LABEL: Record<CampKey, string> = {
  base: "Year 11 begins",
  c1: "Year 11",
  c2: "Prelims",
  c3: "Half Yearly",
  c4: "HSC Trials",
  summit: "HSC",
};

const DATES_KEY = "summit-exam-dates-v1";

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

  return useMemo(() => {
    let topics = 0;
    let green = 0;
    let papers = 0;
    let assessments = 0;
    let subjectCount = 0;
    for (const y of YEARS) {
      for (const s of subjects[y]) {
        subjectCount++;
        const st = store[s.id];
        if (!st) continue;
        papers += st.papers?.length ?? 0;
        assessments += st.assessments?.length ?? 0;
        for (const t of st.topics ?? []) {
          topics++;
          if (t.status === "green") green++;
        }
      }
    }
    const greenRatio = topics === 0 ? 0 : green / topics;
    const papersScore = Math.min(papers / 20, 1);
    const assessScore = Math.min(assessments / 10, 1);
    const mastery = Math.round((greenRatio * 0.7 + papersScore * 0.15 + assessScore * 0.15) * 100);

    // The climb is driven by the exam calendar; mastery nudges you slightly ahead.
    const timeline = timelineProgress(dates);
    const progress = Math.max(0, Math.min(100, Math.round(timeline * 0.8 + mastery * 0.2)));

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
      assessments,
      subjectCount,
      dates,
      updateDate: update,
      resetDates: reset,
    };
  }, [subjects, store, dates, update, reset]);
}
