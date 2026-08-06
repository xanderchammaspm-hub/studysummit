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

/**
 * Cosmetic reward tied to rank: the climber's name gradient, nameplate border
 * and surrounding glow all upgrade as levels are earned.
 */
export type RankStyle = {
  /** CSS gradient used for the name text. */
  nameGradient: string;
  /** Border colour of the nameplate. */
  border: string;
  /** Outer glow / shadow of the nameplate. */
  glow: string;
  /** Soft interior fill of the nameplate. */
  fill: string;
  /** Whether the nameplate gets a moving sheen (top ranks only). */
  animated: boolean;
};

const RANK_STYLES: Record<string, RankStyle> = {
  "Base Camp": {
    nameGradient: "linear-gradient(100deg, oklch(0.92 0.02 285), oklch(0.8 0.03 285))",
    border: "oklch(0.6 0.05 290 / 0.45)",
    glow: "0 10px 30px -22px oklch(0.6 0.08 290 / 0.7)",
    fill: "linear-gradient(140deg, oklch(0.26 0.03 290 / 0.6), oklch(0.2 0.02 288 / 0.5))",
    animated: false,
  },
  "Camp I": {
    nameGradient: "linear-gradient(100deg, oklch(0.93 0.05 250), oklch(0.78 0.12 245))",
    border: "oklch(0.7 0.13 245 / 0.6)",
    glow: "0 12px 34px -22px oklch(0.7 0.16 245 / 0.8)",
    fill: "linear-gradient(140deg, oklch(0.28 0.06 250 / 0.6), oklch(0.2 0.03 248 / 0.5))",
    animated: false,
  },
  "Camp II": {
    nameGradient: "linear-gradient(100deg, oklch(0.93 0.07 185), oklch(0.78 0.13 190))",
    border: "oklch(0.72 0.13 190 / 0.6)",
    glow: "0 12px 34px -20px oklch(0.72 0.16 190 / 0.8)",
    fill: "linear-gradient(140deg, oklch(0.27 0.06 195 / 0.6), oklch(0.2 0.03 195 / 0.5))",
    animated: false,
  },
  "Camp III": {
    nameGradient: "linear-gradient(100deg, oklch(0.94 0.08 150), oklch(0.76 0.16 150))",
    border: "oklch(0.72 0.16 152 / 0.62)",
    glow: "0 14px 36px -20px oklch(0.72 0.18 152 / 0.85)",
    fill: "linear-gradient(140deg, oklch(0.27 0.07 155 / 0.6), oklch(0.2 0.03 152 / 0.5))",
    animated: false,
  },
  "Ridge Walker": {
    nameGradient: "linear-gradient(100deg, oklch(0.95 0.06 300), oklch(0.76 0.21 300))",
    border: "oklch(0.72 0.2 300 / 0.65)",
    glow: "0 16px 40px -20px oklch(0.7 0.24 302 / 0.9)",
    fill: "linear-gradient(140deg, oklch(0.28 0.09 297 / 0.62), oklch(0.2 0.05 292 / 0.5))",
    animated: false,
  },
  "Summit Climber": {
    nameGradient:
      "linear-gradient(100deg, oklch(0.95 0.06 300) 0%, oklch(0.78 0.21 300) 50%, oklch(0.9 0.13 82) 100%)",
    border: "oklch(0.8 0.16 300 / 0.75)",
    glow: "0 18px 46px -20px oklch(0.75 0.24 303 / 0.95)",
    fill: "linear-gradient(140deg, oklch(0.3 0.1 298 / 0.65), oklch(0.21 0.05 292 / 0.5))",
    animated: true,
  },
  "Peak Conqueror": {
    nameGradient:
      "linear-gradient(100deg, oklch(0.96 0.06 92) 0%, oklch(0.88 0.14 82) 45%, oklch(0.82 0.18 55) 100%)",
    border: "oklch(0.86 0.13 84 / 0.8)",
    glow: "0 18px 48px -18px oklch(0.86 0.14 82 / 0.85)",
    fill: "linear-gradient(140deg, oklch(0.3 0.06 90 / 0.55), oklch(0.21 0.04 300 / 0.5))",
    animated: true,
  },
  Legend: {
    nameGradient:
      "linear-gradient(100deg, oklch(0.97 0.05 300) 0%, oklch(0.85 0.18 330) 30%, oklch(0.9 0.14 82) 60%, oklch(0.82 0.2 300) 100%)",
    border: "oklch(0.9 0.14 88 / 0.9)",
    glow: "0 20px 55px -16px oklch(0.8 0.22 320 / 0.95)",
    fill: "linear-gradient(140deg, oklch(0.32 0.1 310 / 0.6), oklch(0.22 0.05 292 / 0.5))",
    animated: true,
  },
};

