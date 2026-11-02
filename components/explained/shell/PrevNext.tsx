import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { EX_FOCUS } from "../tokens";

/**
 * The page before and after, in reading order (EXPLAINED.md §6.2). The
 * kickers name places in the chapter ("Back · 2", "Next · S1"), ordinals
 * rather than quantities, and the cards are half-width with a short title
 * by design, so the number lint and the TDH gate's empty-card rule do not
 * apply to them.
 */
export interface PrevNextLink {
  readonly href: string;
  readonly title: string;
  /** "2", "S1": where it sits in the chapter. */
  readonly n?: string;
}

const CARD = `tw-block tw-flex-1 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-px-5 tw-py-[18px] tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-50 tw-no-underline hover:tw-border-iron-700 md:tw-max-w-[48%] ${EX_FOCUS}`;
const KICKER =
  "tw-mb-1 tw-block tw-text-[13px] tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-400";

export default function PrevNext({
  prev,
  next,
  locale,
}: {
  readonly prev?: PrevNextLink;
  readonly next?: PrevNextLink;
  readonly locale: SupportedLocale;
}) {
  const kicker = (word: string, n?: string) => (n ? `${word} · ${n}` : word);
  return (
    <nav
      aria-label={kt(locale, "explained.kit.pn.label")}
      className="tw-mt-24 tw-flex tw-flex-col tw-gap-4 md:tw-flex-row md:tw-justify-between"
      data-ex-allow-number=""
      data-tdh-check-ignore="empty-card"
    >
      {prev && (
        <Link className={CARD} href={prev.href} rel="prev">
          <span className={KICKER}>
            {kicker(kt(locale, "explained.kit.pn.back"), prev.n)}
          </span>
          {prev.title}
        </Link>
      )}
      {next && (
        <Link
          className={`${CARD} md:tw-ml-auto md:tw-text-right`}
          href={next.href}
          rel="next"
        >
          <span className={KICKER}>
            {kicker(kt(locale, "explained.kit.pn.next"), next.n)}
          </span>
          {next.title}
        </Link>
      )}
    </nav>
  );
}
