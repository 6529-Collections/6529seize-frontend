/**
 * Plain web links in decrypted message text. Only http(s) URLs become links;
 * every other scheme stays text. Trailing punctuation is left out of the
 * link, the same rule as wave drops.
 */
const URL_PATTERN = /https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'’”]/gu;

export type E2eeLinkSegment =
  | { readonly kind: "text"; readonly start: number; readonly value: string }
  | {
      readonly kind: "link";
      readonly start: number;
      readonly value: string;
      readonly href: string;
    };

function toSafeHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/**
 * Splits `text` into text runs and links. `offset` is added to each `start`
 * so segments stay unique keys inside a larger message.
 */
export function splitLinks(text: string, offset = 0): E2eeLinkSegment[] {
  const segments: E2eeLinkSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const href = toSafeHref(match[0]);
    if (href === null) {
      continue;
    }
    if (match.index > cursor) {
      segments.push({
        kind: "text",
        start: offset + cursor,
        value: text.slice(cursor, match.index),
      });
    }
    segments.push({
      kind: "link",
      start: offset + match.index,
      value: match[0],
      href,
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length || segments.length === 0) {
    segments.push({
      kind: "text",
      start: offset + cursor,
      value: text.slice(cursor),
    });
  }
  return segments;
}
