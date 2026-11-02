import type { ReactNode } from "react";

/**
 * Text whose case carries meaning: a commit or other hex hash (at least
 * seven hex digits, one of them a digit), a 0x value, a domain such as
 * 6529.io or name.eth, and the rule names TDH-v1 and tdh-v1.0.
 *
 * @api Exported for its unit test and the layout gate's twin.
 */
export const CASE_SIGNIFICANT =
  /\b(?:0x[0-9a-fA-F…]+|(?=[0-9a-f]*\d)[0-9a-f]{7,64}|TDH-v1|tdh-v\d+\.\d+|tdh-v\d+|[a-z0-9-]+\.(?:io|eth|com|net|org))\b/g;

/**
 * A string for an eyebrow or label set in capitals (`text-transform:
 * uppercase`): every case-significant part stays as written, so a commit
 * reads 7bf579a, not 7BF579A, and 6529.io never becomes 6529.IO. A short
 * part also stays on one line, so TDH-v1 never breaks at its hyphen; a full
 * hash may still wrap.
 */
/** Parts up to this long never wrap: names, domains, short commits. */
const KEEP_WHOLE_UP_TO = 16;

export default function CaseSafe({
  text,
}: {
  readonly text: string;
}): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(CASE_SIGNIFICANT)) {
    const { index } = match;
    if (index > last) {
      parts.push(text.slice(last, index));
    }
    const whole = match[0].length <= KEEP_WHOLE_UP_TO;
    parts.push(
      <span
        key={index}
        className={
          whole ? "tw-whitespace-nowrap tw-normal-case" : "tw-normal-case"
        }
        data-tdh-case-safe=""
      >
        {match[0]}
      </span>
    );
    last = index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts;
}
