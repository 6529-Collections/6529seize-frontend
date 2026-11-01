import type { ReactNode } from "react";

/**
 * Keeps a number with its unit, and a range with both its ends, on one
 * line: "12 W", "1.5–2 GB", "$10–13", "$2,000–5,000". Each such piece is a
 * span that does not wrap; the text between them wraps as usual. Copying
 * the text gives it back unchanged, with ordinary spaces and dashes.
 */
const UNIT =
  "W|GB|MB|TB|TiB|GiB|Mbps|Gbps|cores?|threads|vCPUs?|vCPU|vCores|minutes|seconds|hours|days|months|years|times|cents|kWh|bytes|UTC|h|min";
const NUM = String.raw`[$€]?\d[\d,.]*\d|[$€]?\d`;
const TOKEN = new RegExp(
  String.raw`(?:${NUM})(?:–(?:${NUM}))?(?:[  ](?:${UNIT})\b)?`,
  "g"
);

export function nb(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const piece = match[0];
    const at = match.index ?? 0;
    // A bare number has nothing to keep together.
    if (!/[–\s ]/.test(piece)) continue;
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
