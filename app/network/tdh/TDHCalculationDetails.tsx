import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhDisclosure from "./shared/TdhDisclosure";
import { noBreakTerms } from "./shared/noBreakTerms";
import TDHSection, { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "./TDHSection";

const FAQ_KEYS = ["sale", "transfer", "new", "set", "rate", "xtdh"] as const;
const DEEPER = [
  { key: "how", href: "/network/tdh/how-it-works" },
  { key: "spec", href: "/network/tdh/specification" },
  { key: "formal", href: "/network/tdh/formal" },
  { key: "impl", href: "/network/tdh/implementations" },
  { key: "verify", href: "/network/tdh/verification" },
  { key: "consolidation", href: "/network/tdh/consolidation" },
] as const;
/**
 * The six terms needed to read your own TDH, in the order Explain my TDH
 * shows them: what TDH is, raw days, the rate, base TDH, the boost and the
 * final TDH.
 */
const GLOSSARY_ESSENTIAL = [
  "tdh",
  "raw",
  "rate",
  "base",
  "boost",
  "final",
] as const;
/** Every other term the TDH pages use. */
const GLOSSARY_MORE = [
  "memes",
  "snapshot",
  "edition",
  "fullSet",
  "identity",
  "cycle",
  "finalized",
  "firstgm",
  "season",
  "stack",
  "consolidation",
  "sink",
  "registry",
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
const GLOSSARY_TERMS = [...GLOSSARY_ESSENTIAL, ...GLOSSARY_MORE];

function GlossaryList({
  locale,
  terms,
}: {
  readonly locale: SupportedLocale;
  readonly terms: readonly string[];
}) {
  return (
    // One column: each term beside its definition from md, so a long
    // definition never leaves a hole beside a short one.
    <dl className="tw-m-0 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06]">
      {terms.map((term) => (
        <div
          key={term}
          id={`glossary-${term}`}
          className="tw-scroll-mt-28 tw-py-3 first:tw-pt-0 md:tw-grid md:tw-grid-cols-[11rem_minmax(0,1fr)] md:tw-gap-x-6"
        >
          <dt className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-50">
            {t(
              locale,
              `network.tdh.explainer.glossary.${term}.term` as MessageKey
            )}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300 md:tw-mt-0">
            {noBreakTerms(
              t(
                locale,
                `network.tdh.explainer.glossary.${term}.def` as MessageKey
              )
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function TDHHoldingChanges({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <TDHSection id="tdh-changes" title={t(locale, "network.tdh.explainer.faq")}>
      {/* The questions one click away in a single group, so the section is
          a line or two until it is wanted. */}
      <p className={TDH_TEXT}>{t(locale, "network.tdh.explainer.faq.lede")}</p>
      <TdhDisclosure
        className="tw-mt-2"
        summary={t(locale, "network.tdh.explainer.faq.all", {
          count: String(FAQ_KEYS.length),
        })}
      >
        <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-pl-6">
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
      </TdhDisclosure>
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
      <GlossaryList locale={locale} terms={GLOSSARY_ESSENTIAL} />
      <TdhDisclosure
        className="tw-mt-4 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2"
        summary={t(locale, "network.tdh.explainer.glossary.more", {
          count: String(GLOSSARY_TERMS.length),
        })}
      >
        <div className="tw-pb-2 tw-pt-3">
          <GlossaryList locale={locale} terms={GLOSSARY_MORE} />
        </div>
      </TdhDisclosure>
    </TDHSection>
  );
}

/** Cards to the TDH sub-pages (plan §5.2, "Go deeper"): six, in even rows. */
export function TDHGoDeeper({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <TDHSection
      id="tdh-deeper"
      title={t(locale, "network.tdh.explainer.deeper.title")}
    >
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-4 tw-p-0 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        {DEEPER.map(({ key, href }) => (
          <li key={key}>
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
              <span className="tw-col-span-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, `network.tdh.explainer.deeper.${key}.body`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </TDHSection>
  );
}
