import type { ReactNode } from "react";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";

/** The statement row's split on this page: heading 5, prose 7. */
const PROSE_FIRST = "lg:!tw-grid-cols-[minmax(0,5fr)_minmax(0,7fr)]";

/**
 * A section of an evidence page (EXPLAINED.md §5.3, the mockups' `stmt`
 * row): its number and label above a statement heading on the left, the
 * prose on the right, then the figure the full width below. The number is
 * blue, as the mockups set it.
 *
 * Promotion candidate for the kit: every chapter page uses this row.
 */
export default function Section({
  id,
  number,
  label,
  heading,
  children,
  figure,
  tight = false,
  shortProse = false,
}: {
  readonly id: string;
  readonly number: string;
  readonly label: string;
  readonly heading: ReactNode;
  /** The prose beside the heading. */
  readonly children?: ReactNode;
  /** What follows the full width: a model, a figure, a table. */
  readonly figure?: ReactNode;
  readonly tight?: boolean;
  /** A paragraph no longer than the heading keeps the kit's 6 : 5. */
  readonly shortProse?: boolean;
}) {
  return (
    <section
      id={id}
      className={`${tight ? EX_LAYOUT.sectionTight : EX_LAYOUT.section} tw-scroll-mt-24`}
      aria-labelledby={`${id}-heading`}
    >
      {/* A heading with no prose beside it takes the full measure, so the
          right half is never an empty block. */}
      {/* This page's prose runs long beside its headings, so the row is
          5 : 7 rather than the kit's 6 : 5: the prose gets the wider
          measure and the heading column is not left empty under the
          heading. */}
      <div
        className={
          children === undefined
            ? "tw-max-w-[940px]"
            : `${EX_LAYOUT.stmt} ${shortProse ? "" : PROSE_FIRST}`
        }
      >
        <div>
          <span className={`${EX_TEXT.label} tw-mb-3.5 tw-block`}>
            <span className="tw-text-primary-300">{number}</span>
            {` · ${label}`}
          </span>
          <h2 id={`${id}-heading`} className={EX_TEXT.stmt}>
            {heading}
          </h2>
        </div>
        {children !== undefined && (
          <div className={`${EX_TEXT.body} lg:tw-pt-1.5`}>{children}</div>
        )}
      </div>
      {figure !== undefined && (
        <div className="tw-mt-8 md:tw-mt-12">{figure}</div>
      )}
    </section>
  );
}

/** A paragraph of a section's prose, at the system's gap. */
export function Para({ children }: { readonly children: ReactNode }) {
  return <p className={EX_LAYOUT.paragraph}>{children}</p>;
}
