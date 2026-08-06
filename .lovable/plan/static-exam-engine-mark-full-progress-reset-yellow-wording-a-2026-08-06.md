# Static Exam Engine mark, full progress reset, "Yellow" wording, and a site-wide polish pass

## 1. Exam Engine logo stays still

The mark currently pulses the verdict badge and the summit flag. Make it fully static by default: drop the pulse animations and keep the glass, glow and gradients exactly as they are, so the logo reads as a solid brand mark everywhere it appears.

## 2. Reset progression to zero

Wipe the account back to a clean slate:

- Profile: XP 0, coins 0, level 1, streak 0, last-active cleared.
- Delete every stored XP event and every unlocked achievement, so the achievements page starts fully locked and nothing re-awards from history.
- Clear logged study sessions (calendar hours), which is what drives study days, hours, best-day/best-week and the streak badges — both the local copy and the synced cloud copy, via a one-time reset that runs on next load and then never again.
- The daily-streak routine will start counting from today at 1 the next time the site is opened, which is the intended fresh start.

## 3. "Amber" becomes "Yellow"

Every place the word is visible to you gets renamed:
- "No red or amber topics — nice work." on the Daily Plan.
- "Add one, then set red / amber / green." on subject cards.
- Any remaining tooltips/labels using the word.

The traffic-light colour is stored internally under the old name; that stays as-is so your existing red/yellow/green topic data is untouched, but nothing on screen will say "Amber" any more.

## 4. Maximum aesthetic pass

A cohesive polish sweep across the whole site, keeping the dark purple/yellow identity:

- **Depth and glass**: unify card treatment — layered translucency, softer 1px purple edges, a faint inner top highlight, and consistent corner radii across subject cards, dashboards, settings, exam engine and English Formula.
- **Background**: refine the aurora field so it drifts slowly and sits further back, with a subtle vignette so content pops.
- **Typography**: tighten the type scale — clearer heading/label/body hierarchy, better letter-spacing on headings, and muted small-caps section labels.
- **Motion**: gentle staggered entrance for cards and lists, spring-free easing curves, hover lift on interactive tiles, animated number/progress transitions, and a smoother traffic-light state change. All motion respects reduced-motion.
- **Hero and stats**: stronger visual anchor — bigger progression ring, refined metric tiles, and a cleaner topic-mix bar with animated segments.
- **Buttons, chips and inputs**: consistent focus rings, hover glows, pressed states, and better disabled styling.
- **Scrollbars, selection colour, empty states and toasts** restyled to match the theme.
- **Responsiveness**: audit mobile spacing on the dashboard, subject workspace, exam engine and English Formula.

## Technical notes

- `src/components/ExamEngineLogo.tsx`: remove pulse animation usage (keep the `animate` prop defaulting to off for compatibility).
- Reset: SQL migration updating `profiles` and deleting the user's `xp_events` and `user_achievements` rows; a small one-time client reset that clears the study-log key from `localStorage` and `user_state`.
- Wording: copy-only edits in `DailyPlan.tsx`, `SubjectCard.tsx`, and any other user-facing strings; the `"amber"` status value stays.
- Aesthetics: mostly `src/styles.css` tokens/utilities plus className-level refinements in the main route and component files. No data model, backend logic or English Formula behaviour changes.
