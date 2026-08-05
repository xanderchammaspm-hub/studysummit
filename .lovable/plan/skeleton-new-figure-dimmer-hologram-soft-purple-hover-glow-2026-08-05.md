# Skeleton: new figure, dimmer hologram, soft purple hover glow

## 1. Replace the skeleton artwork

Generate a new hologram asset matching the uploaded reference pose: full-body anterior skeleton, arms straight at the sides, palms forward, feet together, clean anatomical proportions (detailed skull, ribcage, pelvis, hands and feet) — rendered as a soft purple hologram on a black field so it composites cleanly.

Because the pose matches the current asset's framing (head near the top, feet at the bottom, centred), the existing zone geometry stays valid; after swapping the image, the skull / spine / lumbar+pelvis / limbs / feet bands get re-checked against the rendered figure and nudged only if a band is visibly off.

## 2. Dimmer by default

- Lower the base hologram opacity another step so the figure reads as a faint presence in the dark, not a lit lamp.
- Reduce the drop-shadow glow radius and alpha, and pull saturation down slightly so the purple stays deep.
- Keep the very faint radial bloom behind the figure, but weaker.

## 3. Hover glow: subtle, noticeable, no hard edge

- Keep the feathered SVG mask approach (no rectangles, no dashed frames) but increase the blur radius so the lit region fades over a much longer distance — the transition between glowing and plain bone should be gradual, never a boundary.
- Make the highlight a purple glow rather than a general brightening: the masked copy is tinted toward the primary purple and given a soft outer bloom, so hovered bones look illuminated from within.
- Unlit bones stay at their normal (already dim) level instead of being pushed darker, so hovering adds light rather than removing it.
- Same spring zoom, same pointer cursor, same click-to-focus behaviour.

## Technical notes

- Files: `src/components/SkeletonFigure.tsx` (opacity, filters, mask feather, glow tint), new hologram asset in `src/assets/`, and `ZONE_BOXES` in `src/assets/skeletonFrontal.ts` only if calibration shifts.
- Colours come from existing tokens; no hardcoded hex in components.
- No backend, data, or English Formula logic changes.
