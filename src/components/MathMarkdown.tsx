import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import katex from "katex";
import "katex/dist/katex.min.css";

type Token = { type: "text" | "math"; value: string; display?: boolean };

/** Normalise the LaTeX delimiters models and PDF extractors emit. */
function normalise(src: string): string {
  return src
    .replace(/\\\\(frac|sqrt|int|sum|times|cdot|le|ge|neq|pi|theta|alpha|beta|infty|left|right|begin|end|text|mathrm|approx|pm)/g, "\\$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${inner}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner}$`);
}

/**
 * Split a string into plain-markdown and maths tokens. Done by hand rather than
 * through a remark plugin so maths always renders, in every build.
 */
function tokenise(src: string): Token[] {
  const out: Token[] = [];
  let buf = "";
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && (src[i + 1] === "$")) {
      buf += "$";
      i += 2;
      continue;
    }
    if (ch === "$") {
      const display = src[i + 1] === "$";
      const open = display ? 2 : 1;
      const close = src.indexOf(display ? "$$" : "$", i + open);
      if (close > i + open - 1) {
        const inner = src.slice(i + open, close);
        // A lone dollar (prices etc.) shouldn't swallow the rest of the line.
        if (inner.trim() && (display || !/\n\s*\n/.test(inner))) {
          if (buf) out.push({ type: "text", value: buf });
          buf = "";
          out.push({ type: "math", value: inner, display });
          i = close + open;
          continue;
        }
      }
    }
    buf += ch;
    i += 1;
  }
  if (buf) out.push({ type: "text", value: buf });
  return out;
}

/** Last-resort: turn LaTeX source into readable plain maths, never raw markup. */
export function plainMath(src: string): string {
  let out = src;
  for (let i = 0; i < 4; i++) {
    out = out
      .replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
      .replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, "$1√($2)")
      .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
      .replace(/\\(text|mathrm|mathbf|operatorname)\s*\{([^{}]*)\}/g, "$2");
  }
  return out
    .replace(/\\left|\\right/g, "")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\leq?\b/g, "≤")
    .replace(/\\geq?\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\pi\b/g, "π")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\degree\b|\^\\circ/g, "°")
    .replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/g, " ")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderMath(value: string, display: boolean): string {
  try {
    return katex.renderToString(value, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    return "";
  }
}


/**
 * Markdown + LaTeX renderer used everywhere exam text is displayed.
 * Handles $inline$ and $$display$$ maths so parsed papers read properly.
 */
export function MathMarkdown({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const tokens = useMemo(() => tokenise(normalise(children ?? "")), [children]);

  return (
    <div className={`math-md ${className}`}>
      {tokens.map((t, i) => {
        if (t.type === "math") {
          const html = renderMath(t.value, !!t.display);
          if (!html) {
            // Never show raw LaTeX — degrade to readable plain maths.
            return (
              <span
                key={i}
                className={t.display ? "block my-2 text-center font-medium" : "inline font-medium"}
              >
                {plainMath(t.value)}
              </span>
            );
          }
          return (
            <span
              key={i}
              className={t.display ? "block my-3 text-center" : "inline"}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        // Markdown trims edge whitespace, so re-add it around inline maths.
        const lead = /^[ \t]/.test(t.value) ? " " : "";
        const trail = /[ \t]$/.test(t.value) ? " " : "";
        // Any LaTeX left outside delimiters (unbalanced $, stray commands) is
        // cleaned up so a bad extraction still reads properly.
        const safe = /\\[a-zA-Z]{2,}|\\\(|\\\[/.test(t.value) ? plainMath(t.value) : t.value;
        return (
          <span key={i} className="math-md-text">
            {lead}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{safe}</ReactMarkdown>
            {trail}
          </span>
        );

      })}
    </div>
  );
}

export default MathMarkdown;
