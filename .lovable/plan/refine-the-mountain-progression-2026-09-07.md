# Refine the mountain progression

## Goal
Keep the current mountain progression layout, milestone sequence, calculations, date controls, countdowns, and summary statistics unchanged. Use the supplied screenshot as visual inspiration only, not as an embedded image.

## Changes
- Remove Summi from the mountain route and remove the decorative marker effects that belong only to him.
- Preserve all six milestones: Year 11 begins, Year 11 Prelims, Year 12 begins, Half Yearly, HSC Trials, and HSC.
- Retain the current panel structure, including the progress percentage, editable exam dates, route progress, countdown cards, and mastered/papers/assessments totals.
- Refine the existing mountain artwork rather than replacing the layout: add richer layered ridges, clearer snow/rock faces, atmospheric cloud depth, a brighter purple route, warm gold at the current position and summit, and cleaner milestone markers inspired by the reference.
- Keep the scene readable on mobile by reducing label collisions and preserving the compact information hierarchy.
- Use subtle cloud, route-glow, and summit-light motion with reduced-motion support.

## Technical details
- Update the existing SVG scene and semantic style tokens only; no new feature logic or data changes.
- Remove the mountain component’s mascot dependency.
- Verify the panel at desktop and mobile sizes, then confirm the app builds without errors.
