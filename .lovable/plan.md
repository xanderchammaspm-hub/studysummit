## 1. Rebrand

- Rename the site to **Summit** everywhere it appears: header wordmark, hero, `<title>`/meta in `src/routes/__root.tsx` and `src/routes/index.tsx`, footer/legend copy, and any "Study Hub"/prior naming still lingering.
- Rename the AI feature from "AI Coach" / "AI Study Coach" to **Atlas AI** across trigger button, sheet title, tab labels, toasts, placeholders, empty-state copy, aria-labels, and suggested prompt chips.
- Keep the mountain metaphor consistent: Summit = the destination, Atlas = the guide.

## 2. AI Coach → Atlas AI: reposition & modern chat UX

**Placement**
- Move the floating trigger to a discreet bottom-right pill clear of content on all viewports (safe-area insets on mobile, offset above any bottom UI). Compact circular icon on mobile, expands to a labeled "Atlas AI" pill on desktop hover.
- Global `Ctrl/Cmd+K` shortcut opens Atlas; swipe-to-close on mobile.
- Sheet width: full-screen on mobile, `max-w-xl` tablet, `max-w-2xl` desktop, rounded left edge + backdrop blur so it never fully covers the mountain.

**Chat experience (ChatGPT/Gemini-style)**
- Replace the single-shot flow with a persistent **conversation thread**:
  - User/assistant message bubbles with avatars, timestamps, markdown rendering.
  - **Streaming tokens** (new `/api/chat` route using `streamText` + `toUIMessageStreamResponse` via Lovable AI Gateway; client uses `useChat` from `@ai-sdk/react`).
  - "Atlas is thinking…" shimmer while `status === 'submitted'`.
  - Auto-scroll to bottom with a "jump to latest" button when scrolled up.
  - Auto-growing textarea, Enter to send, Shift+Enter newline, Stop while streaming, Regenerate on last reply, Copy per message.
  - Suggested prompt chips on empty state (Explain a syllabus dot point, Generate HSC Qs, Mark my answer, etc.). Mode chips seed the prompt; the conversation stays continuous.
  - Persist thread to `localStorage` (single conversation, matches existing local-first pattern); "New chat" button clears it.
- Study Kit tab keeps one-shot generation but reuses bubble styling and gains Copy/Download.

## 3. Mountain Progression System (core experience)

Turn the mountain from decoration into the primary dashboard visualization.

**Stages** (derived from activity, no manual toggles):
```text
🏕 Base Camp  → Year 11 started (default)
⛰ Camp 1     → 25% of tracked topics green OR 10 papers logged
🏔 Camp 2     → 50% green OR all Y11 subjects have ≥1 assessment tracked
🗻 Camp 3     → 75% green AND Year 12 active
👑 Summit     → 100% syllabus green + all assessments past due
```
Thresholds are placeholders; final numbers land in code review.

**Visualization**
- New `MountainProgress` component becomes the hero: SVG mountain with camps as labeled waypoints along the ridge line.
- A hiker/flag marker animates (spring easing) from its previous position to the new one when progress changes.
- Each camp shows name, unlock criteria, and a check when reached. Hover/tap reveals what's needed for the next camp.
- Progress bar underneath shows exact % to next camp using the existing purple→yellow gradient.
- Green flips, new papers, and completed assessments trigger a subtle glow/confetti burst; crossing a camp fires a toast (e.g. *"Camp 2 reached — halfway to Summit."*).
- Persist the highest camp reached so the climb is monotonic unless the user resets.

**Integration**
- Progress calc in a new `useMountainProgress` hook reading the existing subject store + assessments; no schema changes.
- Old ProgressRing shrinks into the stats panel as a compact indicator; the mountain is the hero.

## 4. Traffic-light icon

- New reusable `TrafficLightIcon` (three stacked dots in red/yellow/green using existing tokens), sized like a lucide icon.
- Use it as the section header for every "Traffic Light System" block in `SubjectCard`, in the Legend, in the stats panel label, and in the Atlas AI suggested prompt chip.

## Technical notes

- **Files touched:** `src/components/AICoach.tsx` → renamed to `src/components/AtlasAI.tsx` (rebuilt UI); new `src/routes/api/chat.ts` (streaming route via Lovable AI Gateway); `src/lib/ai.functions.ts` (keep `studyKit`, drop `askCoach` in favor of streaming route); new `src/components/MountainProgress.tsx`, `src/hooks/useMountainProgress.ts`, `src/components/TrafficLightIcon.tsx`; edits to `src/routes/index.tsx`, `src/routes/__root.tsx`, `src/components/SubjectCard.tsx`; minor additions to `src/styles.css` for climb animation + safe-area utilities.
- **Model:** Gemini via Lovable AI Gateway (`google/gemini-2.5-flash`) for streaming chat; no new secrets (`LOVABLE_API_KEY` already provisioned).
- **Persistence:** conversation + highest-camp stored in `localStorage` alongside existing keys; no backend changes.
- **No changes** to subjects data model, colors, or other pages beyond what's listed.
