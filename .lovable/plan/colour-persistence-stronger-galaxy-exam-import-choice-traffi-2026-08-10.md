# Colour persistence, stronger galaxy, exam import choice, traffic-light stats, prettier weekly report

## 1. Subject colours that stick

Subject colours are already written into the saved subject state, so the reset you're seeing is not yet explained — the first step is to reproduce it (set a colour, refresh, and inspect what's actually stored and what's read back) and fix the real cause rather than guess.

Then harden it either way:
- Colour is treated as first-class subject data: written on change, restored on load, and carried through every migration and term-level update so no other edit can wipe it.
- The saved colour also drives the card's gradient wash, border, sheen and progress tint on first paint, so the card looks identical before and after a refresh.
- Colours sync to your account like the rest of your data, so they follow you to another device.

## 2. Background: stronger galaxy, real stars, shooting stars, no maths

- Remove the scientific HUD entirely — no grids, graphs, DNA, molecules, equations or constellation lines.
- Nebula turned up: richer purple/magenta clouds with more presence and depth, still slow and soft, still strictly behind every card and panel (cards keep their own frosted glass with no galaxy bleeding onto them).
- A proper star field: many more stars across several depth layers, varied brightness and size, with a gentle twinkle so they're clearly visible.
- Occasional shooting stars — a thin glowing streak with a fading tail, crossing at random intervals and angles, a few per minute at most so it stays calm.
- All of it decorative, non-interactive, and disabled under reduced-motion.

## 3. Exam Engine: choose interactive exam or plain PDF

After a PDF is dropped or pasted into the Exam Engine, a glossy glass dialog appears:
- "Interactive exam" — the current behaviour: parse into questions and build the workspace.
- "Keep as PDF" — stores the paper as a viewable/downloadable file in your library, no parsing.

The dialog matches the site theme (frosted panel, purple/gold hairline, hover lift) and can be dismissed. Parsing only starts after you choose.

## 4. Traffic-light stats per subject

Each subject's traffic-light section gets a summary header:

```text
Mathematics Advanced
████████░░ 78%
🟢 42   🟡 11   🔴 6
```

- Percentage is mastery: green counts full, yellow counts half, red and untagged count zero.
- The bar is a segmented glossy meter tinted with green/yellow/red, animating when a topic changes.
- Counts shown as small pills with the matching status glow.

## 5. Weekly report rebuild

Replace the flat text dump with a designed report:
- Hero header with the week range, a gradient title and a subtle animated sheen.
- The four stats as glossy tiles with icons, big numerals and a tiny sparkline/goal bar rather than plain labels.
- "The week in numbers" rendered as a real styled table (aligned columns, zebra rows, target column) instead of raw markdown pipes.
- "What went well" / "What slipped" / "Three moves" as distinct card sections with coloured icon chips, tidy bullets and no stray "• •" artefacts.
- Sections fade and stagger in; the loading state is a shimmer skeleton in the same shape.
- Keep the existing refresh, delete and hide controls.

## 6. Motion polish pass

- Consistent easing and duration tokens across cards, tabs, accordions, dialogs and pickers.
- Hover lift, press feedback and focus rings unified; list add/remove animates instead of snapping.
- Status changes, progress bars and XP counters animate smoothly; everything respects reduced-motion.

## Technical notes

- Colour: verify against stored state first; fixes in `src/hooks/useSubjectStore.ts` (state shape/migrations) and `src/components/SubjectCard.tsx`.
- Background: `src/components/AmbientBackground.tsx` (drop HUD svg, add star layers + shooting stars) and the ambient block in `src/styles.css`.
- Exam import: choice dialog in `src/components/exam/ExamLibrary.tsx`, gating the existing `parsePaperFile` call; PDF-only entries stored as a library item type.
- Traffic-light stats: new summary block in `src/components/SubjectCard.tsx` computed from term topics.
- Weekly report: `src/components/WeeklyReport.tsx` markup and styled markdown renderer; report prompt tightened in `src/lib/ai.functions.ts` only if formatting artefacts persist.
