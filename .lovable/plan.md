# Finish the subject card fixes

Maths rendering in past papers is already fixed. Remaining work:

## 1. Term content bleeding across Term 1–4

Each term is stored separately in the subject store, so the bleed isn't explained by the storage shape alone. Plan:
- Reproduce by typing into Term 1 and switching terms, and inspect the saved data to see whether the write lands in one term or all four.
- Fix so a write only ever touches the selected term. Suspects to check while reproducing: the shared empty-term template (all four terms start from the same object/arrays) and the account sync merge path.
- Reset the "add new item" input boxes (paper title/link, topic, assessment fields, dot point) when the term changes, so half-typed text doesn't look like it followed you across.

## 2. Collapsible Traffic Light + Syllabus sections

- Make Traffic Light System and Syllabus Dot Points collapsible bars inside each subject, collapsed by default once they get long.
- The collapsed bar keeps a live summary: percentage plus green/yellow/red counts for traffic lights, covered/total for dot points.
- Smooth height animation matching the existing card expand motion; open/closed state remembered per subject and term.

## 3. Assessment date sitting outside the box

Rebuild the assessment input row as a responsive grid that wraps instead of overflowing: title and link on the first line, date and Add button on the second at narrow widths, every field allowed to shrink. Same treatment for any other row that can spill past the card edge.

## 4. Wider editable boxes

Increase the size of every editable field in the subject cards — paper title/link, assessment fields, notes doc link, topic and syllabus inputs — with more height, larger text and full available width instead of cramped fixed widths, keeping the glass/purple styling.

## Technical notes

- Files: `src/hooks/useSubjectStore.ts`, `src/components/SubjectCard.tsx`, `src/lib/cloudSync.ts`.
- Verification: reproduce the term-switch write test in the running app before and after the fix, and check the card layout at narrow widths.
