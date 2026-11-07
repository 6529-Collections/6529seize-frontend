/**
 * Scrubs free text (error messages) for a diagnostics bundle: URLs, emails,
 * tokens, wallet addresses, UUIDs, quoted text, @handles, paths and any word
 * containing a digit are replaced, then the result is cut to `max` characters.
 * Plain words remain, so the person still reviews the preview before sending.
 */
const RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:https?|wss?|ipfs|ar):\/\/\S+/gi, "[url]"],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]"],
  [/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[token]"],
  [/\b0x[a-fA-F0-9]{4,}\b/g, "[address]"],
  [
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "[id]",
  ],
  [
    /"[^"]{0,500}"|'[^']{0,500}'|`[^`]{0,500}`|“[^”]{0,500}”|‘[^’]{0,500}’/g,
    "[text]",
  ],
  [/@[\w.-]+/g, "[handle]"],
  [/\/[\w.~%-]*\/[\w./~%-]*/g, "[path]"],
  [/\b[\w-]{20,}\b/g, "[token]"],
  [/\b\w*\d\w*\b/g, "[x]"],
];

export function scrubDiagnosticText(value: string, max = 160): string {
  let text = value;
  for (const [pattern, replacement] of RULES)
    text = text.replace(pattern, replacement);
  return text.replaceAll(/\s+/g, " ").trim().slice(0, max);
}
