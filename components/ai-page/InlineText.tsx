import type { ReactNode } from "react";

import { CODE } from "@/components/validator-page/validatorStyles";

// **bold** for what the screen shows, `code` for names and commands.
const MARKUP = /(\*\*[^*]+\*\*|`[^`]+`)/g;

/** Text from the guide's content, with its bold and code marked up. */
export default function InlineText({ text }: { readonly text: string }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MARKUP)) {
    const index = match.index;
    if (index > cursor) {
      parts.push(text.slice(cursor, index));
    }
    const token = match[0];
    parts.push(
      token.startsWith("**") ? (
        <strong key={index} className="tw-font-semibold tw-text-iron-100">
          {token.slice(2, -2)}
        </strong>
      ) : (
        <code key={index} className={CODE}>
          {token.slice(1, -1)}
        </code>
      )
    );
    cursor = index + token.length;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return <>{parts}</>;
}
