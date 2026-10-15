import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhDisclosure from "./shared/TdhDisclosure";
import TDHSection, { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "./TDHSection";

const FAQ_KEYS = ["sale", "transfer", "new", "set", "rate", "xtdh"] as const;
const DEEPER = [
  { key: "how", href: "/network/tdh/how-it-works" },
  { key: "spec", href: "/network/tdh/specification" },
  { key: "formal", href: "/network/tdh/formal" },
  { key: "impl", href: "/network/tdh/implementations" },
  { key: "verify", href: "/network/tdh/verification" },
] as const;
/** In the order a calculation meets them. */
export const GLOSSARY_TERMS = [
  "tdh",
  "cycle",
  "snapshot",
  "finalized",
  "edition",
  "rate",
  "raw",
  "base",
  "boost",
  "identity",
  "consolidation",
  "sink",
  "netting",
  "underflow",
  "xtdh",
  "versions",
  "validator",
  "rust",
  "programs",
  "vector",
  "root",
  "cutover",
  "classes",
  "items",
] as const;

export function TDHHoldingChanges({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <TDHSection id="tdh-changes" title={t(locale, "network.tdh.explainer.faq")}>
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
        {FAQ_KEYS.map((key) => (
          <TdhDisclosure
            key={key}
            tone="strong"
            className="tw-py-1"
            summary={t(locale, `network.tdh.explainer.faq.${key}.title`)}
          >
            <p className={`${TDH_TEXT} tw-pb-4 tw-pl-6`}>
              {t(locale, `network.tdh.explainer.faq.${key}.body`)}
            </p>
          </TdhDisclosure>
        ))}
      </div>
    </TDHSection>
  );
}

/** The words the TDH pages use, defined once. */
export function TDHGlossary({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <TDHSection
      id="glossary"
      title={t(locale, "network.tdh.explainer.glossary.title")}
      description={t(locale, "network.tdh.explainer.glossary.intro")}
    >
      <dl className="tw-m-0 tw-grid tw-gap-x-8 tw-gap-y-4 md:tw-grid-cols-2">
        {GLOSSARY_TERMS.map((term) => (
          <div key={term} id={`glossary-${term}`} className="tw-scroll-mt-28">
            <dt className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {t(
                locale,
                `network.tdh.explainer.glossary.${term}.term` as MessageKey
              )}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(
                locale,
                `network.tdh.explainer.glossary.${term}.def` as MessageKey
              )}
            </dd>
          </div>
        ))}
      </dl>
    </TDHSection>
  );
}

/** Three cards then two on wide screens; the last spans both columns on small ones. */
function deeperSpan(index: number): string {
  if (index < 3) {
    return "lg:tw-col-span-2";
  }
  return index === DEEPER.length - 1
    ? "sm:tw-col-span-2 lg:tw-col-span-3"
    : "lg:tw-col-span-3";
}

/** Cards to the five TDH sub-pages (plan §5.2, "Go deeper"). */
export function TDHGoDeeper({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <TDHSection
      id="tdh-deeper"
      title={t(locale, "network.tdh.explainer.deeper.title")}
    >
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-4 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-6">
        {DEEPER.map(({ key, href }, index) => (
          <li key={key} className={deeperSpan(index)}>
            <Link
              href={href}
              className={`${TDH_PANEL} tw-group tw-grid tw-h-full tw-grid-cols-[minmax(0,1fr)_auto] tw-content-start tw-gap-x-3 tw-gap-y-2 tw-p-5 tw-no-underline tw-transition-colors hover:tw-border-iron-600 motion-reduce:tw-transition-none ${TDH_FOCUS}`}
            >
              <span className="tw-text-base tw-font-medium tw-text-iron-100">
                {t(locale, `network.tdh.explainer.deeper.${key}.title`)}
              </span>
              <ArrowRightIcon
                aria-hidden="true"
                className="tw-mt-1 tw-size-4 tw-text-iron-500 tw-transition-transform group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300 motion-reduce:tw-transition-none"
              />
              <span className="tw-col-span-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(locale, `network.tdh.explainer.deeper.${key}.body`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </TDHSection>
  );
}
