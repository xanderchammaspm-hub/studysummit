# Weekly report, nebula polish, published-layout fix, subject colours

## 1. Weekly Report — removable + glossy

- Add a dismiss (X) control on the report card. Dismissing clears the cached report and hides the section; a small "Bring back weekly report" link appears in the same spot so it can be restored. Preference stored locally.
- Also add "Delete this report" so a generated report can be cleared without hiding the feature.
- Visual rebuild: frosted glass panel with a thin purple-to-gold gradient hairline border, soft inner highlight, gradient heading, stat pills for hours / days studied / avg score, gentle hover lift, and a shimmer skeleton while generating. Markdown output styled to the site's type scale.

## 2. Nebula galaxy background on the main page

- Keep the existing ambient layer but retune it so it reads as a slow, soft galaxy rather than a busy field: fewer, larger nebula clouds, deeper blur, lower opacity, slower drift, and a subtle parallax so it feels alive without pulling attention.
- Motes reduced in count and dimmed; star twinkle slowed.
- Scientific HUD (grids, graphs, DNA, molecules, equations, constellations) stays under 5% opacity and gets spread more evenly so it never clusters behind text.
- Fully disabled under reduced-motion.

## 3. Glassmorphism pass on cards

- Route every card-like surface (subject cards, stat tiles, calendar, heatmap, exams, daily plan, quick links, English Formula panels, report) through the shared glass treatment: frosted background, soft blur, thin glow border, smooth hover lift.

## 4. Published-site layout problems

Symptoms reported after the first publish: white gaps/lines at borders, the Summit logo sitting centre-left instead of top-left, the top-right controls centred, and distorted proportions. That pattern is what a page looks like when the stylesheet hasn't fully applied on the deployed build, so the fix starts with verification rather than guesswork:

- Build the site the way publishing does and load the built output locally to reproduce the broken layout.
- Confirm the stylesheet is emitted and linked in the built HTML, and that the ambient background layer isn't painting over or behind the page edges (white seams usually mean the background element isn't covering the full viewport).
- Fix whatever the built output actually shows: stylesheet wiring, full-bleed background coverage, and header alignment so the logo pins top-left and account controls pin top-right at every width.
- Re-check the built output after the fix, at desktop and mobile widths, before calling it done.

## 5. Customisable subject colours

- Each subject gets its own accent colour with a rich picker: a curated palette of ~20 glossy presets (purple, violet, magenta, rose, ember, gold, lime, teal, ice, indigo, etc.), plus a free hue/saturation/lightness picker and hex entry for anything not in the palette.
- The chosen colour drives a glossy gradient treatment on that subject's card — gradient header wash, tinted border and glow, tinted icon chip and progress bar — while text contrast stays readable on the dark theme.
- Colour saved per subject alongside the existing subject data and synced like the rest of the state.

## Technical notes

- Weekly report: dismiss/restore state in a new local pref key; card markup rebuilt in `src/components/WeeklyReport.tsx`.
- Background: tuning in `src/components/AmbientBackground.tsx` and the ambient block in `src/styles.css`.
- Subject colour: new optional `color` field on subject state in `src/hooks/useSubjectStore.ts` (with migration defaulting to the current purple), applied via CSS custom properties on the card in `src/components/SubjectCard.tsx`; new colour-picker component.
- Publish layout: reproduce with a production build served locally, inspect built HTML/CSS, then fix header positioning in `src/routes/index.tsx` and full-viewport coverage of the ambient/body layers.
