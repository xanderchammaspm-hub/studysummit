# Exam Engine logo + holographic skeleton rebuild

Three fixes: a new Exam Engine mark inspired by the uploaded "Past Paper Engine" logo (recoloured to purple/yellow), a skeleton that actually matches its hover zones and looks like the reference x-ray figure, and an Iron Man style HUD field behind it.

## 1. Exam Engine logo

Redraw `ExamEngineLogo` as a vector version of the reference: an outlined document with a folded corner, three list rows with bullet dots, a circled check badge, and a layered mountain range with a summit flag sweeping across the lower half.

- Document outline and mountain highlights: neon purple gradient (not the reference's white).
- Check badge, flag, and the ground arc: subtle electric yellow.
- Keep the glass fill, purple border glow, and the existing pulse animation on the summit flag and check mark.
- Same props and sizes, so every place it's already used keeps working.

## 2. Skeleton: shape, glow, and hover alignment

The current problem is that the hover/zoom regions are hand-authored coordinates that were never calibrated to the hologram image, so highlights land off the bones.

- Generate a new hologram asset matching the reference pose: full-body anterior x-ray skeleton, arms straight at the sides, glowing bone edges — rendered in the site's purple instead of the reference blue, on a transparent/dark field.
- Rebuild the zone map against the actual rendered image rather than the old guesses: measure where skull, spine/ribcage, lumbar+pelvis, limbs, and feet sit in the image, and rewrite `ZONE_BOXES` and the hit rectangles to those measured bands.
- Replace the per-bone neon overlay (the source of the mismatched shapes) with a region highlight: the active band of the hologram is brightened and glows while the rest dims, so the highlight can never disagree with the drawing.
- Keep the existing spring zoom, and keep hover/active behaviour and the pointer cursor.

## 3. HUD backdrop

Behind the figure, add an ambient sci-fi interface layer in purple/yellow:

- Concentric scan rings and a slow-rotating reticle centred on the figure.
- Faint grid, corner brackets, and small tick-marked arcs at the canvas edges.
- Thin connector lines from the active zone out to a floating label chip naming the essay part (Intro, Thesis, Sub-theses, Body, Conclusion).
- A slow vertical scan sweep across the figure.
- All decorative, `aria-hidden`, low opacity, and non-interactive so clicks still reach the body zones. Motion respects reduced-motion.

## Technical notes

- Files: `src/components/ExamEngineLogo.tsx`, `src/components/SkeletonFigure.tsx`, `src/assets/skeletonFrontal.ts` (zone boxes only), new hologram asset, plus keyframes in `src/styles.css`.
- Colours come from existing tokens (`--primary`, `--yellow`) — no hardcoded hex in components.
- No data, backend, or English Formula logic changes.
