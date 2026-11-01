import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/explained/marks/glyphs";
import type { PrevNextLink } from "@/components/explained/shell/PrevNext";
import { EX_LAYOUT, EX_LINK, EX_TEXT } from "@/components/explained/tokens";

/**
 * The editorial rows of the explainer and guide pages (EXPLAINED.md §5.3):
 * a page head, a statement row (the heading left, the prose right) and an
 * editorial row (a numbered label in the left column, the content across
 * the text and margin columns), on the kit's tokens (`EX_LAYOUT`). Every
 * chapter composes its pages from these, not from another page's folder.
 * Each numeral sits in its own text node: a bare ordinal is a position,
 * not a quantity.
 */

/** "Chapter 01 · 1 How it works": the label above a page's H1. */
export function Eyebrow({ children }: { readonly children: ReactNode }) {
  return <p className={`tw-m-0 tw-mb-4 ${EX_TEXT.label}`}>{children}</p>;
}

/** A blue part of a label: the page's number, a part's letter. */
export function You({ children }: { readonly children: ReactNode }) {
  return <span className="tw-text-primary-300">{children}</span>;
}

/** The H1 at 400% zoom (320 px): two lines, not one word to a line. */
const H1_NARROW = "max-[359px]:tw-text-[30px] max-[359px]:tw-leading-9";

export function PageHead({
  eyebrow,
  title,
  lede,
  reference = false,
  titleClassName = "",
  children,
  aside,
}: {
  readonly eyebrow: ReactNode;
  readonly title: string;
  readonly lede: ReactNode;
  /** Evidence and reference pages use the smaller H1 (`t-h1r`). */
  readonly reference?: boolean;
  readonly titleClassName?: string;
  readonly children?: ReactNode;
  /** The page's subject, drawn beside the opening from a desktop up. */
  readonly aside?: ReactNode;
}) {
  const head = (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1
        className={`${reference ? EX_TEXT.h1r : EX_TEXT.h1} ${H1_NARROW} ${titleClassName}`}
      >
        {title}
      </h1>
      <p className={`tw-mt-4 md:tw-mt-[22px] ${EX_TEXT.lede}`} data-ex-lede="">
        {lede}
      </p>
      {children}
    </>
  );
  if (aside === undefined) {
    return <header className="tw-pt-[30px] md:tw-pt-[52px]">{head}</header>;
  }
  return (
    <header className="tw-grid tw-grid-cols-1 tw-items-end tw-gap-8 tw-pt-[30px] md:tw-pt-[52px] lg:tw-grid-cols-[minmax(0,1fr)_360px] lg:tw-gap-12 lg:tw-pb-10">
      <div className="tw-min-w-0">{head}</div>
      <div className="tw-hidden tw-min-w-0 lg:tw-block">{aside}</div>
    </header>
  );
}

/** A section: 120 px above it on a desktop, 76 on a phone; tight, 80 and 52. */
export function Section({
  id,
  tight = false,
  children,
  label,
}: {
  readonly id?: string;
  readonly tight?: boolean;
  readonly children: ReactNode;
  /** The section's accessible name, when it has no heading of its own. */
  readonly label?: string;
}) {
  return (
    <section
      id={id}
      className={`${tight ? EX_LAYOUT.sectionTight : EX_LAYOUT.section} tw-scroll-mt-24`}
      {...(label ? { "aria-label": label } : {})}
    >
      {children}
    </section>
  );
}

/** "A · Time": the label above a statement heading. */
export function StatementLabel({
  mark,
  children,
}: {
  readonly mark?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <span className={`tw-mb-3.5 tw-block ${EX_TEXT.label}`}>
      {mark !== undefined && (
        <>
          <You>{mark}</You>
          {" · "}
        </>
      )}
      {children}
    </span>
  );
}

/** The statement row: the heading on the left, the prose on the right. */
export function Statement({
  label,
  title,
  children,
}: {
  readonly label: ReactNode;
  readonly title: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className={EX_LAYOUT.stmt}>
      <div>
        {label}
        <h2 className={EX_TEXT.stmt}>{title}</h2>
      </div>
      <div className="lg:tw-pt-1.5">{children}</div>
    </div>
  );
}

/** One paragraph of body copy, 18/29 with the 18 px gap. */
export function Para({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <p className={`${EX_LAYOUT.paragraph} ${EX_TEXT.body} ${className}`}>
      {children}
    </p>
  );
}

/**
 * An editorial row: a number and a label in the left column, the content
 * beside it. `wide` spans the text and margin columns.
 */
export function EdRow({
  no,
  label,
  wide = false,
  children,
  className = "",
  labelOnPhone = true,
  labelIsHeading = false,
}: {
  readonly no?: string;
  readonly label?: string;
  readonly wide?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
  /** False hides an empty label column on a phone. */
  readonly labelOnPhone?: boolean;
  /** The label is the section's heading (an h2 set as a label). */
  readonly labelIsHeading?: boolean;
}) {
  return (
    <div className={`${EX_LAYOUT.ed} ${className}`}>
      <div className={`lg:tw-pt-2.5 ${labelOnPhone ? "" : "max-lg:tw-hidden"}`}>
        {no !== undefined && (
          <span className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-primary-300">
            {no}
          </span>
        )}
        {label !== undefined && labelIsHeading && (
          <h2 className={`tw-m-0 tw-block ${EX_TEXT.label}`}>{label}</h2>
        )}
        {label !== undefined && !labelIsHeading && (
          <span className={`tw-block ${EX_TEXT.label}`}>{label}</span>
        )}
      </div>
      <div className={`tw-min-w-0 ${wide ? EX_LAYOUT.edWide : ""}`}>
        {children}
      </div>
    </div>
  );
}

/** A page before or after this one, its number only when it has one. */
export function pageLink(
  href: string,
  title: string,
  n?: string
): PrevNextLink {
  return n === undefined ? { href, title } : { href, title, n };
}

/**
 * "The daily check →": a link to the next thing to read. The arrow stays
 * with the last word when the text wraps on a phone.
 */
export function GoLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  return (
    <Link
      className={`${EX_LINK} tw-text-base tw-font-semibold tw-leading-6`}
      href={href}
    >
      {children}
      <Icon
        kind="arrow"
        className="tw-ml-1.5 tw-inline tw-size-[15px] tw-align-[-2px]"
      />
    </Link>
  );
}
