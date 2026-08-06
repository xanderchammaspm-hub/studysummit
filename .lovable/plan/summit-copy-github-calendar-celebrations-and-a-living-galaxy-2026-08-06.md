# Summit: copy, GitHub calendar, celebrations and a living galaxy UI

## 1. Copy changes

- Splash tagline under SUMMIT becomes **"Climb higher. Study smarter."** (replaces "Class of 2028").
- Home hero subtitle becomes **"Study smarter. Track progress. Reach the summit."** (replaces the "Every subject in one place…" sentence).

## 2. GitHub-style study heatmap

Placed directly under the Study Calendar, built from the study logs already saved in the browser.

- A full-year grid of day squares (weeks as columns, Mon–Sun rows) with month labels, like GitHub's contribution graph.
- Hovering a day shows a tooltip with the date, total hours, and a per-subject breakdown of what was studied.
- Intensity scales with hours logged that day; empty days stay dim.
- A colour-theme picker (Midnight Purple, Lime, Ember, Ice, Gold) saved locally, so the grid recolours instantly.
- Small legend ("Less → More") plus totals: days studied, current streak, best day.

## 3. Achievement celebration (no popup)

When a badge unlocks, the page celebrates in-place:

- A light burst radiating from the centre.
- The XP reward animates up and counts into your XP total.
- A minimal confetti sprinkle (short, few particles, respects reduced-motion).
- The new badge card slides in from the edge, holds briefly, then settles into the grid.

Toast popups for unlocks are removed in favour of this sequence.

## 4. Living background

- **Nebula galaxy:** a soft, slowly drifting animated nebula behind everything — layered purple/indigo clouds with a faint star field, replacing the current flat aurora.
- **Particles:** small glowing motes drifting slowly across the interface.
- **Scientific HUD:** faint background motifs under 5% opacity — coordinate grids, graph curves, a DNA helix, molecule rings, physics equations, constellation networks — placed per section so they feel intentional rather than wallpaper.
- All three are GPU-light, pause off-screen, and disable under reduced-motion.

## 5. Glassmorphism pass

Every card across the site (subjects, panels, exam engine, stats, achievements, calendar) moves to one shared glass treatment: frosted blur, thin luminous edge, inner highlight, and a smooth lift-and-glow on hover.

## 6. Atlas AI question generator

The "Generate HSC-style questions" tool becomes a proper panel:

- Generates **28 questions** per run.
- **Difficulty filter:** Easy / Medium / Hard / HSC — filter what's shown, and tell Atlas which band to weight generation toward.
- Questions render as numbered glass cards with marks and a reveal-able marking rubric.

## 7. AI Weekly Report

Every Sunday, Atlas writes a report on your week — hours by subject, topics turned green, papers attempted, average score, streak, and three specific actions for the week ahead. It appears as a card on the home page when a new one is ready and is kept in your report history. Assumption: in-app only (no email) unless you want it emailed too.

## Technical notes

- Copy: `src/components/SummitSplash.tsx`, `src/routes/index.tsx`.
- Heatmap: new `src/components/StudyHeatmap.tsx` reading the existing `StudyLog` store from `StudyCalendar.tsx` (logs lifted into a shared `useStudyLogs` hook); theme preference in `usePrefs.ts`.
- Celebration: new `src/components/AchievementCelebration.tsx` (canvas-free, CSS/`framer-motion`), wired into `src/routes/_authenticated/achievements.tsx` in place of `toast.success`.
- Background: new `src/components/AmbientBackground.tsx` (nebula + particles + HUD layers) mounted once in `src/routes/__root.tsx`; keyframes/utilities in `src/styles.css`, `aurora` replaced.
- Glass: consolidate into the existing `glass-panel` / `lift-hover` utilities and apply across card components.
- Questions: extend `src/components/AICoach.tsx` with a question-bank tab calling the existing AI gateway function with a difficulty-aware prompt; results parsed into structured cards.
- Weekly report: new server function in `src/lib/ai.functions.ts` summarising data from `useSummitStats`, cached per ISO week in the `user_state` table (no schema change).
