# Bigger subject cards, independent expand, visible nebula galaxy

## 1. Subject cards are too small

Currently the subject grid is three columns on desktop, and the card itself clips anything that overflows it. That combination is why the colour palette pops out half-hidden (as in your screenshot) and why the assessment/link rows are cramped.

- Widen the grid: one column on mobile, two on large screens (three only on very wide screens), with more generous padding inside the card.
- Stop the card from clipping its own pop-ups so the colour picker, emoji picker and any dropdown float above the card at full size.
- Anchor the colour picker so it opens inside the viewport instead of off the card edge, and give it a wider panel with clearer preset swatches.
- Give the link/assessment/paper input rows room to breathe: inputs stack sensibly at narrow widths instead of being squeezed onto one line.

## 2. Expanding one subject appears to expand them all

Each card already tracks its own open state — the issue is grid rows stretch to the tallest card, so its neighbours grow tall and empty when one opens.

- Align grid items to the top so an expanded card grows on its own and its neighbours keep their natural height.
- Smooth the open/close with a proper height/fade transition and a rotating chevron.

## 3. Nebula galaxy background not showing

The ambient nebula layer exists but sits behind two full-screen page gradients plus a vignette, so it is almost entirely washed out.

- Re-layer so the animated nebula paints above the flat page gradient and below all content.
- Retune it to read as a real purple galaxy: richer violet/magenta clouds, slow drift and breathing, soft star field, gentle motes — still calm, never distracting.
- Keep the scientific HUD under 5% opacity, and keep the galaxy strictly on the page background: cards and glossy panels keep their frosted glass and stay free of nebula texture.
- Fully off under reduced-motion.

## 4. Polish pass

- Consistent hover lift, focus rings and transitions across subject cards, term chips, quick links and inputs.
- Fix the two hydration warnings on the home page (subject count and the exam countdown differing between server and browser render) so the first paint is stable.

## Technical notes

- `src/routes/index.tsx`: grid columns + `items-start`.
- `src/components/SubjectCard.tsx`: remove `overflow-hidden`, widen padding, animated collapse, responsive input rows.
- `src/components/SubjectColorPicker.tsx`: wider panel, viewport-aware alignment.
- `src/styles.css`: `.ambient-root` z-index above `body::before/::after`, retuned `.nebula-*` gradients/animation, vignette softened.
- `src/components/AmbientBackground.tsx`: cloud/star/mote tuning.
- Hydration: render date/count-dependent values only after mount in `MountainProgress.tsx` and the home stats panel.
