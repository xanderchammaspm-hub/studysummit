# Summit: the final polish pass

A full aesthetic and quality upgrade across the whole site, plus the one behaviour change you asked for (streaks), finishing with a real test run of every panel.

## 1. Streaks only count when you log study hours

Right now the daily streak is awarded on your first visit of the day — just opening Summit keeps it alive. Change it so the day only counts once study hours are actually logged, and the streak XP is granted at that moment. Existing streak numbers are kept; the rule change applies from now on.

## 2. Mountain climb, made beautiful

- Layered ridges with depth: a soft distance haze, a richer purple gradient in the rock, and a faint star wash behind the peaks.
- The yellow waypoint gets a warmer glow, a soft trail showing how far you've climbed, and a gentle drift as progress moves.
- Milestone markers along the ridge light up as you pass them, with the next milestone labelled.
- Calm, slow motion only — nothing flashing, fully still under reduced-motion.

## 3. Subjects: more customisation and a much nicer card

- More ways to make each subject yours: a wider colour palette with gradient options, a cover accent, an optional short subtitle (e.g. teacher or room), and pinning a subject to the top.
- Card redesign: the subject colour flows through the header, progress ring for traffic-light completion, cleaner term chips, roomier inputs, and softer glass edges.
- Drag-to-reorder subjects within a year.
- Consistent hover lift, focus rings and smooth open/close.

## 4. Boxes and panels everywhere

One shared, refined glass treatment applied across home, library, Atlas, Quick Recall, Exam Engine and English Formula: deeper contrast, thinner purple outlines, warmer yellow accents on active states, better spacing rhythm, and matching hover/press feedback on every button, chip and input.

## 5. Settings screen

Rebuilt as grouped cards — Account, Appearance, Study, Data — each with clear descriptions, nicer toggles, an export panel that shows what's included and a row count, and a clearly separated danger zone.

## 6. Atlas AI answers at their best

- Tighter persona: lead with the answer, exam-board accurate, clean tables, worked structure for marking feedback, no filler.
- Better use of your subject context so answers are specific to what you're studying.
- Smooth paced streaming everywhere it isn't already, with instant final render.

## 7. Speed — no lag

- Trim background work: fewer animated layers on low-power devices, animations paused when off-screen or on a hidden tab.
- Memoise the heavy home lists and virtualise long libraries so scrolling stays smooth.
- Keep blur costs down and avoid layout-thrashing transitions.

## 8. Full test run

Drive the live site end to end: home, each subject card action, calendar, Quick Recall (session + blurt + timer modal + history), Exam Engine (import, runner, marking, analytics, mistakes), English Formula (sections, drag, table editing, memorise vault), Atlas chats, achievements, statistics, settings export, sign-out/in. Anything broken gets fixed in this same pass, and I'll report what I checked.

## Technical notes

- Streak rule moves out of the visit effect in `src/hooks/useProfile.ts` into the study-log write path (`useSummitStats` log creation), with a once-per-day guard.
- Subject customisation extends `SubjectState` in `src/hooks/useSubjectStore.ts` (gradient, subtitle, pinned, order) with backward-compatible defaults; card work in `SubjectCard.tsx`, `SubjectColorPicker.tsx`, grid in `src/routes/index.tsx`.
- Shared surface tokens/utilities in `src/styles.css` (`glass-panel`, `lift-hover`, focus ring, accent states) so panels stay consistent.
- Perf: `content-visibility` on off-screen sections, `IntersectionObserver`-gated ambient animation, memoised list rows, reduced blur radii.
- Prompt work in `src/lib/atlasPrompt.ts`; streaming via `usePacedText` in remaining Atlas surfaces.
- Verification via Playwright against localhost with screenshots, plus build and typecheck.
