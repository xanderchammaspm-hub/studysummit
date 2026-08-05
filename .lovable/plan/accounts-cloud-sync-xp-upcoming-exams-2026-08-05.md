# Accounts, Cloud Sync, XP & Upcoming Exams

## 1. Fix the climb for Class of 2028

You're Year 10, Term 3 2026. Keep Year 11 & 12 sections as they are, but rebase the mountain milestones:

| Camp | Milestone | Default date |
| --- | --- | --- |
| Base Camp | Now — Year 10 | Term 3, 2026 |
| Camp I | Year 11 course begins | Nov 2026 |
| Camp II | Prelims | Sep 2027 |
| Camp III | Half Yearly (Year 12) | Apr 2028 |
| Camp IV | HSC Trials | Aug 2028 |
| Summit | HSC | Oct 2028 |

All dates stay editable in the existing Exam Dates panel, and now save to your account.

## 2. Remove the Active Recall Scheduler

Delete the section from the landing page and remove the component.

## 3. Full account system + real-time autosave

- Sign up, log in, log out, and password reset (email link → a new reset password page). Google sign-in stays.
- Everything currently saved only in this browser — subjects, topics, papers, links, notes, study hours, English Formula, exam dates, gradient setting, Atlas chats — moves into your account and saves automatically as you type (debounced, with a small "Saved" indicator).
- On your first sign-in, existing browser data is uploaded once into your account, then the account becomes the source of truth. Sign in anywhere and your work follows you.
- Top-right avatar + username with a dropdown: Profile, Statistics, Settings, Achievements, Sign Out.
- Profile picture: drag or upload an image; stored in your account.

## 4. Progression system

XP is earned from logged study hours, completed quizzes, syllabus dot points turning green, finished past papers, and daily streaks. Levels 1–100+ with an animated progress bar in the header and on the profile page.

Ranks: Base Camp → Camp I → Camp II → Camp III → Ridge Walker → Summit Climber → Peak Conqueror → Legend.

Coins accrue alongside XP and can be spent in a small cosmetics shop (avatar frames, name gradients, mountain themes, banner styles) which apply to your profile and header.

## 5. Achievements

An Achievements page with locked/unlocked cards, progress bars and unlock toasts. Starter set:

- 7-day study streak, 30-day streak
- 10 / 100 / 500 logged study hours
- Finish an entire module (all topics green in a subject)
- Score 90%+ on 20 quizzes
- Complete every syllabus point in a year
- First practice exam, then 10 papers completed
- First AI marking, first English Formula mode completed

## 6. Upcoming Exams countdown

A new "Upcoming Exams" section on the landing page: add an exam with a subject name, date/time and a colour, shown as countdown cards with days/hours/minutes ticking live, sorted soonest-first, colour-tinted glass cards with a ring that fills as the date nears. Edit and delete supported; synced to your account.

## Technical notes

- Backend tables: `profiles` (add `username`, `avatar_url`, `xp`, `coins`, `level`, `streak`, `cosmetics`), `user_state` (JSON blobs keyed by store name for sync), `user_exams`, `user_achievements`, `xp_events`. RLS scoped to `auth.uid()` with grants for `authenticated`.
- A private `avatars` storage bucket with owner-scoped policies for profile pictures.
- A `useCloudStore` hook wraps the existing localStorage hooks: read-through cache, debounced writes to `user_state`, realtime channel so multiple tabs/devices stay in sync.
- XP is derived server-side from `xp_events` inserts so totals can't be edited from the browser; achievements evaluated on write.
- Auth pages: existing `/auth` gains "Forgot password"; new public `/reset-password` route.
- Header account menu added to the shared layout; Profile / Statistics / Settings / Achievements live under the authenticated route group.
