# Short Answer as its own workspace + new icon

## 1. Rename and restructure modes
- "Analytical Essay" becomes simply **Essay** (tagline stays thesis-driven textual analysis).
- Remove the "Short Answers" tool from the Essay sidebar.
- Add a sixth workspace mode, **Short Answer**, sitting in the same top switcher row as Essay, Imaginative, Discursive, Persuasive, Reflection.

## 2. Short Answer workspace
Instead of the skeleton stage, this mode's main view shows the new Short Answer emblem plus the existing Atlas marking chat and a rich editor.

Its sidebar starts with:
- **Response Formulas** — 1–6 mark scaffolds, mark allocation, timing
- **Mark Allocation** — what each mark band expects
- **Exemplar Responses** — annotated model answers
- **Notes** — free-form rich text

Every one of these panels uses the same Google-Docs style editor (bold, underline, italic, lists, headings, tables) and autosaves, and you can still add / rename / delete your own extra sections in this mode exactly like the others.

## 3. The Short Answer icon
A new `ShortAnswerMark` SVG component, drawn to spec:
- Dark glass capsule background (#0D0B18) with deep indigo inner glow and a subtle rim highlight.
- Three horizontal glass text lines in translucent indigo/white.
- A high-tech magnifying lens / analytical reticle floating over them: neon purple (#A855F7) ring, glass fill, crosshair ticks, thin stem.
- Inside the lens the covered snippet of the middle line turns Electric Yellow (#FDE047), framed by a glowing purple bracket.
- Hover: the yellow highlight pulses gently, the lens glow lifts, cursor is a pointer.

Used at large size as the Short Answer stage centrepiece and small as the mode-tab icon.

## Technical notes
- `src/data/englishFormula.ts`: rename analytical → label "Essay", drop `short-answers` from its sections, append a `short-answer` mode with `parts: []` and its four default sections.
- `src/components/EnglishFormula.tsx`: render the skeleton stage only when the mode has parts; otherwise render the Short Answer stage. Sidebar/custom-section logic is reused unchanged.
- New `src/components/ShortAnswerMark.tsx` (pure SVG, gradients + filters defined inline, hover pulse via a keyframe added to `src/styles.css`).
- Existing notes stored under the old `analytical-doc-short-answers` key are read as a fallback so nothing you've written is lost.
