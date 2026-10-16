import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import CaseSafe from "./CaseSafe";
import TdhHeading from "./TdhHeading";

/**
 * A section of a TDH sub-page: a sticky heading column and a content column
 * from `lg`, one column below, as on the overview. The heading carries a link
 * button that copies the section's address.
 */
export default function TdhSection({
  id,
  title,
  locale,
  eyebrow,
  description,
  pills,
  children,
  wide = false,
}: {
  readonly id: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly eyebrow?: string;
  readonly description?: ReactNode;
  readonly pills?: ReactNode;
  readonly children: ReactNode;
  readonly wide?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`tw-grid tw-scroll-mt-24 tw-grid-cols-1 tw-items-start tw-gap-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 sm:tw-py-10 ${
        wide
          ? ""
          : "lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-10"
      }`}
    >
      <div className={wide ? "" : "lg:tw-sticky lg:tw-top-28"}>
        {eyebrow && (
          <p className="tw-m-0 tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
            <CaseSafe text={eyebrow} />
          </p>
        )}
        <TdhHeading
          id={id}
          title={title}
          locale={locale}
          className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 min-[360px]:tw-text-2xl"
        />
        {pills !== undefined && (
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">{pills}</div>
        )}
        {description !== undefined && (
          <div className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {description}
          </div>
        )}
      </div>
      <div className="tw-min-w-0">{children}</div>
    </section>
  );
}
