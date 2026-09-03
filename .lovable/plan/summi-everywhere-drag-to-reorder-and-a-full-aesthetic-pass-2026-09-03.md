# Summi everywhere, drag-to-reorder, and a full aesthetic pass

## 1. Finish the unfinished Quick Recall work

- **Time's Up lock (Blurt):** when the timer hits 0:00 the textarea locks and a glass pop-up appears with Summi in an "encourage" pose: `+1 min`, `+2`, `+3`, `+5`, `+10`, or **Analyse my blurt**. Extending unlocks typing and resumes the countdown.
- **Clickable history:** clicking a session in a folder's history opens the session detail view — blurt stats plus the exact text you wrote, or the graded answers for a Quick Recall run.

## 2. Summi becomes clickable and playful

- Click Summi anywhere and he does a low-gravity Kirby-style spin: a slow floaty 360 with a squash on landing, slight upward drift, and a soft glow flare.
- Each click sprays a small burst of star sparkles that arc outward and fade — purple and gold, tuned to feel satisfying rather than noisy. Rapid clicks stack into a slightly bigger spin instead of stuttering.

### Where Summi lives and poses today

Right now he only exists inside Quick Recall: the page header (idle float), the Quick Recall runner, and the Blurt runner. His poses are `idle` (float), `thinking` (tilt with orbiting dashed ring), `happy` (hop), `celebrate` (bounce with sparks) and `encourage` (wobble) — each one a CSS animation, plus an aura, orbiting sparks and a ground shadow.

## 3. Summi across the site (subtle, space-themed)

- **Ambient flybys:** every couple of minutes Summi drifts across the background as a shooting star — glistening star trail behind him, tiny scale so he reads as part of the galaxy, never over text and never clickable mid-flight.
- **Cameos with space flavour:** small Summi appearances that react to what you're doing — a tiny astronaut-style float near the mountain climb, a celebrating Summi with orbiting stars when a badge unlocks, a thinking Summi while Atlas generates, and a sleepy Summi on empty states. Each keeps the existing artwork and palette; only the motion and orbiting space bits change (rings, comet trails, moon-dust motes).
- All of it pauses off-screen and disables under reduced-motion.

## 4. Drag-to-reorder English Formula sidebar

- The up/down arrows go away. Grab a sidebar section anywhere on its row and drag it to reorder, with a lift, a purple drop indicator, and a spring settle. Works for the custom sections you add too. Order still saves automatically.

## 5. Mountain climb — much more beautiful

- Deeper layered scene: parallax ridges, drifting mist, a soft aurora over the peak, a starfield behind, and snow glinting on the summit.
- The climb itself animates: the trail draws in, camp markers pulse as they unlock, the hiker walks up the path with a gentle bob and a lantern glow, and reaching a camp fires a small light burst with the camp name.
- Camp cards get the shared glass treatment with countdowns, current-camp highlight and a clear "next milestone" focus.

## 6. Site-wide polish and smoothness

- One consistent glass/motion language across every panel: same blur, edge light, hover lift and 200ms easing curve, so nothing feels bolted on.
- Motion is unified: shared enter/exit transitions, consistent stagger for lists and cards, satisfying button press feedback.
- Performance so it stays lag-free: heavy panels load on demand, background layers stay GPU-composited and pause when hidden, particle counts capped, and animation reduced automatically on low-power/reduced-motion devices.

## Technical notes

- Blurt: add a time's-up state to `BlurtRunner.tsx` using the existing `GlassModal`; extensions add to `left` and re-enable the textarea. Wire `onOpenSession` from `src/routes/_authenticated/recall.tsx` into `FolderWorkspace` to render the existing `SessionDetail`.
- Summi: extend `RecallMascot.tsx` with an `onClick` spin state and a local sparkle emitter; new keyframes (`mascotSpin`, `mascotSparkBurst`) in `src/styles.css`. New `SummiFlyby.tsx` mounted once in `AmbientBackground.tsx` for the shooting-star pass.
- Sidebar: replace the `onMoveUp`/`onMoveDown` props in `EnglishFormula.tsx` with the existing `DraggableList` pattern, persisting through the current `moveSection`/order logic in `useEnglishFormula.ts`.
- Mountain: rebuild the SVG scene in `MountainProgress.tsx` (layered paths, animated trail via stroke-dashoffset, framer-motion hiker), reusing `useMountainProgress.ts` unchanged.
- Polish: consolidate glass/hover/motion utilities in `src/styles.css` rather than per-component classes; audit `will-change`/`transform`-only animations and gate ambient layers with an intersection/visibility check.
