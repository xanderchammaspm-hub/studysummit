# English workspace upgrade + Atlas AI polish

## 1. Google-Docs style table insert

The table button currently drops a fixed 3x2 table with no choice. Replace it with a hover grid picker: a 8x8 cell grid where hovering highlights the size and shows "4 x 3", clicking inserts that table. Add a header-row toggle. Once a table exists, clicking inside it shows a small floating toolbar to add/remove a row or column and delete the table. Tables get proper glass styling, resizable columns and comfortable cell padding.

## 2. Roomier editable boxes everywhere

Every editable area in English Formula gets more breathing room: taller default heights, larger text, generous line height, and a drag handle at the bottom of each rich editor so any box can be resized and the size remembered. Same treatment for the plain inputs (section names, bone labels, structure board fields) — wider, taller, easier to type in.

## 3. Reorderable sidebar sections

Sidebar sections (Techniques, Flowing Phrases, Structure, Comparative, etc.) become drag-to-reorder, including the built-in ones. Order is saved per workspace so it survives refresh and syncs to the account. A small grip appears on hover; a keyboard alternative (move up / move down) is included for accessibility.

## 4. Memorise By Heart inside every section

Every sidebar section in every writing workspace gets its own collapsible "Memorise By Heart" block above the notes area — quotes, thesis lines and scaffolds, saved separately per workspace + section so nothing bleeds between them. The existing dedicated Memorise section stays as-is.

## 5. Atlas AI: readable, beautiful responses

The core problem: Atlas replies are rendered with a plain markdown renderer that does not understand tables, so a marking rubric collapses into one congested run-on line. Fixes:

- Render every Atlas surface (coach chat, section chat, weekly report, question feedback) through the table-aware renderer already used for exam papers.
- Style the output properly: real bordered tables with header shading and zebra rows, clear heading hierarchy, spaced sections, blockquote callouts, code-pill styling for cases and statutes, and comfortable line height.
- Rewrite the Atlas persona prompt: drop the shouty `🎯 [BRACKET]` headers in favour of clean headings, keep genuine markdown tables (never inline `<br>` inside cells, which is what breaks the layout), enforce blank lines between blocks, and cap section length so nothing is congested.
- Slow the typing: stream into a paced renderer so text appears at a natural reading cadence with a soft caret, instead of dumping whole chunks. Long tables render as complete blocks rather than mid-parse fragments.

## 6. Answering and marking in the generated question bank

Each generated question gets an answer box. Submitting sends the question, marks available and rubric to Atlas, which returns an awarded mark out of the total, what earned marks, what was missing, and a model answer — displayed in the same clean card format. Answers and marks persist so a session can be resumed, and a running score shows across the set.

## 7. Full export, verified

The Settings export currently bundles per-paper highlights and notes plus essay structure boards. Extend it so one export also carries every subject's content per year and term: papers, notes doc link, assessments with dates, traffic light topics with their colour, and syllabus dot points. The CSV gets subject and term columns so each row says which subject and term it came from. Verify by generating an export from real data in the running app and reading back the file.

## Technical notes

- Files: `src/components/RichEditor.tsx` (table picker, resize), `src/components/EnglishFormula.tsx` and `src/hooks/useEnglishFormula.ts` (section order, per-section memorise box), `src/lib/atlasPrompt.ts` (persona rewrite), `src/components/AICoach.tsx`, `src/components/AtlasSectionChat.tsx`, `src/components/WeeklyReport.tsx` (swap to `MathMarkdown`, paced streaming), `src/components/QuestionBank.tsx` + `src/lib/ai.functions.ts` (answer + marking server fn), `src/lib/exportStudyData.ts` and `src/routes/_authenticated/settings.tsx` (subject/term export), `src/styles.css` (table, prose and editor styling).
- Section order and per-section memorise content are stored alongside the existing English Formula store, which the account sync already mirrors, so nothing new is needed for cross-device saving.
- New marking server function follows the existing `createServerFn` + gateway pattern and returns a structured mark so the UI can show a score chip.
- Verification: run the app, generate questions and mark one answer, paste a rubric-heavy prompt into Atlas to confirm tables render, and download both export formats to check subject/term rows.
