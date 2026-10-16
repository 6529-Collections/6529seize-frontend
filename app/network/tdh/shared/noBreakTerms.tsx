import { Fragment, type ReactNode } from "react";

/** Terms that must never break at their hyphen, such as "TDH-v1". */
const NO_BREAK = /(TDH-v1(?:\.0)?|tdh-v1\.0)/;

/**
 * Text with every "TDH-v1" (and "tdh-v1.0") kept on one line, so a heading
 * or a link never ends a line with "TDH-". The text itself is unchanged:
 * copying it gives the ordinary hyphen.
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
