import Link from "next/link";

import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type TdhMessageKey = Extract<MessageKey, `network.tdh.${string}`>;

interface AdditionalSetExample {
  readonly exponent?: number;
  readonly labelKey: TdhMessageKey;
  readonly result: number;
}

const EDITORIAL_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-items-start tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-12";
const PANEL_CLASS =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55";

const ADDITIONAL_SET_EXAMPLES: readonly AdditionalSetExample[] = [
  {
    labelKey: "network.tdh.current.categoryA.firstAdditional",
    result: 0.05,
  },
  {
    exponent: 1,
    labelKey: "network.tdh.current.categoryA.secondAdditional",
    result: 0.032645,
  },
  {
    exponent: 2,
    labelKey: "network.tdh.current.categoryA.thirdAdditional",
    result: 0.021314,
  },
  {
    exponent: 4,
    labelKey: "network.tdh.current.categoryA.fifthAdditional",
    result: 0.009086,
  },
  {
    exponent: 9,
    labelKey: "network.tdh.current.categoryA.tenthAdditional",
    result: 0.001078,
  },
] as const;

const SEASONS = Array.from({ length: 11 }, (_, index) => index + 2);

const m = (
  locale: SupportedLocale,
  key: TdhMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

const formatFixed = (
  locale: SupportedLocale,
  value: number,
  fractionDigits: number
) =>
  formatNumber(locale, value, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const formatMultiplier = (locale: SupportedLocale, value: number) =>
  m(locale, "network.tdh.value.multiplier", {
    value: formatFixed(locale, value, 2),
  });

export default function TDHCurrentRules({
  effectiveDate,
  locale,
}: {
  readonly effectiveDate: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-labelledby="tdh-current-heading"
      className={`${EDITORIAL_GRID_CLASS} tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-8 sm:tw-py-12`}
      id="tdh-1-4"
    >
      <div className="lg:tw-sticky lg:tw-top-28">
        <h2
          className="tw-m-0 tw-text-lg tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-100 focus:tw-outline-none sm:tw-text-xl"
          id="tdh-current-heading"
          tabIndex={-1}
        >
          {m(locale, "network.tdh.current.title", { date: effectiveDate })}
        </h2>
      </div>

      <div className={`${PANEL_CLASS} tw-overflow-hidden tw-p-4 sm:tw-p-6`}>
        <p className="tw-m-0 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-pb-5 tw-text-sm tw-leading-6 tw-text-iron-400">
          {m(locale, "network.tdh.current.intro")}
        </p>

        <CategoryA locale={locale} />
        <CategoryB locale={locale} />
        <CategoryC locale={locale} />
        <RuleActions locale={locale} />
      </div>
    </section>
  );
}

function CategoryA({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section aria-labelledby="tdh-category-a-heading" className="tw-pt-6">
      <CategoryHeading
        id="tdh-category-a-heading"
        title={m(locale, "network.tdh.current.categoryA.title")}
      />

      <ul className="tw-m-0 tw-mt-4 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600">
        <li>
          {m(locale, "network.tdh.current.categoryA.completeSet")}{" "}
          <span className="tw-font-mono tw-font-medium tw-text-[#00f0ff]">
            {formatMultiplier(locale, 1.6)}
          </span>
        </li>
      </ul>

      <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, "network.tdh.current.categoryA.additionalTitle")}
      </p>
      <p
        aria-label={m(locale, "network.tdh.current.categoryA.formulaAria")}
        className="tw-mb-0 tw-mt-4 tw-w-fit tw-max-w-full tw-break-words tw-rounded-md tw-border tw-border-solid tw-border-white/[0.07] tw-bg-black/40 tw-px-4 tw-py-3 tw-font-mono tw-text-xs tw-font-medium tw-leading-6 tw-text-iron-200"
      >
        <span className="tw-font-sans tw-font-normal tw-text-iron-400">
          {m(locale, "network.tdh.current.categoryA.formulaLabel")}{" "}
        </span>
        {formatFixed(locale, 0.05, 2)} &times; ({formatFixed(locale, 0.6529, 4)}
        )<sup>(n-1)</sup>
      </p>

      <div className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/45 tw-p-4">
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
          {m(locale, "network.tdh.current.categoryA.examplesTitle")}
        </p>
        <dl className="tw-mb-0 tw-mt-4 tw-space-y-2.5">
          {ADDITIONAL_SET_EXAMPLES.map((example) => (
            <div
              className="tw-grid tw-grid-cols-1 tw-gap-1 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-gap-4"
              key={example.labelKey}
            >
              <dt className="tw-text-xs tw-leading-5 tw-text-iron-500">
                {m(locale, example.labelKey)}
              </dt>
              <dd className="tw-m-0 tw-break-words tw-font-mono tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300 sm:tw-text-right">
                <AdditionalSetFormula example={example} locale={locale} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, "network.tdh.current.categoryA.maximumTitle")}{" "}
        <span
          aria-label={m(locale, "network.tdh.current.categoryA.maximumAria")}
          className="tw-inline-block tw-break-words tw-rounded tw-border tw-border-solid tw-border-white/[0.06] tw-bg-black/30 tw-px-2 tw-py-1 tw-font-mono tw-text-xs tw-font-medium tw-text-iron-300"
        >
          {formatFixed(locale, 0.6, 2)} + {formatFixed(locale, 0.05, 2)} / (1 -{" "}
          {formatFixed(locale, 0.6529, 4)}) = {formatFixed(locale, 0.744051, 6)}
        </span>
      </p>
    </section>
  );
}

function AdditionalSetFormula({
  example,
  locale,
}: {
  readonly example: AdditionalSetExample;
  readonly locale: SupportedLocale;
}) {
  if (example.exponent === undefined) {
    return formatFixed(locale, example.result, 2);
  }

  return (
    <>
      {formatFixed(locale, 0.05, 2)} &times; {formatFixed(locale, 0.6529, 4)}
      {example.exponent > 1 ? <sup>{example.exponent}</sup> : null} ={" "}
      {formatFixed(locale, example.result, 6)}
    </>
  );
}

function CategoryB({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="tdh-category-b-heading"
      className="tw-mt-8 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-8"
    >
      <CategoryHeading
        id="tdh-category-b-heading"
        title={m(locale, "network.tdh.current.categoryB.title")}
      />
      <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, "network.tdh.current.categoryB.applies")}
      </p>

      <div className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/45 tw-p-4">
        <div className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-pb-4">
          <h4 className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
            {m(locale, "network.tdh.current.categoryB.szn1")}
          </h4>
          <ul className="tw-m-0 tw-mt-3 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-500 marker:tw-text-iron-600">
            <li>
              {m(locale, "network.tdh.current.categoryB.completeSet")}{" "}
              <Multiplier locale={locale} value={1.05} />{" "}
              {m(locale, "network.tdh.current.categoryB.or")}
            </li>
            <li>
              {m(locale, "network.tdh.current.categoryB.genesisSet")}{" "}
              <Multiplier locale={locale} value={1.01} />{" "}
              {m(locale, "network.tdh.current.categoryB.and")}
            </li>
            <li>
              {m(locale, "network.tdh.current.categoryB.nakamotoSet")}{" "}
              <Multiplier locale={locale} value={1.01} />
            </li>
          </ul>
        </div>

        <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-2 tw-gap-x-4 tw-gap-y-3 tw-p-0 sm:tw-grid-cols-3">
          {SEASONS.map((season) => (
            <li
              className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2 tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-500"
              key={season}
            >
              <span>
                {m(locale, "network.tdh.current.categoryB.seasonLabel", {
                  number: formatInteger(locale, season),
                })}
              </span>
              <span className="tw-font-medium tw-text-[#00f0ff]">
                {formatMultiplier(locale, 1.05)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Multiplier({
  locale,
  value,
}: {
  readonly locale: SupportedLocale;
  readonly value: number;
}) {
  return (
    <span className="tw-font-mono tw-font-medium tw-text-[#00f0ff]">
      {formatMultiplier(locale, value)}
    </span>
  );
}

function CategoryC({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="tdh-category-c-heading"
      className="tw-mt-8 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-8"
    >
      <CategoryHeading
        id="tdh-category-c-heading"
        title={m(locale, "network.tdh.current.categoryC.title")}
      />
      <ul className="tw-m-0 tw-mt-4 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600">
        <li>
          {m(locale, "network.tdh.current.categoryC.gradientLead")}{" "}
          <span className="tw-font-mono tw-font-medium tw-text-[#00f0ff]">
            {formatMultiplier(locale, 1.02)}
          </span>{" "}
          {m(locale, "network.tdh.current.categoryC.gradientTail", {
            count: formatInteger(locale, 5),
          })}
        </li>
      </ul>
    </section>
  );
}

function RuleActions({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <nav
      aria-label={m(locale, "network.tdh.related.ruleActionsAria")}
      className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-6"
    >
      <Link
        className="tw-rounded-md tw-border tw-border-solid tw-border-white tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-black tw-no-underline tw-transition-colors hover:tw-bg-iron-200 hover:tw-text-black hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/50 motion-reduce:tw-transition-none"
        href="/network/tdh/historic-boosts"
      >
        {m(locale, "network.tdh.related.historic.title")}
      </Link>
      <Link
        className="tw-rounded-md tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900/60 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-white/[0.12] hover:tw-bg-iron-800 hover:tw-text-iron-50 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/50 motion-reduce:tw-transition-none"
        href="/network/definitions"
      >
        {m(locale, "network.tdh.related.definitions.title")}
      </Link>
    </nav>
  );
}

function CategoryHeading({
  id,
  title,
}: {
  readonly id: string;
  readonly title: string;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <h3
        className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100 sm:tw-text-lg"
        id={id}
      >
        {title}
      </h3>
      <span
        aria-hidden="true"
        className="tw-h-px tw-flex-1 tw-bg-gradient-to-r tw-from-white/10 tw-to-transparent"
      />
    </div>
  );
}
