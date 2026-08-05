import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AccountShell, Panel } from "@/components/account/AccountShell";
import { ACHIEVEMENTS } from "@/lib/progression";
import { useAchievements, useProfile } from "@/hooks/useProfile";
import { useSummitStats } from "@/hooks/useSummitStats";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Summit" },
      { name: "description", content: "Unlock Summit achievements for study streaks, hours logged, syllabus mastery and practice exams." },
      { property: "og:title", content: "Achievements — Summit" },
      { property: "og:description", content: "Unlock Summit achievements for study streaks, hours logged, syllabus mastery and practice exams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { profile, progression } = useProfile();
  const stats = useSummitStats();
  const { unlocked, unlock } = useAchievements();

  const metrics: Record<string, number> = {
    streakDays: profile?.streak_days ?? 0,
    studyHours: stats.totalHours,
    greenTopics: stats.green,
    quizScores90: stats.quizScores90,
    allTopicsGreen: stats.allTopicsGreen ? 1 : 0,
    papersDone: stats.papersDone,
    level: progression.level,
  };

  const unlockedIds = new Set(unlocked.map((u) => u.achievement_id));

  useEffect(() => {
    for (const a of ACHIEVEMENTS) {
      if (!unlockedIds.has(a.id) && metrics[a.metric] >= a.goal) void unlock(a.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, profile, unlocked.length]);

  const earned = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).length;

  return (
    <AccountShell
      title="Achievements"
      subtitle={`${earned} of ${ACHIEVEMENTS.length} unlocked — every badge is a marker on the mountain.`}
    >
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const value = metrics[a.metric] ?? 0;
            const pct = Math.min(100, Math.round((value / a.goal) * 100));
            const done = unlockedIds.has(a.id) || pct >= 100;
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-4 transition-all duration-500 ${
                  done
                    ? "border-primary/60 bg-primary/10 purple-glow"
                    : "border-border/50 bg-surface/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl ${done ? "" : "grayscale opacity-50"}`}>{a.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{a.name}</span>
                      {done && <span className="text-[10px] uppercase tracking-widest text-yellow">Unlocked</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {Math.min(value, a.goal).toFixed(a.metric === "studyHours" ? 1 : 0)} / {a.goal}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </AccountShell>
  );
}
