import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { resolveSource } from "./tdhSources";
import { TDH_FOCUS_RING } from "./tdhStyles";

const CHIP =
  "tw-inline-flex tw-min-h-6 tw-items-center tw-rounded-md tw-border tw-border-solid tw-px-1.5 tw-font-mono tw-text-xs tw-font-medium tw-leading-4 tw-no-underline tw-whitespace-nowrap";

/**
 * Source chips after a cited sentence or paragraph (plan §4.4). Specification,
 * deviation, decision and evidence chips link into the specification page;
 * private documents show their reference with "source to be published".
 */
export default function TdhSource({
  refs,
  locale,
  className = "",
  block = false,
}: {
  readonly refs: readonly string[];
  readonly locale: SupportedLocale;
  readonly className?: string;
  /** A row of its own instead of chips that follow the text. */
  readonly block?: boolean;
}) {
  // In a margin column a long evidence label wraps at its space instead of
  // running past the page edge.
  const chip = block ? `${CHIP} xl:tw-whitespace-normal` : CHIP;
  const layout = block
    ? "tw-flex tw-flex-wrap tw-gap-1"
    : "tw-ml-1 tw-inline [&>*]:tw-mr-1 [&>*]:tw-align-baseline [&>*:last-child]:tw-mr-0";
  return (
    <span className={`${layout} ${className}`} data-tdh-sources="">
      {refs.map((reference) => {
        const source = resolveSource(locale, reference);
        if (source.href === null) {
          return (
            <span
              key={reference}
              className={`${chip} tw-border-dashed tw-border-iron-700 tw-text-iron-500`}
              title={source.accessibleName}
            >
              <span aria-hidden="true">{source.label}</span>
              <span className="tw-sr-only">{source.accessibleName}</span>
            </span>
          );
        }
        return (
          <Link
            key={reference}
            href={source.href}
            prefetch={false}
            title={source.accessibleName}
            data-tdh-source-href={source.href}
            className={`${chip} tw-border-iron-700 tw-text-iron-400 tw-transition-colors hover:tw-border-primary-400/60 hover:tw-text-primary-300 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`}
          >
            <span aria-hidden="true">{source.label}</span>
            <span className="tw-sr-only">{source.accessibleName}</span>
          </Link>
        );
      })}
    </span>
  );
}
