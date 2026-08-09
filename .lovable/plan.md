# Galaxy controls, better grid, smooth cards, performance polish

## 1. Galaxy background controls

Add a small "Background" section in Settings (and a quick control in the header menu) with:

- **Intensity** slider — from off to vivid. Drives how bright/opaque the nebula clouds, stars and motes are.
- **Motion speed** slider — from still to lively. Drives drift/twinkle duration.
- A "Reset to default" link. Preference saved locally and applied instantly.

Both controls only touch the page background layer. Glass cards, panels and popovers keep their exact frosted look — no nebula texture bleeds onto them.

## 2. Subject grid breakpoints

Cards currently jump to two columns quite late and are cramped on tablets and 13" laptops.

- One column up to tablet portrait, two columns only from ~1280px, three only on very wide screens.
- Cap card width and keep generous gutters so the galaxy stays visible between and around cards.
- Grid items stay top-aligned so an open card never stretches its neighbours.

## 3. Smooth expand/collapse

- Animate open/close with a single composited height + fade transition and a rotating chevron, tuned so content fades in slightly after the height starts moving (no snap, no jump).
- Contents don't render their heavy inner lists until the card is opening, so first click stays instant.
- Fully disabled under reduced-motion.

## 4. Performance and interaction polish

- Move background animation onto transform/opacity only and hint the compositor, so scrolling and clicks stay at full frame rate; pause background animation when the tab is hidden.
- Trim per-frame work: fewer simultaneous blurred layers, star/mote counts scaled to the intensity setting.
- Consistent hover lift, focus rings, active-press feedback and transition timing across subject cards, term chips, quick links, buttons and inputs.
- Sweep for interaction mishaps: pickers closing on outside click and Escape, popovers staying inside the viewport, external links opening in a new tab, inputs committing on blur/Enter, no layout shift on first paint.

## 5. Reset level to 1

Clear XP and level back to Level 1 (0 XP) on your account, including the local caches, so the nameplate, profile and rank list all show Level 1.

## Technical notes

- New `background` prefs (`bgIntensity`, `bgSpeed`) in `src/hooks/usePrefs.ts`, painted as `--nebula-opacity` / `--nebula-speed` CSS variables on `:root`; consumed by `.ambient-root`/`.nebula-*` in `src/styles.css` and by `AmbientBackground.tsx` for element counts. Card/glass tokens untouched.
- Settings UI in `src/routes/_authenticated/settings.tsx`.
- Grid classes in `src/routes/index.tsx` (`md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3`, `items-start`).
- Collapse transition + deferred inner render in `src/components/SubjectCard.tsx`; viewport-aware popover and Escape handling in `SubjectColorPicker.tsx`.
- Level reset: zero `xp` on the profile row and clear related local cache keys via `src/lib/resetProgress.ts` flag bump.
