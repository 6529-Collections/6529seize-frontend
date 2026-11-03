import { Fragment, type ReactNode } from "react";

/**
 * "CC0" with a slashed zero. Montserrat's zero is round like its capital O,
 * so CC0 reads as "CCO", and the font has no slashed-zero feature: the
 * slash is drawn over the digit. The text stays "CC0" for copying and for
 * screen readers.
 */
function SlashedZero() {
  return (
    <span className="tw-relative tw-inline-block">
      0
      <span
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-[52%] tw-h-[0.075em] tw-w-[0.5em] -tw-translate-x-1/2 -tw-translate-y-1/2 -tw-rotate-[62deg] tw-rounded-full tw-bg-current"
      />
    </span>
  );
}

/** Text with every "CC0" drawn with a slashed zero; other text as it is. */
export function withCc0(text: string): ReactNode {
  if (!text.includes("CC0")) {
    return text;
  }
  return text.split("CC0").map((piece, index) => (
    // The pieces are one string's fixed segments, in order.
    <Fragment key={index}>
      {index > 0 && (
        <span className="tw-whitespace-nowrap">
          CC
          <SlashedZero />
        </span>
      )}
      {piece}
    </Fragment>
  ));
}
