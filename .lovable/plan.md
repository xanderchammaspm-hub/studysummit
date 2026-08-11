# Weekly report redesign, readable exam maths, subject-folder exam engine, richer sky

## 1. AI Weekly Report — cleaner and more aesthetic

- Hero header with the week range, gradient title and a soft sheen; keep refresh, hide and delete controls.
- Three simple charts, styled to the theme (purple/gold on glass):
  - Hours studied per day (bar chart across the 7 days)
  - Score / mastery trend (smooth line)
  - Active days (compact 7-dot ring or filled pips with a total)
- Stats as glossy tiles with icon, big numeral and a goal bar.
- "The week in numbers" as a real table (aligned columns, zebra rows), not raw markdown pipes.
- "What went well" / "What slipped" / "Three moves" as separate cards with coloured icon chips; no stray bullet artefacts.
- Shimmer skeleton in the same shape while loading; sections fade and stagger in.

## 2. Maths that actually reads properly

Parsed papers currently show raw `$g'(x)$` text. Two halves:

- Parser: tighten the extraction prompt so questions come back as clean markdown with proper LaTeX — inline maths in `$...$`, standalone equations in `$$...$$`, prime notation preserved, MCQ options on their own lines with their maths wrapped, and roman-numeral lists `(i) (ii) (iii)` kept intact.
- Renderer: render question prompts, options, criteria, exemplars and feedback through markdown + KaTeX so `$g'(x)$` displays as real notation everywhere in the Exam Engine (runner, mistake vault, analytics).

Speed and accuracy of extraction:
- Single pass with a leaner, more directive prompt and lower temperature; text-based PDFs send extracted text rather than the whole file where possible.
- Long papers split into chunks processed in parallel and merged, so a big paper is faster rather than one slow call.
- Progress toast shows real stages (reading → extracting → cleaning) instead of one long spinner.

## 3. Interactive exam confirmation step

After choosing "Interactive exam" in the import popup, a second glossy panel appears before anything is saved:
- Detected title, subject, year and question count.
- A scrollable preview of the parsed questions with rendered maths, marks badges and topic tags.
- "Looks good — build it" or "Cancel". Nothing is written to the library until confirmed.

## 4. Exam Engine organised by subject

- **My uploads**: papers grouped into subject folders (collapsible sections with a count and the subject's colour), instead of one flat grid.
- **Mistake Vault**: same subject grouping, each section showing its own mistake count and resolve progress.
- **Analytics**: an overall combined panel across all subjects at the top (total papers, marks, accuracy, weakest topics), then per-subject sections below.

## 5. Stronger sky, still behind everything

- More stars across the depth layers with a brighter twinkle.
- Shooting stars more often and more visible, still calm and occasional.
- Drifting gas dust: soft, slow particulate haze layered into the nebula for depth.
- All of it stays strictly behind cards and panels, non-interactive, and off under reduced-motion.

## 6. Traffic light stats micro-interactions

- Bars animate width on change and on first reveal; percentage counts up rather than snapping.
- Counts pulse briefly when a topic changes status.
- Hover lifts the block slightly with a subtle accent glow; focus rings unified with the rest of the app.

## 7. Subject colour persistence

Colours are saved locally and, when signed in, synced to your account so they survive refresh, revisits and other devices. Every subject edit path carries the colour through, so nothing can wipe it.

## Technical notes

- Add `katex`, `remark-math`, `rehype-katex`; shared `MathMarkdown` component used by exam question rendering and the weekly report.
- `src/lib/exam.functions.ts`: rewritten `PARSE_SYSTEM` with the LaTeX/markdown rules, chunked parallel extraction, return preview data before persistence.
- `src/components/exam/ExamLibrary.tsx`: parse → confirmation preview → insert; subject-folder grouping.
- `src/components/exam/MistakeVault.tsx` and `ExamAnalytics.tsx`: overall summary + per-subject sections.
- `src/components/WeeklyReport.tsx`: rebuilt layout using recharts for the three charts.
- `src/components/AmbientBackground.tsx` + ambient block in `src/styles.css`: more stars, dust layer, shooting-star tuning.
- `src/components/SubjectCard.tsx`: animated TrafficStats; `useSubjectStore.ts` / `cloudSync.ts` verified for colour round-trip.