export function rankStyle(rankName: string): RankStyle {
  return RANK_STYLES[rankName] ?? RANK_STYLES["Base Camp"];
}


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

export type AchievementCategory = "Consistency" | "Hours" | "Mastery" | "Exams" | "Habits";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export type AchievementMetric =
  | "streakDays"
  | "studyHours"
  | "bestDayHours"
  | "bestWeekHours"
  | "weekendStudy"
  | "activeWeeks"
  | "studyDays"
  | "greenTopics"
  | "termsCleared"
  | "subjectsCleared"
  | "allTopicsGreen"
  | "noRedTopics"
  | "syllabusDone"
  | "quizScores90"
  | "papersDone"
  | "avgScore"
  | "examsCompleted"
  | "papersAdded"
  | "notesDocs"
  | "quickLinks"
  | "subjectsNamed"
  | "level";

export type AchievementDef = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  goal: number;
  metric: AchievementMetric;
  category: AchievementCategory;
  rarity: Rarity;
  xpReward: number;
};

export const RARITY_STYLE: Record<Rarity, { label: string; ring: string; glow: string; text: string }> = {
  common: { label: "Common", ring: "border-border/60", glow: "", text: "text-muted-foreground" },
  rare: { label: "Rare", ring: "border-primary/50", glow: "shadow-[0_0_18px_-6px_hsl(var(--primary))]", text: "text-primary" },
  epic: { label: "Epic", ring: "border-primary/70", glow: "purple-glow", text: "text-primary" },
  legendary: { label: "Legendary", ring: "border-yellow/70", glow: "shadow-[0_0_28px_-6px_hsl(var(--yellow))]", text: "text-yellow" },
};

