import Link from "next/link";
import type { ReactNode } from "react";

import { CODE, LINK } from "@/components/validator-page/validatorStyles";

// **bold** for what to choose or press, *italic* for the other choice,
// `code` for names and commands, [text](/path) for a link.
const MARKUP = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

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
  for (const match of text.matchAll(MARKUP)) {
    const index = match.index;
    if (index > cursor) {
      parts.push(text.slice(cursor, index));
    }
    parts.push(render(match[0], index));
    cursor = index + match[0].length;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return <>{parts}</>;
}
