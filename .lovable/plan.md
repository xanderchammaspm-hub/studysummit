# Highlights and notes in the PDF viewer

The in-app glass PDF reader, the background import queue with progress, and the expanded emoji picker are already live. This plan covers the remaining ask: annotation tools inside the reader, saved per paper.

## What you get

A small toolbar in the viewer header with three modes:

- **Read** (default) — normal scrolling and text selection.
- **Highlight** — select text on a page and it gets a glowing translucent highlight. A colour row (purple, gold, green, red) lets you pick the shade; clicking an existing highlight offers Remove.
- **Note** — click anywhere on a page to drop a numbered pin. A glass mini-composer opens next to it for your text; saved notes show as pins you can hover to preview and click to reopen and edit or delete.

Also added:

- A **Notes & highlights** side panel (toggle in the header) listing every annotation for the paper, page-ordered. Clicking an entry scrolls that page into view.
- A count badge in the header so you can tell at a glance which papers you've annotated.
- Everything autosaves the moment you make it, per paper, and comes back when you reopen that paper — including on another device once you're signed in.

## Behaviour details

- Highlights are stored as page number plus normalised rectangles, so they land in the right place at any zoom level or window width.
- Note pins store normalised x/y for the same reason.
- Escape closes the note composer first, then the viewer.
- Reduced-motion is respected; no bouncy animation on pins.
- Empty state in the side panel: a short prompt explaining the two tools.

## Technical notes

- New `src/hooks/usePaperAnnotations.ts`: state keyed `summit-annotations:<paperId>` in localStorage. The `summit-` prefix is already picked up by `src/lib/cloudSync.ts`, so signed-in sync comes for free with no schema change.
- Types: `Highlight { id, page, rects: {x,y,w,h}[], colour, text }` and `Note { id, page, x, y, body, createdAt }` in `src/components/exam/types.ts`.
- `PdfViewerDialog.tsx` gains a `paperId` prop (passed from `ExamLibrary.tsx`, which already has the paper record), a `mode` state, an overlay layer absolutely positioned over each `<Page>` (page wrapper becomes `relative`), and selection capture via `window.getSelection()` mapped to the page element's bounding box.
- `renderTextLayer` stays on — it's what makes text selection and therefore highlighting possible. The iframe fallback path keeps working but hides the annotation tools (no text layer available there).
- No backend or migration work.
