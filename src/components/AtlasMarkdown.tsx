import { MathMarkdown } from "@/components/MathMarkdown";

/**
 * Single renderer for every Atlas AI surface — tables, headings, callouts and
 * maths all come out styled the same way (see `.atlas-md` in styles.css).
 */
export function AtlasMarkdown({
  children,
  className = "",
  caret = false,
}: {
  children: string;
  className?: string;
  /** Show a soft typing caret while the answer is still streaming. */
  caret?: boolean;
}) {
  return (
    <div className={`atlas-md ${caret ? "atlas-md-typing" : ""} ${className}`}>
      <MathMarkdown>{children}</MathMarkdown>
    </div>
  );
}

export default AtlasMarkdown;
