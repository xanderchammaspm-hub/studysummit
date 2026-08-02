# English Formula: Anatomical Skeleton + New Sections

## 1. Realistic skeleton vector
Replace the current stick-figure SVG in `src/components/EnglishFormula.tsx` with a detailed anatomical outline drawn as layered paths:
- Skull: cranium, brow ridge, orbits, nasal aperture, maxilla/mandible with teeth line.
- Spine: cervical + thoracic vertebrae stack, ribcage (12 curved rib pairs), sternum, clavicles, scapulae.
- Vertebrae: lumbar stack with transverse processes, sacrum, full pelvis (ilium wings, obturator foramina).
- Arms & legs: humerus, radius/ulna, carpals and finger bones, femur, patella, tibia/fibula.
- Feet: tarsals, metatarsals, phalanges.

Each region stays its own `<g>` with an `id`, so clicks and focus still work exactly as now.

## 2. Theme
Keep Summit tokens — dark ambient purple gradient viewer background, neon purple `drop-shadow` glow on the active region, muted translucent slate/purple stroke for unselected bones. All values come from existing CSS tokens (no hardcoded hex in components).

## 3. Zoom, motion, micro-interactions
- Measure the selected group's real bounds with `getBBox()` after mount instead of hardcoded focus rectangles, then compute translate/scale to center it with padding (no cropping).
- Animate the transform with Framer Motion spring (subtle bounce on selection); fall back to `cubic-bezier(0.4, 0, 0.2, 1)` 500ms for reduced-motion users.
- Non-selected regions dim and slightly desaturate behind a soft backdrop so the focused bone stands out.
- Reset View button keeps working; nav chips below use the same animated path.

## 4. Collapsible prompt card
The "English Formula" card becomes a real toggle: clicking it while open collapses the explorer (chevron rotates back). Opening still smooth-scrolls to the section.

## 5. New sidebar section: Memorisation Technique
- Add `memorisation` to the section tab list.
- Its panel contains the same rich editor plus a dedicated link box titled **Memorise By Heart**: editable URL, opens in a new tab, and accepts a dropped PNG/image for its logo (click-to-upload too), matching the Quick Links tile behaviour on the home page.
- Link URL and image are saved in localStorage under the English Formula key prefix.

## Technical notes
- Files touched: `src/components/EnglishFormula.tsx` (skeleton, zoom, toggle, new tab), a small new `MemoriseLinkBox` component, and `src/styles.css` for the glow/dim filters.
- `framer-motion` will be added if not already installed; otherwise CSS transitions with the specified easing are used.
- Layout stays responsive: split-screen on desktop, stacked on mobile.
