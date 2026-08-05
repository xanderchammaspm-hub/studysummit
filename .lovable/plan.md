# Skeleton: dimmer, cleaner, no boxes

Three fixes to the English Formula skeleton so it reads as a soft purple hologram floating in the dark, with only the bones themselves lighting up on hover.

## 1. Remove the background

The skeleton image sits on a dark plate plus a HUD backdrop, which reads as a visible "panel" behind the figure.

- Delete the ambient HUD field entirely: the radial aura wash, grid pattern, concentric scan rings, rotating reticle, corner brackets and edge data ticks.
- Knock out the image's own dark pixels so it composites straight onto the page background instead of sitting on a black rectangle: render the hologram with `mix-blend-mode: screen` (dark pixels become invisible, glow survives) plus an alpha matrix that drops near-black.
- Keep only a very faint radial glow directly behind the figure so it still feels luminous, at roughly a third of the current strength.

## 2. Tone down brightness

- Drop the base hologram opacity and soften the drop-shadow glow radius/alpha.
- Reduce the scan sweep opacity so it is a hint rather than a bar, or remove it if it still reads as a band once the backdrop is gone.
- Lower overall saturation slightly so the purple is deep rather than neon-white.

## 3. Hover lights the bones only, never a box

- Remove the dashed region frame rectangles completely.
- Replace the hard rectangular `clipPath` with a soft-edged SVG `mask`: white rounded rects blurred with `feGaussianBlur`, so the lit area fades out at its edges with no visible boundary.
- Because the mask is applied to a copy of the same image, only pixels that are actually bone brighten — empty space inside the mask stays fully transparent.
- Unlit bones dim less aggressively (a gentle falloff instead of dropping to 0.42) so the figure never looks broken.
- Hit rectangles stay as-is: transparent, pointer-only, no visual output.

## Technical notes

All changes are contained in `src/components/SkeletonFigure.tsx`. `HIT_RECTS` / `GLOW_RECTS` geometry in that file and `src/assets/skeletonFrontal.ts` stay unchanged, so zoom targets and click zones keep their current calibration. `hudSpin` / `hudSpinRev` keyframes in `src/styles.css` become unused and can be left in place or trimmed.
