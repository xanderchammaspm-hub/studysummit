import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubjects, useAllSubjectStates, flattenSubject, type YearKey } from "@/hooks/useSubjectStore";

export type StudyLog = { id: string; date: string; hours: number; subjectId?: string; note?: string };

const LOGS_KEY = "summit-study-logs-v1";
const YEARS: YearKey[] = ["Year 11", "Year 12"];

function readLogs(): StudyLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? (JSON.parse(raw) as StudyLog[]) : [];
  } catch {
    return [];
  }
}

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  const t = setInterval(cb, 4000);
  return () => {
    window.removeEventListener("storage", cb);
    clearInterval(t);
  };
}

let cachedRaw = "";
let cachedLogs: StudyLog[] = [];

function snapshot(): StudyLog[] {
  if (typeof window === "undefined") return cachedLogs;
  const raw = localStorage.getItem(LOGS_KEY) ?? "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLogs = readLogs();
  }
  return cachedLogs;
}

export function useStudyLogs() {
  return useSyncExternalStore(subscribeStorage, snapshot, () => cachedLogs);
}

/** Every number the statistics + achievements screens need. */
export function useSummitStats() {
  const subjects = useSubjects();
  const store = useAllSubjectStates();
  const logs = useStudyLogs();
  const { user } = useAuth();

  const attempts = useQuery({
    queryKey: ["stat-attempts", user?.id ?? null],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("exam_attempts")
        .select("id, awarded_marks, total_marks, completed_at, subject");
      return data ?? [];
    },
  });

  return useMemo(() => {
    let topics = 0;
    let green = 0;
    let amber = 0;
    let red = 0;
    let papers = 0;
    let assessments = 0;
    let subjectCount = 0;
    const perSubject: { label: string; hours: number; green: number; topics: number }[] = [];

    const hoursBySubject = new Map<string, number>();
    for (const l of logs) hoursBySubject.set(l.subjectId ?? "", (hoursBySubject.get(l.subjectId ?? "") ?? 0) + l.hours);

    for (const y of YEARS) {
      subjects[y].forEach((slot, i) => {
        const label = slot.name.trim() || `Subject ${i + 1}`;
        const st = store[slot.id];
        if (!slot.name.trim() && !st) return;
        subjectCount++;
        let sGreen = 0;
        let sTopics = 0;
        const flat = flattenSubject(st);
        papers += flat.papers.length;
        assessments += flat.assessments.length;
        for (const t of flat.topics) {
          topics++;
          sTopics++;
          if (t.status === "green") {
            green++;
            sGreen++;
          } else if (t.status === "amber") amber++;
          else if (t.status === "red") red++;
        }
        perSubject.push({ label, hours: hoursBySubject.get(slot.id) ?? 0, green: sGreen, topics: sTopics });
      });
    }

    const totalHours = logs.reduce((s, l) => s + l.hours, 0);
    const days = new Set(logs.filter((l) => l.hours > 0).map((l) => l.date));
    const rows = attempts.data ?? [];
    const completed = rows.filter((r) => r.completed_at);
    const scores = completed.map((r) =>
      Number(r.total_marks) > 0 ? Number(r.awarded_marks) / Number(r.total_marks) : 0,
    );
    const avgScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : 0;

    // 12-week study trend
    const weeks: { label: string; hours: number }[] = [];
    for (let w = 11; w >= 0; w--) {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - w * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const hours = logs
        .filter((l) => {
          const d = new Date(l.date + "T00:00:00").getTime();
          return d >= start.getTime() && d <= end.getTime();
        })
        .reduce((s, l) => s + l.hours, 0);
      weeks.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, hours });
    }

    return {
      subjectCount,
      topics,
      green,
      amber,
      red,
      papers,
      assessments,
      totalHours,
      studyDays: days.size,
      perSubject: perSubject.sort((a, b) => b.hours - a.hours),
      weeks,
      papersDone: completed.length,
      quizScores90: scores.filter((s) => s >= 0.9).length,
      avgScore,
      allTopicsGreen: topics > 0 && green === topics,
    };
  }, [subjects, store, logs, attempts.data]);
}