const A = (
  id: string,
  name: string,
  desc: string,
  emoji: string,
  goal: number,
  metric: AchievementMetric,
  category: AchievementCategory,
  rarity: Rarity,
): AchievementDef => {
  const rewards: Record<Rarity, number> = {
    common: 50,
    rare: 120,
    epic: 300,
    legendary: 750,
  };
  return { id, name, desc, emoji, goal, metric, category, rarity, xpReward: rewards[rarity] };
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // Consistency
  A("streak-3", "Getting Going", "Study 3 days in a row", "🌱", 3, "streakDays", "Consistency", "common"),
  A("streak-7", "Seven Day Ridge", "Study 7 days in a row", "🔥", 7, "streakDays", "Consistency", "common"),
  A("streak-14", "Fortnight Climber", "Study 14 days in a row", "🧗", 14, "streakDays", "Consistency", "rare"),
  A("streak-30", "Month on the Mountain", "Study 30 days in a row", "🗓", 30, "streakDays", "Consistency", "epic"),
  A("streak-60", "Unbroken", "Study 60 days in a row", "⛓", 60, "streakDays", "Consistency", "epic"),
  A("streak-100", "Century Streak", "Study 100 days in a row", "💎", 100, "streakDays", "Consistency", "legendary"),
  A("weekend-warrior", "Weekend Warrior", "Log study hours on a weekend", "🏕", 1, "weekendStudy", "Consistency", "common"),
  A("weeks-5", "Five Week Rhythm", "Log hours in 5 different weeks", "📈", 5, "activeWeeks", "Consistency", "rare"),
  A("days-50", "Fifty Sessions", "Study on 50 separate days", "📆", 50, "studyDays", "Consistency", "epic"),

  // Hours
  A("hours-1", "First Step", "Log your first study hour", "👣", 1, "studyHours", "Hours", "common"),
  A("hours-10", "First Ascent", "Log 10 study hours", "⏱", 10, "studyHours", "Hours", "common"),
  A("hours-50", "Half Century", "Log 50 study hours", "🕰", 50, "studyHours", "Hours", "rare"),
  A("hours-100", "Century Climber", "Log 100 study hours", "💯", 100, "studyHours", "Hours", "epic"),
  A("hours-250", "Deep Work", "Log 250 study hours", "🌌", 250, "studyHours", "Hours", "epic"),
  A("hours-500", "Thin Air", "Log 500 study hours", "🏔", 500, "studyHours", "Hours", "legendary"),
  A("day-4h", "Marathon Day", "Log 4 hours in a single day", "🚀", 4, "bestDayHours", "Hours", "rare"),
  A("week-20h", "Big Week", "Log 20 hours in one week", "📊", 20, "bestWeekHours", "Hours", "epic"),

  // Mastery
  A("green-5", "Green Shoots", "Turn 5 topics green", "🌿", 5, "greenTopics", "Mastery", "common"),
  A("green-25", "Solid Ground", "Turn 25 topics green", "🟩", 25, "greenTopics", "Mastery", "rare"),
  A("green-100", "Mastery Wall", "Turn 100 topics green", "🧱", 100, "greenTopics", "Mastery", "epic"),
  A("term-clear", "Term Cleared", "Every topic in a term is green", "✅", 1, "termsCleared", "Mastery", "rare"),
  A("subject-clear", "Subject Conquered", "Every topic in a subject is green", "🏅", 1, "subjectsCleared", "Mastery", "epic"),
  A("all-green", "Full Syllabus Sweep", "Every topic you track is green", "🟢", 1, "allTopicsGreen", "Mastery", "legendary"),
  A("no-red", "No Weak Links", "Clear every red topic", "🧹", 1, "noRedTopics", "Mastery", "rare"),
  A("syllabus-25", "Dot Point Grinder", "Tick off 25 syllabus dot points", "📌", 25, "syllabusDone", "Mastery", "rare"),
  A("syllabus-100", "Syllabus Machine", "Tick off 100 syllabus dot points", "🧠", 100, "syllabusDone", "Mastery", "epic"),

  // Exams & papers
  A("first-paper", "Paper Trail", "Complete your first practice exam", "📄", 1, "papersDone", "Exams", "common"),
  A("papers-5", "Warmed Up", "Complete 5 practice exams", "🗃", 5, "papersDone", "Exams", "rare"),
  A("papers-10", "Exam Machine", "Complete 10 practice exams", "⚙️", 10, "papersDone", "Exams", "epic"),
  A("papers-25", "Paper Veteran", "Complete 25 practice exams", "🏛", 25, "papersDone", "Exams", "legendary"),
  A("quiz-90-1", "Sharp Start", "Score 90%+ on an attempt", "🎯", 1, "quizScores90", "Exams", "common"),
  A("quiz-90-5", "Marksman", "Score 90%+ on 5 attempts", "🏹", 5, "quizScores90", "Exams", "rare"),
  A("quiz-90-20", "Sharp Shooter", "Score 90%+ on 20 attempts", "🥇", 20, "quizScores90", "Exams", "epic"),
  A("avg-80", "Band 6 Pace", "Hold an average above 80%", "📗", 80, "avgScore", "Exams", "epic"),
  A("exam-done-1", "Exam Survived", "Tick off your first upcoming exam", "🗡", 1, "examsCompleted", "Exams", "common"),
  A("exam-done-5", "Exam Season", "Tick off 5 upcoming exams", "🛡", 5, "examsCompleted", "Exams", "rare"),

  // Setup & habits
  A("subjects-6", "Timetable Set", "Name 6 subjects", "🧾", 6, "subjectsNamed", "Habits", "common"),
  A("notes-1", "Note Taker", "Add a notes doc to a subject", "📝", 1, "notesDocs", "Habits", "common"),
  A("notes-6", "Fully Documented", "Add notes docs to 6 terms", "📚", 6, "notesDocs", "Habits", "rare"),
  A("links-3", "Resource Hunter", "Fill in 3 quick link boxes", "🔗", 3, "quickLinks", "Habits", "common"),
  A("papers-added-20", "Archivist", "Add 20 past paper links", "🗄", 20, "papersAdded", "Habits", "rare"),
  A("level-5", "Camp I", "Reach level 5", "⛰", 5, "level", "Habits", "common"),
  A("level-10", "Ascending", "Reach level 10", "🧭", 10, "level", "Habits", "rare"),
  A("level-25", "Ridge Walker", "Reach level 25", "🗻", 25, "level", "Habits", "epic"),
  A("level-50", "Summit Climber", "Reach level 50", "👑", 50, "level", "Habits", "legendary"),
];

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  "Consistency",
  "Hours",
  "Mastery",
  "Exams",
  "Habits",
];

