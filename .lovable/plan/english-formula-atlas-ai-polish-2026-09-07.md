# English Formula + Atlas AI polish

A lot of this area is already in place: the hover-grid table picker, drag-to-reorder sidebar, question-bank answering and marking, and the shared `AtlasMarkdown` renderer. This plan finishes the remaining rough edges so writing and AI feedback feel as polished as the rest of Summit.

## 1. RichEditor table editing toolbar

After a table is inserted there's no way to change it. Add a small floating toolbar that appears when the cursor is inside a table:

- Insert row above / below
- Insert column left / right
- Delete current row / column
- Delete entire table
- Keyboard accessible (Esc closes the toolbar)

## 2. Roomier, resizable writing boxes

Every editable area in English Formula gets more breathing room:

- Taller default heights for the rich editor (260 → 340px), bone-label inputs, and section-name fields
- Larger text size and line height inside editors
- A drag handle at the bottom of each `RichEditor` so any box can be resized; height is remembered per section

## 3. Per-section Memorise By Heart

Currently only the dedicated "Memorise By Heart" section has a quote bank. Add a collapsible Memorise block above the notes area in *every* sidebar section, saved separately per workspace + section so quotes and scaffolds don't bleed between them.

## 4. Paced, table-aware Atlas streaming

`AICoach` and `AtlasSectionChat` currently dump whole network chunks into the message bubble. Switch both to `usePacedText`:

- Text reveals at a calm reading cadence with a soft caret
- Tables render as complete rows (never a half-parsed row flashing on screen)
- Final message flushes instantly once the stream ends
- Reduced-motion users see the final answer immediately

## 5. Prompt + export verification

- Tighten `ATLAS_SYSTEM_PROMPT` to explicitly refuse bracket headers and congested inline tables
- Verify the Settings export produces both JSON and CSV with subject/year/term rows by running a real export against populated data

## Technical notes

- Files: `src/components/RichEditor.tsx` (table toolbar, resize handle), `src/components/EnglishFormula.tsx` + `src/hooks/useEnglishFormula.ts` (per-section memorise storage), `src/components/AICoach.tsx` + `src/components/AtlasSectionChat.tsx` (paced streaming), `src/lib/atlasPrompt.ts`, `src/lib/exportStudyData.ts` + `src/routes/_authenticated/settings.tsx`.
- Per-section memorise keys use `summit-english-formula-v1:<modeId>-memorise-<sectionId>` alongside the existing store so account sync picks them up automatically.
- Table toolbar uses `document.execCommand`/`Selection` APIs scoped to the focused editor; no new dependencies.