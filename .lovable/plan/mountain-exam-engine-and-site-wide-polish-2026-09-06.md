# Mountain, Exam Engine, and site-wide polish

## 1. Rebuild the mountain around Summi

- Replace the flag marker with Summi’s real existing pose artwork, using the idle pose while resting, the flight pose while moving between camps, and the joyful pose when a new camp or the summit is reached.
- Redraw the climb as a deeper layered night scene with distant ridges, mist, snow light, a glowing summit, a clearer illuminated route, and distinct camp markers.
- Animate progress smoothly along the route, pulse unlocked camps, and show a short camp-reached celebration without changing the existing date/mastery progression rules.
- Keep the scene clear on phones, pause decorative movement when reduced motion is enabled, and avoid extra generated limbs or altered character artwork.

## 2. Upgrade the Exam Engine runner

- Keep the existing three paper question types: multiple choice, short answer, and extended response; give each a clearer visual identity and purpose-built answer area.
- Add an optional whole-paper timer with pause/resume, elapsed/remaining visual feedback, low-time warning, and a polished time-up modal that can continue untimed or finish the paper.
- Add local autosave and a resume banner so an unfinished paper survives refresh without creating a duplicate attempt before the student chooses to resume or restart.
- Rebuild answer feedback into clear result bands: marks, what worked, missing ideas, improvements, and a rendered exemplar; pair grading and completion states with Summi’s thinking, encouraging, happy, and celebration poses.
- Upgrade loading, progress, question navigation, and final results to use the same polished rhythm as Quick Recall and Blurt.

## 3. Unify glass and motion across the requested areas

- Add shared glass surface, interactive lift, section-label, and motion timing tokens so panels feel related instead of using different blur, border, and animation values.
- Apply those shared treatments to the home summary/quick links/search areas, Exam Library cards and import panels, Atlas sheet/messages/composer, and Quick Recall library/folder/runner panels.
- Keep purple and near-black dominant with yellow reserved for milestones, marks, and important highlights.
- Reduce costly overlapping blur and cap decorative effects on smaller screens so the polish remains smooth.

## 4. Verification

- Run focused checks for Exam Engine state/timer behavior and the unchanged mountain progress calculations.
- Test the home, Exam Engine, Atlas, and Quick Recall flows in the browser at desktop and mobile widths, including timer expiry, answer feedback, resume-after-refresh, and reduced-motion behavior.
- Confirm the final preview rebuild succeeds with no build or runtime errors.

## Technical notes

- Primary files: `src/components/MountainProgress.tsx`, `src/components/exam/PaperRunner.tsx`, `src/components/exam/ExamLibrary.tsx`, `src/components/AICoach.tsx`, selected recall panel files, and `src/styles.css`.
- Reuse `RecallMascot`, `ScoreRing`, `LoadingStages`, `ResumeBanner`, and `GlassModal`; keep exam and mountain data models unchanged unless a small client-only timer preference is needed.
- Preserve all current progress formulas, paper parsing/marking behavior, user data, and supplied Summi artwork.
