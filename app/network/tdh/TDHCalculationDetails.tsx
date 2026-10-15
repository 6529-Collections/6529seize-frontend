import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhStatusPill from "./shared/TdhStatusPill";
import TDHSection, { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "./TDHSection";

const FAQ_KEYS = ["sale", "transfer", "new", "set", "rate", "xtdh"] as const;
const DEEPER = [
  { key: "how", href: "/network/tdh/how-it-works" },
  { key: "spec", href: "/network/tdh/specification" },
  { key: "formal", href: "/network/tdh/formal" },
  { key: "impl", href: "/network/tdh/implementations" },
  { key: "verify", href: "/network/tdh/verification" },
] as const;
const DISCLOSURE =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 last:tw-border-b-0";
const SUMMARY = `tw-cursor-pointer tw-py-4 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100 ${TDH_FOCUS}`;

export function TDHHoldingChanges({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <TDHSection id="tdh-changes" title={t(locale, "network.tdh.explainer.faq")}>
      {FAQ_KEYS.map((key) => (
        <details key={key} className={DISCLOSURE}>
          <summary className={SUMMARY}>
            {t(locale, `network.tdh.explainer.faq.${key}.title`)}
          </summary>
          <p className={`${TDH_TEXT} tw-pb-5`}>
            {t(locale, `network.tdh.explainer.faq.${key}.body`)}
          </p>
        </details>
      ))}
    </TDHSection>
  );
}

/** Cards to the five TDH sub-pages (plan §5.2, "Go deeper"). */
export function TDHGoDeeper({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <TDHSection
      id="tdh-deeper"
      title={t(locale, "network.tdh.explainer.deeper.title")}
    >
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-4 tw-p-0 sm:tw-grid-cols-2">
        {DEEPER.map(({ key, href }) => (
          <li key={key}>
            <Link
              href={href}
              className={`${TDH_PANEL} tw-group tw-flex tw-h-full tw-flex-col tw-gap-2 tw-p-5 tw-no-underline tw-transition-colors hover:tw-border-iron-600 motion-reduce:tw-transition-none ${TDH_FOCUS}`}
            >
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-base tw-font-medium tw-text-iron-100">
                {t(locale, `network.tdh.explainer.deeper.${key}.title`)}
                {key === "formal" && (
                  <TdhStatusPill pill="inProgress" locale={locale} size="sm" />
                )}
                <ArrowRightIcon
                  aria-hidden="true"
                  className="tw-ml-auto tw-size-4 tw-text-iron-600 tw-transition-transform group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300 motion-reduce:tw-transition-none"
                />
              </span>
              <span className="tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(locale, `network.tdh.explainer.deeper.${key}.body`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </TDHSection>
  );
}

/** The old "Exact calculation" anchor now points at How TDH is calculated. */
export default function TDHCalculationMoved({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <TDHSection
      id="tdh-exact"
      title={t(locale, "network.tdh.explainer.moved.title")}
    >
      <p className={TDH_TEXT}>
        {t(locale, "network.tdh.explainer.moved.body")}
      </p>
      <Link
        href="/network/tdh/how-it-works"
        className={`tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary-300 hover:tw-text-primary-400 ${TDH_FOCUS}`}
      >
        {t(locale, "network.tdh.explainer.moved.link")}
        <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
      </Link>
    </TDHSection>
  );
}
