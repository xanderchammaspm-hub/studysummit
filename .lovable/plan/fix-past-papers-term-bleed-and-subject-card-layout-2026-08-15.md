# Fix past papers, term bleed, and subject card layout

## 1. Past papers unreadable (raw LaTeX)

The exam question view already runs prompts through the shared Markdown + LaTeX renderer, and the maths libraries are installed — so the raw `$\frac{3x+4}{3}$` text in your screenshot means the renderer is failing at runtime rather than being missing. The cause is unconfirmed, so step one is to reproduce it in the live app (browser console + a real paper) and confirm whether the maths renderer is erroring, before changing anything.

Then:
- Fix the renderer so inline `$...$` and display `$$...$$` maths render properly everywhere papers appear (question text, options, marking feedback, mistake vault, previews).
- Add a safe fallback: if a fragment fails to typeset, show clean readable text instead of raw dollar-sign source.
- Tighten the extraction prompt/cleanup so equations come back in consistent LaTeX and don't get double-escaped.

## 2. No PDF vs interactive choice

The choice dialog exists and fires for both drag-drop and "Choose file". Reproduce the upload flow to find why it was skipped (dialog not mounting, or an import going straight into the background queue), then guarantee the flow: every upload stops at the glossy "Interactive exam or keep as PDF?" step first, with no path that bypasses it.

## 3. Term content bleeding across Term 1–4

Each term is stored separately and the card reads the selected term, so the bleed is not yet explained by the storage shape alone. Plan:
- Reproduce by typing into Term 1 and switching terms, and inspect the saved data to see whether the write lands in one term or all four.
- Fix so a write only ever touches the selected term. Suspect areas to check while reproducing: the shared empty-term template (all four terms start from the same object/arrays), and the account sync path merging terms back together.
- Also reset the "add new item" input boxes when you switch terms, so half-typed text doesn't look like it followed you across.

## 4. Collapsible Traffic Light + Syllabus sections

- Make Traffic Light System and Syllabus Dot Points collapsible bars inside each subject, collapsed by default once they get long.
- The collapsed bar keeps a live summary (percentage and green/yellow/red counts for traffic lights; covered/total for dot points) so you can scan without expanding.
- Smooth height animation matching the existing card expand motion; each section's open/closed state is remembered per subject and term.

## 5. Assessment date sitting outside the box

Rebuild the assessment input row as a responsive grid that wraps instead of overflowing: title and link on the first line, date and Add button on the second at narrow widths, all fields allowed to shrink. Same treatment for any other row that can spill past the card edge.

## 6. Wider editable boxes

Increase the size of every editable field in the subject cards — paper title/link, assessment fields, notes doc link, topic and syllabus inputs — with more height, larger text, and full available width rather than cramped fixed widths, keeping the glass/purple styling.

## Technical notes

- Files: `src/components/MathMarkdown.tsx`, `src/components/exam/PaperRunner.tsx`, `src/components/exam/ExamLibrary.tsx`, `src/lib/exam.functions.ts`, `src/lib/mathClean.ts`, `src/hooks/useSubjectStore.ts`, `src/components/SubjectCard.tsx`, `src/lib/cloudSync.ts`.
- Verification: reproduce each of the three bugs in the running app before and after the fix (Playwright/browser check), including a real question with fractions and a term-switch write test.
