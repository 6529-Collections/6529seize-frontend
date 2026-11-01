/**
 * Plain web links in decrypted message text. Only http(s) URLs become links;
 * every other scheme stays text. Trailing punctuation is left out of the
 * link, and a closing parenthesis stays only when it balances one inside the
 * URL ("https://en.wikipedia.org/wiki/Foo_(bar)").
 */
const URL_PATTERN = /https?:\/\/[^\s<]+/gu;
const TRAILING_PUNCTUATION = /[.,;:!?\]"'’”]$/u;

type E2eeLinkSegment =
  | { readonly kind: "text"; readonly start: number; readonly value: string }
  | {
      readonly kind: "link";
      readonly start: number;
      readonly value: string;
      readonly href: string;
    };

const countOf = (value: string, char: string) => value.split(char).length - 1;

/** Drops trailing punctuation and any unbalanced closing parenthesis. */
function trimUrl(raw: string): string {
  let url = raw;
  for (;;) {
    if (TRAILING_PUNCTUATION.test(url)) {
      url = url.slice(0, -1);
    } else if (url.endsWith(")") && countOf(url, ")") > countOf(url, "(")) {
      url = url.slice(0, -1);
    } else {
      return url;
    }
  }
}

function toSafeHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname.length > 0
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
    const value = trimUrl(match[0]);
    const href = toSafeHref(value);
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
    segments.push({ kind: "link", start: offset + match.index, value, href });
    cursor = match.index + value.length;
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
