import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AccountShell, Panel } from "@/components/account/AccountShell";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  RARITY_STYLE,
  type AchievementCategory,
} from "@/lib/progression";
import { useAchievements, useProfile } from "@/hooks/useProfile";
import { useSummitStats } from "@/hooks/useSummitStats";
import { supabase } from "@/integrations/supabase/client";
import {
  AchievementCelebration,
  type CelebrationPayload,
} from "@/components/AchievementCelebration";

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

type Filter = "all" | "unlocked" | "locked";

function AchievementsPage() {
  const { profile, progression, user } = useProfile();
  const stats = useSummitStats();
  const { unlocked, unlock } = useAchievements();
  const [category, setCategory] = useState<AchievementCategory | "All">("All");
  const [filter, setFilter] = useState<Filter>("all");
  const rewarded = useRef<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);

  const metrics: Record<string, number> = useMemo(
    () => ({
      streakDays: profile?.streak_days ?? 0,
      studyHours: stats.totalHours,
      bestDayHours: stats.bestDayHours,
      bestWeekHours: stats.bestWeekHours,
      weekendStudy: stats.weekendStudy,
      activeWeeks: stats.activeWeeks,
      studyDays: stats.studyDays,
      greenTopics: stats.green,
      termsCleared: stats.termsCleared,
      subjectsCleared: stats.subjectsCleared,
      allTopicsGreen: stats.allTopicsGreen ? 1 : 0,
      noRedTopics: stats.noRedTopics,
      syllabusDone: stats.syllabusDone,
      quizScores90: stats.quizScores90,
      papersDone: stats.papersDone,
      avgScore: stats.avgScore,
      examsCompleted: stats.examsCompleted,
      papersAdded: stats.papersAdded,
      notesDocs: stats.notesDocs,
      quickLinks: stats.quickLinks,
      subjectsNamed: stats.subjectsNamed,
      level: progression.level,
    }),
    [profile, stats, progression.level],
  );

  const unlockedIds = useMemo(() => new Set(unlocked.map((u) => u.achievement_id)), [unlocked]);

  useEffect(() => {
    for (const a of ACHIEVEMENTS) {
      if (unlockedIds.has(a.id)) continue;
      if ((metrics[a.metric] ?? 0) < a.goal) continue;
      if (rewarded.current.has(a.id)) continue;
      rewarded.current.add(a.id);
      void (async () => {
        await unlock(a.id);
        if (user) {
          await supabase.from("xp_events").insert({
            user_id: user.id,
            kind: "achievement",
            amount: a.xpReward,
            meta: { achievement: a.id } as never,
          });
        }
        const style = RARITY_STYLE[a.rarity];
        setCelebration({
          id: a.id,
          emoji: a.emoji,
          name: a.name,
          desc: a.desc,
          xp: a.xpReward,
          ring: style.ring,
          text: style.text,
        });
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, unlockedIds]);

  const earned = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).length;
  const pctAll = Math.round((earned / ACHIEVEMENTS.length) * 100);
  const xpEarned = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).reduce((s, a) => s + a.xpReward, 0);

  const visible = ACHIEVEMENTS.filter((a) => {
    if (category !== "All" && a.category !== category) return false;
    const done = unlockedIds.has(a.id);
    if (filter === "unlocked") return done;
    if (filter === "locked") return !done;
    return true;
  }).sort((a, b) => {
    const av = Math.min(1, (metrics[a.metric] ?? 0) / a.goal);
    const bv = Math.min(1, (metrics[b.metric] ?? 0) / b.goal);
    return bv - av;
  });

  return (
    <>
    <AchievementCelebration item={celebration} onDone={() => setCelebration(null)} />
    <AccountShell
      title="Achievements"
      subtitle={`${earned} of ${ACHIEVEMENTS.length} unlocked — every badge is a marker on the mountain.`}
    >
      <Panel>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Unlocked" value={`${earned}/${ACHIEVEMENTS.length}`} />
          <Stat label="Completion" value={`${pctAll}%`} />
          <Stat label="Bonus XP earned" value={`${xpEarned}`} />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-all duration-1000"
            style={{ width: `${pctAll}%` }}
          />
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          {(["All", ...ACHIEVEMENT_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c as AchievementCategory | "All")}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                category === c
                  ? "border-primary/70 bg-primary/20 text-foreground"
                  : "border-border/60 bg-surface/40 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
          <span className="ml-auto flex gap-1 rounded-full border border-border/60 bg-surface/40 p-1">
            {(["all", "unlocked", "locked"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-0.5 text-[11px] capitalize transition-colors ${
                  filter === f ? "bg-primary/25 text-foreground" : "text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {visible.map((a) => {
            const value = metrics[a.metric] ?? 0;
            const pct = Math.min(100, Math.round((value / a.goal) * 100));
            const done = unlockedIds.has(a.id) || pct >= 100;
            const style = RARITY_STYLE[a.rarity];
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-4 transition-all duration-500 ${
                  done ? `${style.ring} bg-primary/10 ${style.glow}` : "border-border/50 bg-surface/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl ${done ? "" : "grayscale opacity-50"}`}>{a.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{a.name}</span>
                      <span className={`shrink-0 text-[10px] uppercase tracking-widest ${done ? style.text : "text-muted-foreground/60"}`}>
                        {done ? "Unlocked" : style.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {Math.min(value, a.goal).toFixed(a.metric === "studyHours" || a.metric.includes("Hours") ? 1 : 0)} / {a.goal}
                      </span>
                      <span>
                        +{a.xpReward} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing here yet — try another filter.</p>
          )}
        </div>
      </Panel>
    </AccountShell>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface/40 p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
