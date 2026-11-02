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

/**
 * `nb`, with a config key or command between backticks set in the code
 * face: "open the port you set in `[p2p] listen`". The backticks are not
 * printed.
 */
export function nbCode(text: string): ReactNode {
  if (!text.includes("`")) return nb(text);
  return text.split("`").map((piece, index) =>
    index % 2 === 1 ? (
      <code
        key={index}
        className="tw-whitespace-nowrap tw-rounded-md tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-[0.875em] tw-text-iron-50"
      >
        {piece}
      </code>
    ) : (
      <span key={index}>{nb(piece)}</span>
    )
  );
}

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
