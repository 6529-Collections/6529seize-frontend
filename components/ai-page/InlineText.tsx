import type { ReactNode } from "react";

import { CODE } from "@/components/validator-page/validatorStyles";

// **bold** for what to choose or press, *italic* for the other choice,
// `code` for names and commands.
const MARKUP = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function render(token: string, key: number): ReactNode {
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

/** Text from the pages' content, with its bold, italic and code marked up. */
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
