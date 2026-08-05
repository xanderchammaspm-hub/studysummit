export type Rank = {
  name: string;
  emoji: string;
  minLevel: number;
};

export const RANKS: Rank[] = [
  { name: "Base Camp", emoji: "🏕", minLevel: 1 },
  { name: "Camp I", emoji: "⛰", minLevel: 5 },
  { name: "Camp II", emoji: "🏔", minLevel: 12 },
  { name: "Camp III", emoji: "🗻", minLevel: 22 },
  { name: "Ridge Walker", emoji: "🧭", minLevel: 35 },
  { name: "Summit Climber", emoji: "🧗", minLevel: 50 },
  { name: "Peak Conqueror", emoji: "👑", minLevel: 70 },
  { name: "Legend", emoji: "🌟", minLevel: 90 },
];

/** XP required to *reach* a level. Gentle quadratic curve. */
export function xpForLevel(level: number) {
  if (level <= 1) return 0;
  return Math.round(40 * Math.pow(level - 1, 1.6));
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (level < 120 && xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function progressionFromXp(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const into = xp - floor;
  const span = Math.max(1, ceil - floor);
  const rank = [...RANKS].reverse().find((r) => level >= r.minLevel) ?? RANKS[0];
  const nextRank = RANKS.find((r) => r.minLevel > level) ?? null;
  return {
    level,
    rank,
    nextRank,
    into,
    span,
    toNext: Math.max(0, ceil - xp),
    pct: Math.min(100, Math.round((into / span) * 100)),
  };
}

export const XP_RULES = {
  studyHour: 25,
  quiz: 40,
  syllabusPoint: 15,
  pastPaper: 80,
  examCompleted: 120,
  dailyStreak: 20,
} as const;

export type XpSource = keyof typeof XP_RULES;

export const XP_LABELS: Record<string, string> = {
  studyHour: "Study hour logged",
  quiz: "Quiz completed",
  syllabusPoint: "Syllabus dot point finished",
  pastPaper: "Past paper completed",
  examCompleted: "Exam completed",
  dailyStreak: "Daily streak",
};

export type AchievementDef = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  goal: number;
  metric:
    | "streakDays"
    | "studyHours"
    | "greenTopics"
    | "quizScores90"
    | "allTopicsGreen"
    | "papersDone"
    | "level";
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "streak-7", name: "Seven Day Ridge", desc: "Study 7 days in a row", emoji: "🔥", goal: 7, metric: "streakDays" },
  { id: "streak-30", name: "Month on the Mountain", desc: "Study 30 days in a row", emoji: "🗓", goal: 30, metric: "streakDays" },
  { id: "hours-10", name: "First Ascent", desc: "Log 10 study hours", emoji: "⏱", goal: 10, metric: "studyHours" },
  { id: "hours-100", name: "Century Climber", desc: "Log 100 study hours", emoji: "💯", goal: 100, metric: "studyHours" },
  { id: "module-done", name: "Module Cleared", desc: "Turn 12 topics green", emoji: "✅", goal: 12, metric: "greenTopics" },
  { id: "all-green", name: "Full Syllabus Sweep", desc: "Every topic you track is green", emoji: "🟢", goal: 1, metric: "allTopicsGreen" },
  { id: "quiz-90-20", name: "Sharp Shooter", desc: "Score 90%+ on 20 attempts", emoji: "🎯", goal: 20, metric: "quizScores90" },
  { id: "first-paper", name: "Paper Trail", desc: "Complete your first practice exam", emoji: "📄", goal: 1, metric: "papersDone" },
  { id: "papers-10", name: "Exam Machine", desc: "Complete 10 practice exams", emoji: "⚙️", goal: 10, metric: "papersDone" },
  { id: "level-25", name: "Ridge Walker", desc: "Reach level 25", emoji: "🧭", goal: 25, metric: "level" },
];
