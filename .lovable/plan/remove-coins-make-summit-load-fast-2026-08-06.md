# Remove coins + make Summit load fast

## 1. Remove the coin system

Coins are shown but never spent, so they get removed from the UI and rewards:

- Account menu: drop the `🪙 coins` chip.
- Profile page: drop the coins chip and remove "coins" from the page description text.
- Achievements: reward lines become "+X XP" only (both the unlock toast and the badge cards).
- `coinReward` removed from the achievement definition helper in `src/lib/progression.ts`.

The `coins` database column stays untouched (harmless, and dropping it is irreversible); it simply stops being read.

## 2. Faster first screen

**Trim the initial payload.** The home route currently imports every heavy feature up front — study calendar, English Formula (with the skeleton hologram), Atlas AI coach, mountain progression, exam-engine logo. These load below the fold or behind interaction, so they move to lazy chunks that stream in after the hero paints, each with a lightweight matching-height placeholder so nothing jumps.

**Slim the images.** The Summit logo is a 427 KB PNG that renders at ~110 px. It gets converted to compressed WebP variants at the sizes actually used, and marked as high-priority preload on the first screen. Two unused 1 MB skeleton PNGs left over from earlier iterations get deleted from the repo.

**Prefetch routes.** Router-level preloading on hover/touch (`defaultPreload: "intent"` with a short stale time) so Exam Engine, Statistics, Achievements, Profile and Settings are already fetched by the time you click. The Exam Engine link — the most-used jump — is preloaded as soon as the home page is idle.

**Splash timing.** The splash stays cinematic but stops blocking: it fades on its own timer while the app hydrates behind it, so the reveal is instant rather than a second load.

## 3. Technical notes

- Lazy loading via `React.lazy` + `Suspense` inside the existing `ClientOnly` boundaries; route components are already auto-code-split by TanStack Start, so this targets the home route's component graph.
- `vite-imagetools` added to the Vite config for build-time WebP/AVIF variants of `summit-logo.png`; `SummitLogo` picks the variant with a `<picture>` fallback.
- `links: [{ rel: "preload", as: "image", href: logo, fetchpriority: "high" }]` in the home route `head()` only (not `__root`).
- `createRouter({ defaultPreload: "intent", defaultPreloadStaleTime: 30_000 })` in `src/router.tsx`.
- Delete `src/assets/skeleton-holo-v2.png` and `src/assets/skeleton-hologram.png` after confirming no imports remain.
