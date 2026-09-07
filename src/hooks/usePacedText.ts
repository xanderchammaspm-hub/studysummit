import { useEffect, useRef, useState } from "react";

/**
 * Reveals streamed text at a calm reading pace instead of dumping whole
 * network chunks. When the stream finishes the remainder is flushed so the
 * final answer is never truncated.
 *
 * A markdown table is revealed row by row (never mid-row) so half-parsed
 * pipes don't flash on screen.
 */
export function usePacedText(full: string, streaming: boolean, cps = 220) {
  const [shown, setShown] = useState(full);
  const shownRef = useRef(full);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    if (!streaming) {
      shownRef.current = full;
      setShown(full);
      return;
    }
    if (shownRef.current.length > full.length || !full.startsWith(shownRef.current.slice(0, 8))) {
      // New message started — reset.
      shownRef.current = "";
      setShown("");
    }

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const cur = shownRef.current;
      if (cur.length < full.length) {
        let next = Math.min(full.length, cur.length + Math.max(1, Math.round(cps * dt)));
        // Don't stop halfway through a table row.
        const slice = full.slice(0, next);
        const lineStart = slice.lastIndexOf("\n") + 1;
        if (slice.slice(lineStart).includes("|")) {
          const nl = full.indexOf("\n", next);
          next = nl === -1 ? (full.length === next ? next : cur.length) : nl + 1;
        }
        shownRef.current = full.slice(0, next);
        setShown(shownRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [full, streaming, cps]);

  return streaming ? shown : full;
}
