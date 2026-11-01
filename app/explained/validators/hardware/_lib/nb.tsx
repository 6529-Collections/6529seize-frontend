import type { ReactNode } from "react";

/**
 * Keeps a number with its unit, a range with both its ends, and a name
 * with its number on one line: "12 W", "1.5–2 GB", "$10–13",
 * "$2,000–5,000", "Raspberry Pi 5", "EIP-7870". Each such piece is a
 * span that does not wrap; the text between them wraps as usual. Copying
 * the text gives it back unchanged, with ordinary spaces and dashes.
 *
 * The token: a name that ends in a number ("Pi 5", "EIP-7870"), or a number, money
 * included, with an optional range end ("–13") and an optional unit
 * after a space or a no-break space ("12 W", "1.5–2 GB").
 */
const TOKEN =
  /\b(?:Raspberry )?Pi \d\b|\bEIP-\d+|(?:[$€]?\d[\d,.]*\d|[$€]?\d)(?:–(?:[$€]?\d[\d,.]*\d|[$€]?\d))?(?:[  ](?:W|GB|MB|TB|TiB|GiB|Mbps|Gbps|cores?|threads|vCPUs?|vCPU|vCores|minutes|seconds|hours|days|months|years|times|cents|kWh|bytes|UTC|h|min)\b)?/g;

export function nb(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const piece = match[0];
    const at = match.index;
    // A bare number has nothing to keep together.
    if (!/[–\s -]/.test(piece)) continue;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(
      <span key={at} className="tw-whitespace-nowrap">
        {piece}
      </span>
    );
    last = at + piece.length;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
