import Link from "next/link";
import type { ReactNode } from "react";

import { CODE, LINK } from "@/components/validator-page/validatorStyles";

// **bold** for what to choose or press, *italic* for the other choice,
// `code` for names and commands, [text](/path) for a link.

/** The end of a token that opens at `start`, past its last character. */
function tokenEnd(text: string, start: number): number | null {
  const at = text[start];
  if (at === "*" && text[start + 1] === "*") {
    // **bold**: no "*" inside.
    const close = text.indexOf("*", start + 2);
    return close > start + 2 && text[close + 1] === "*" ? close + 2 : null;
  }
  if (at === "*" || at === "`") {
    // *italic* or `code`: no closing mark inside.
    const close = text.indexOf(at, start + 1);
    return close > start + 1 ? close + 1 : null;
  }
  if (at === "[") {
    // [text](href): no "]" in the text, no ")" or space in the href.
    const close = text.indexOf("]", start + 1);
    if (close <= start + 1 || text[close + 1] !== "(") {
      return null;
    }
    const end = text.indexOf(")", close + 2);
    if (end <= close + 2 || /\s/.test(text.slice(close + 2, end))) {
      return null;
    }
    return end + 1;
  }
  return null;
}

/** Each token, with where it starts, in the order the text has them. */
function tokens(
  text: string
): { readonly index: number; readonly token: string }[] {
  const found: { readonly index: number; readonly token: string }[] = [];
  let index = 0;
  while (index < text.length) {
    const end = tokenEnd(text, index);
    if (end === null) {
      index += 1;
    } else {
      found.push({ index, token: text.slice(index, end) });
      index = end;
    }
  }
  return found;
}

function renderLink(token: string, key: number): ReactNode {
  const split = token.indexOf("](");
  const text = token.slice(1, split);
  const href = token.slice(split + 2, -1);
  if (href.startsWith("/")) {
    return (
      <Link key={key} href={href} className={LINK}>
        {text}
      </Link>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a key={key} href={href} className={LINK}>
        {text}
      </a>
    );
  }
  return (
    <a key={key} href={href} rel="noopener noreferrer" className={LINK}>
      {text}
    </a>
  );
}

function render(token: string, key: number): ReactNode {
  if (token.startsWith("[")) {
    return renderLink(token, key);
  }
  if (token.startsWith("**")) {
    return (
      <strong key={key} className="tw-font-semibold tw-text-iron-100">
        {token.slice(2, -2)}
      </strong>
    );
  }
  if (token.startsWith("*")) {
    return (
      <em key={key} className="tw-italic tw-text-iron-200">
        {token.slice(1, -1)}
      </em>
    );
  }
  return (
    <code key={key} className={CODE}>
      {token.slice(1, -1)}
    </code>
  );
}

/** Text from the pages' content, with its bold, italic, code and links. */
export default function InlineText({ text }: { readonly text: string }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const { index, token } of tokens(text)) {
    if (index > cursor) {
      parts.push(text.slice(cursor, index));
    }
    parts.push(render(token, index));
    cursor = index + token.length;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return <>{parts}</>;
}
