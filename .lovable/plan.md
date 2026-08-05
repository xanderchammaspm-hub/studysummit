# Fix exam removal, upgrade Settings, and ATAR-boosting additions

## 1. Why you can't remove an exam

On each exam card, the "Completed" and delete buttons live in a row styled `opacity-0 ... group-hover:opacity-100`. On a phone (your current 393px touch view) there is no hover, so the buttons stay invisible and effectively untappable. The delete call itself is fine.

Fix:
- Always show the action row on touch/small screens; keep the hover-reveal only on pointer devices.
- Add an explicit delete affordance on the card (small X in the corner) with a confirm step so it can't be hit by accident.
- Show a toast on delete with an Undo option, and surface any backend error instead of failing silently.
- Same treatment for the "Completed +120 XP" button.

## 2. Settings upgrades

Current Settings only has aurora intensity, reduce motion, password reset and clear-device. Add:

- **Profile**: display name, username, avatar upload (uses the existing avatars storage bucket).
- **Study preferences**: daily study-hour goal, target ATAR, school term/year (Year 10 now, Class of 2028) — feeds the home stats and streaks.
- **Exam dates**: edit Prelims / Half Yearly / Trials / HSC in one place (mirrors the mountain editor).
- **Notifications**: exam countdown reminder thresholds (7 / 3 / 1 day) shown as in-app banners.
- **Data**: export all study data as JSON, import back, and a proper "Delete account data" with confirmation.
- **Appearance**: accent colour choice (purple default, plus yellow-lean and cool-violet), compact vs spacious density.

## 3. What I think is missing for a high ATAR

Ranked by impact:

1. **Spaced repetition flashcards** — Atlas already generates flashcards; give them a review queue with due dates so you actually revisit them. (You removed the old scheduler; this is a leaner, card-only version.)
2. **Weakness radar** — one dashboard panel that combines red/amber traffic lights, exam-engine mistakes and quiz misses into a ranked "study this next" list.
3. **Study timer with Pomodoro** — logs hours straight into the calendar and awards XP, so hour tracking is automatic instead of manual.
4. **Assessment weightings + mark tracker** — enter each task's weight and your mark; the app shows your running subject rank estimate and what you need on remaining tasks.
5. **Syllabus dot-point checklists** — per subject/term, tick off NESA dot points; drives mastery %, mountain progress and XP.
6. **Daily plan** — a small "today" card: due assessments, exams within 14 days, weakest topics, and one Atlas-suggested task.

I'd build these in that order. Tell me which of the six you want in the first build (default: 1, 2 and 3 alongside the fixes above).

## Technical notes

- `src/components/UpcomingExams.tsx`: replace hover-gated action row with a `[@media(hover:hover)]` variant, add confirm + toast/undo, and error handling around the Supabase delete/insert.
- `src/routes/_authenticated/settings.tsx`: expand into sections; profile fields write to `profiles`, preferences to `user_state`, exam dates to the existing mountain-progress key.
- Avatar upload uses the existing private `avatars` bucket with a signed URL for display.
- New features that need storage (flashcard review state, marks, syllabus checklists) go in `user_state` or new tables with RLS scoped to `auth.uid()`; migrations only when we build them.
