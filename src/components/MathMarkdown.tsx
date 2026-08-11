import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

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
  return (
    <div className={`math-md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default MathMarkdown;
