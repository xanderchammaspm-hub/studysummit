import { useMemo } from "react";
import { useSubjects, useAllSubjectStates, type YearKey } from "./useSubjectStore";

export type Camp = {
  key: string;
  name: string;
  emoji: string;
  pct: number;
  desc: string;
};

export const CAMPS: Camp[] = [
  { key: "base", name: "Base Camp", emoji: "🏕", pct: 0, desc: "Year 11 begins — the climb starts here." },
  { key: "c1", name: "Camp 1", emoji: "⛰", pct: 25, desc: "First quarter mastered. Keep the momentum going." },
  { key: "c2", name: "Camp 2", emoji: "🏔", pct: 50, desc: "Halfway to the summit. The air is getting thinner." },
  { key: "c3", name: "Camp 3", emoji: "🗻", pct: 75, desc: "Final ascent. HSC is in sight." },
  { key: "summit", name: "Summit", emoji: "👑", pct: 100, desc: "HSC completed. You reached the top." },
];

const YEARS: YearKey[] = ["Year 11", "Year 12"];

export function useMountainProgress() {
  const subjects = useSubjects();
  const store = useAllSubjectStates();
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
    // Mastery dominates; papers/assessments provide a small early boost so the
    // hiker moves even before topics are marked green.
    const progress = Math.round(
      (greenRatio * 0.7 + papersScore * 0.15 + assessScore * 0.15) * 100,
    );
    const currentCamp =
      [...CAMPS].reverse().find((c) => progress >= c.pct) ?? CAMPS[0];
    const nextCamp = CAMPS.find((c) => c.pct > progress) ?? null;
    return {
      progress,
      currentCamp,
      nextCamp,
      topics,
      green,
      papers,
      assessments,
      subjectCount,
    };
  }, [subjects, store]);
}
