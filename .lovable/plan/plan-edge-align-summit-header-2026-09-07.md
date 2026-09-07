# Plan: Edge-align Summit header

## What we’ll change
On the home page (`src/routes/index.tsx`), the sticky header currently lives inside a centered `max-w-6xl` wrapper, making the logo + toolbar look awkwardly centered. We’ll restructure the header so content spans the full viewport width with clear edge alignment:

- **Logo block (far left):** `HSC Study` + `Summit` logo/text pinned flush-left inside the header.
- **Toolbar block (far right):** `Exam Engine`, `Quick Recall`, `Year 11 / Year 12` toggle, `Saved` indicator, and `AccountMenu` pinned flush-right.
- **Spacing:** use consistent horizontal padding (`px-4 sm:px-6 lg:px-8`) across the full-width header, and tighten internal gaps so the right group feels like one unit.
- **Responsiveness:** keep existing mobile behavior — hide text links on small screens where they already do (`hidden sm:flex`, etc.), and ensure nothing wraps awkwardly at intermediate widths. If needed, slightly reduce horizontal gaps on tablet-sized viewports.

## Technical notes
- Target file: `src/routes/index.tsx`, lines ~225–275.
- Replace the inner `max-w-6xl mx-auto` wrapper with a full-width flex container using `justify-between`.
- Preserve existing component imports, classes, and behavior (sticky header, backdrop blur, Year toggle state, `SaveIndicator`, `AccountMenu`).
- Only class/layout changes — no state or feature logic.
- After edit, verify visually on desktop and mobile via the preview that the logo is at the far left and the toolbar cluster is at the far right, with no awkward center gap.
