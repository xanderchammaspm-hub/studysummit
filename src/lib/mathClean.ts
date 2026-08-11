/** Tidy OCR/LLM maths artefacts so KaTeX renders parsed exam text cleanly. */
export function cleanMath(input: string): string {
  return input
    .replace(/\uFFFD/g, "") // replacement glyphs from bad PDF extraction
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2032/g, "'") // prime
    .replace(/[\u2212\u2013]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
