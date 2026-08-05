import { useMemo } from "react";
import { AlarmClock, CalendarClock, Flame, Target, TrendingDown } from "lucide-react";
import { useSubjects, useAllSubjectStates, flattenSubject, type YearKey } from "@/hooks/useSubjectStore";
import { usePrefs } from "@/hooks/usePrefs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const YEARS: YearKey[] = ["Year 11", "Year 12"];
const DAY = 86_400_000;

function daysFromToday(iso: string) {
  const t = new Date(iso);
  t.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / DAY);
}

export function DailyPlan() {
  const subjects = useSubjects();
  const store = useAllSubjectStates();
  const { prefs } = usePrefs();
  const { user } = useAuth();

  const exams = useQuery({
    queryKey: ["user-exams", user?.id ?? null],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_exams")
        .select("id, subject, exam_at, color")
        .order("exam_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { dueSoon, weakest, upcoming } = useMemo(() => {
    const dueSoon: { subject: string; title: string; days: number }[] = [];
    const weak: { subject: string; title: string; status: string }[] = [];
    for (const y of YEARS) {
      for (const [i, s] of subjects[y].entries()) {
        const label = s.name.trim() || `Subject ${i + 1}`;
        const flat = flattenSubject(store[s.id]);
        for (const a of flat.assessments) {
          if (!a.due) continue;
          const d = daysFromToday(a.due);
          if (d >= 0 && d <= 14) dueSoon.push({ subject: label, title: a.title, days: d });
        }
        for (const t of flat.topics) {
          if (t.status === "red" || t.status === "amber") {
            weak.push({ subject: label, title: t.title, status: t.status });
          }
        }
      }
    }
    dueSoon.sort((a, b) => a.days - b.days);
    weak.sort((a, b) => (a.status === "red" ? -1 : 1) - (b.status === "red" ? -1 : 1));
    const upcoming = (exams.data ?? [])
      .map((e) => ({ ...e, days: daysFromToday(e.exam_at as string) }))
      .filter((e) => e.days >= 0 && e.days <= 14)
      .slice(0, 3);
    return { dueSoon: dueSoon.slice(0, 3), weakest: weak.slice(0, 4), upcoming };
  }, [subjects, store, exams.data]);

  const focus =
    weakest[0]
      ? `Rebuild ${weakest[0].title} (${weakest[0].subject}) — write a one-page summary, then do 3 practice questions.`
      : dueSoon[0]
        ? `Start ${dueSoon[0].title} for ${dueSoon[0].subject} — break it into three ${prefs.dailyGoalHours <= 1 ? "30-minute" : "45-minute"} blocks.`
        : "Add topics to your traffic light system so Summit can pick your next task.";

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="relative overflow-hidden rounded-3xl purple-outline bg-card/50 p-6 backdrop-blur-2xl fade-in-up">
        <div className="absolute inset-x-0 top-0 h-px shimmer-line" />

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Today's plan
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-lg font-medium leading-snug">{focus}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-yellow" />
            Goal · {prefs.dailyGoalHours}h today · target ATAR {prefs.targetAtar}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <PlanCard icon={<AlarmClock className="h-3.5 w-3.5" />} title="Assessments due">
            {dueSoon.length === 0 ? (
              <Empty>Nothing due in the next 14 days.</Empty>
            ) : (
              dueSoon.map((d) => (
                <Row key={`${d.subject}-${d.title}`} label={d.title} sub={d.subject}>
                  {d.days === 0 ? "today" : `${d.days}d`}
                </Row>
              ))
            )}
          </PlanCard>

          <PlanCard icon={<CalendarClock className="h-3.5 w-3.5" />} title="Exams within 14 days">
            {upcoming.length === 0 ? (
              <Empty>No exams in the next fortnight.</Empty>
            ) : (
              upcoming.map((e) => (
                <Row key={e.id as string} label={e.subject as string} sub="Exam">
                  {e.days === 0 ? "today" : `${e.days}d`}
                </Row>
              ))
            )}
          </PlanCard>

          <PlanCard icon={<TrendingDown className="h-3.5 w-3.5" />} title="Weakest topics">
            {weakest.length === 0 ? (
              <Empty>No red or amber topics — nice work.</Empty>
            ) : (
              weakest.map((w) => (
                <Row key={`${w.subject}-${w.title}`} label={w.title} sub={w.subject}>
                  <span className={w.status === "red" ? "text-destructive" : "text-yellow"}>
                    {w.status}
                  </span>
                </Row>
              ))
            )}
          </PlanCard>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/50 p-4">
      <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm">{label}</div>
        <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <div className="shrink-0 text-xs tabular-nums text-muted-foreground">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-1 text-xs italic text-muted-foreground">{children}</p>;
}
