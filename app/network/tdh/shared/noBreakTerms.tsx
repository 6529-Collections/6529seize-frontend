import { Fragment, type ReactNode } from "react";

/**
 * Terms that must never break: "TDH v1.4" at its space, a rule version
 * such as "tdh-v1.4" at its hyphen, and a shortened address such as
 * "0x…dead" after its ellipsis.
 */
const NO_BREAK = /(TDH v\d+\.\d+|tdh-v\d+\.\d+|0x…[0-9a-f]+)/;

/**
 * Text with every "TDH v1.4" (and "tdh-v1.4") and every shortened address
 * ("0x…dead") kept on one line, so a heading or a link never ends a line
 * with "TDH" or "0x…". The text itself is unchanged: copying it gives the
 * ordinary characters.
 */
export function noBreakTerms(text: string): ReactNode {
  if (!NO_BREAK.test(text)) {
    return text;
  }
  return text.split(NO_BREAK).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="tw-whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}
