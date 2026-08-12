# In-app PDF viewer, background parse queue, richer emoji picker

## 1. PDFs open inside the app, not a new tab

Right now "Open PDF" hands you off to a raw browser tab. Instead, opening a stored paper slides up a full-screen glass viewer:

- Frosted dark panel, purple/gold hairline border, soft outer glow, backdrop blur over the dimmed page.
- Header bar with the paper title, subject chip, page counter, zoom out/in, download, and close.
- The document renders in a centre column you scroll continuously through, page by page, with a subtle divider and shadow under each page.
- Smooth open/close (fade + slight scale), Escape to close, arrow keys and scroll for navigation, respects reduced-motion.
- Loading state is a shimmering page-shaped skeleton so it never flashes blank.

## 2. Background parse queue with progress

Dropping a paper no longer blocks the Exam Engine:

- Each import becomes a job in a queue: Queued → Uploading → Extracting questions → Preview ready.
- A floating glass "Imports" tray (bottom-right, collapsible) lists active jobs with a per-job progress bar, stage label and elapsed time; finished jobs show a "Review questions" button that opens the existing preview dialog.
- You can keep browsing tabs, sit another paper, or drop more files while one parses — multiple jobs run, throttled to two at a time so extraction stays fast and reliable.
- Failures stay in the tray with the reason and a Retry button instead of vanishing into a toast.
- Progress is stage-based (upload has real byte progress; extraction shows an animated indeterminate-but-smooth bar with an estimate) — honest, not fake.

## 3. Many more subject emojis

Expand the picker from the current short list to a large curated set, grouped into labelled rows with a search box:

- Subjects (maths, science, English, languages, business, tech, arts, PE)
- Objects and tools, nature and space, symbols and shapes, faces and hands, flags/misc
- Search filters by keyword; free-text paste still works; recently used row at the top.
- Picker grows to a scrollable glass popover matching the site theme.

## Technical notes

- Viewer: new `src/components/exam/PdfViewerDialog.tsx` using `react-pdf`/`pdfjs-dist` with a worker bundled through Vite; signed URL from the existing `exam-papers` bucket. `openPdf` in `ExamLibrary.tsx` sets viewer state instead of `window.open`. Fallback to an `<iframe>` of the signed URL if the worker fails to load.
- Queue: new `src/hooks/useImportQueue.ts` holding job state (id, file, stage, pct, error) with a concurrency of 2, plus `src/components/exam/ImportTray.tsx`. `handleInteractive`/`handleKeepAsPdf` become queue workers; upload progress from the storage upload, extraction stage wraps the existing `parsePaperFile` call. Preview dialog stays as-is, opened from the tray.
- Emoji: move `EMOJI_CHOICES` out of `SubjectCard.tsx` into `src/data/emojis.ts` as grouped categories with keywords; picker UI updated in place, recents stored locally.
