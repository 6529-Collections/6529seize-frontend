import type { SupportedLocale } from "@/i18n/locales";
import { formatInteger, formatNumber } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";

type TdhMessageKey = Extract<MessageKey, `network.tdh.${string}`>;

interface AdditionalSetExample {
  readonly exponent?: number;
  readonly labelKey: TdhMessageKey;
  readonly result: number;
}

const PANEL_CLASS =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60";

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
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-10 sm:tw-py-14"
      id="tdh-1-4"
    >
      <header className="tw-max-w-3xl">
        <div className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-primary-400/25 tw-bg-primary-500/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
          <span
            aria-hidden="true"
            className="tw-size-1.5 tw-rounded-full tw-bg-primary-300"
          />
          {m(locale, "network.tdh.current.status")}
        </div>
        <h2
          className="tw-mb-0 tw-mt-4 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl"
          id="tdh-current-heading"
        >
          {m(locale, "network.tdh.current.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-500">
          {m(locale, "network.tdh.current.effective", {
            date: effectiveDate,
          })}
        </p>
        <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          {m(locale, "network.tdh.current.intro")}
        </p>
      </header>

      <RuleMap locale={locale} />

      <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-5 lg:tw-grid-cols-2">
        <CategoryA locale={locale} />
        <CategoryB locale={locale} />
      </div>
      <CategoryC locale={locale} />
    </section>
  );
}

function RuleMap({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div
      aria-labelledby="tdh-rule-map-heading"
      className={`${PANEL_CLASS} tw-mt-6 tw-p-4 sm:tw-p-6`}
    >
      <h3
        className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-300"
        id="tdh-rule-map-heading"
      >
        {m(locale, "network.tdh.current.map.title")}
      </h3>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-items-stretch tw-gap-3 md:tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:tw-gap-4">
        <RuleMapCard
          label={m(locale, "network.tdh.current.map.categoryA")}
          value={m(locale, "network.tdh.current.map.categoryAValue")}
        />
        <div className="tw-flex tw-items-center tw-justify-center">
          <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            {m(locale, "network.tdh.current.map.or")}
          </span>
        </div>
        <RuleMapCard
          label={m(locale, "network.tdh.current.map.categoryB")}
          value={m(locale, "network.tdh.current.map.categoryBValue")}
        />
      </div>

      <div className="tw-flex tw-flex-col tw-items-center tw-py-3">
        <span className="tw-h-5 tw-w-px tw-bg-iron-700" />
        <span className="tw-rounded-full tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-400">
          {m(locale, "network.tdh.current.map.higher")}
        </span>
        <span className="tw-h-5 tw-w-px tw-bg-iron-700" />
      </div>

      <div className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/25 tw-bg-primary-500/10 tw-p-4 sm:tw-flex sm:tw-items-center sm:tw-justify-between sm:tw-gap-6">
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
            {m(locale, "network.tdh.current.map.then")}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-base tw-font-medium tw-text-iron-100">
            {m(locale, "network.tdh.current.map.categoryC")}
          </p>
        </div>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400 sm:tw-mt-0 sm:tw-max-w-md sm:tw-text-right">
          {m(locale, "network.tdh.current.map.categoryCValue")}
        </p>
      </div>
    </div>
  );
}

function RuleMapCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-black/25 tw-p-4">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
        {label}
      </p>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-200">
        {value}
      </p>
    </div>
  );
}

function CategoryA({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="tdh-category-a-heading"
      className={`${PANEL_CLASS} tw-p-5 sm:tw-p-6`}
    >
      <CategoryHeading
        id="tdh-category-a-heading"
        label={m(locale, "network.tdh.current.categoryA.label")}
        title={m(locale, "network.tdh.current.categoryA.title")}
      />

      <div className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-black/25 tw-p-4 sm:tw-flex sm:tw-items-center sm:tw-justify-between sm:tw-gap-5">
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {m(locale, "network.tdh.current.categoryA.completeSet")}
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-shrink-0 tw-font-mono tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-mt-0">
          {formatMultiplier(locale, 1.6)}
        </p>
      </div>

      <div className="tw-mt-6">
        <h4 className="tw-m-0 tw-text-base tw-font-medium tw-text-iron-100">
          {m(locale, "network.tdh.current.categoryA.additionalTitle")}
        </h4>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {m(locale, "network.tdh.current.categoryA.additionalIntro")}
        </p>
        <p
          aria-label={m(locale, "network.tdh.current.categoryA.formulaAria")}
          className="tw-mb-0 tw-mt-4 tw-break-words tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900/60 tw-p-4 tw-font-mono tw-text-sm tw-font-medium tw-leading-7 tw-text-iron-100"
        >
          {formatFixed(locale, 0.05, 2)} &times; (
          {formatFixed(locale, 0.6529, 4)})<sup>(n&minus;1)</sup>
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
          {m(locale, "network.tdh.current.categoryA.formulaNote")}
        </p>
      </div>

      <div className="tw-mt-6">
        <h4 className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
          {m(locale, "network.tdh.current.categoryA.examplesTitle")}
        </h4>
        <dl className="tw-mb-0 tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
          {ADDITIONAL_SET_EXAMPLES.map((example) => (
            <div
              className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-black/20 tw-p-3"
              key={example.labelKey}
            >
              <dt className="tw-text-xs tw-leading-5 tw-text-iron-500">
                {m(locale, example.labelKey)}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-break-words tw-font-mono tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-200">
                <AdditionalSetFormula example={example} locale={locale} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="tw-mt-6 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-5">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
          {m(locale, "network.tdh.current.categoryA.maximumTitle")}
        </p>
        <p
          aria-label={m(locale, "network.tdh.current.categoryA.maximumAria")}
          className="tw-mb-0 tw-mt-2 tw-break-words tw-font-mono tw-text-xs tw-font-medium tw-leading-6 tw-text-iron-300"
        >
          {formatFixed(locale, 0.6, 2)} + {formatFixed(locale, 0.05, 2)} / (1
          &minus; {formatFixed(locale, 0.6529, 4)}) ={" "}
          {formatFixed(locale, 0.744051, 6)}
        </p>
      </div>
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
      className={`${PANEL_CLASS} tw-p-5 sm:tw-p-6`}
    >
      <CategoryHeading
        id="tdh-category-b-heading"
        label={m(locale, "network.tdh.current.categoryB.label")}
        title={m(locale, "network.tdh.current.categoryB.title")}
      />
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, "network.tdh.current.categoryB.applies")}
      </p>

      <div className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-black/25 tw-p-4">
        <h4 className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
          {m(locale, "network.tdh.current.categoryB.szn1")}
        </h4>
        <div className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:tw-items-center">
          <SetChoice
            label={m(locale, "network.tdh.current.categoryB.completeSet")}
            value={formatMultiplier(locale, 1.05)}
          />
          <p className="tw-m-0 tw-text-center tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            {m(locale, "network.tdh.current.categoryB.or")}
          </p>
          <div className="tw-rounded-lg tw-bg-iron-900/70 tw-p-3">
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {m(locale, "network.tdh.current.categoryB.genesisSet")}{" "}
              <span className="tw-font-mono tw-font-medium tw-text-iron-100">
                {formatMultiplier(locale, 1.01)}
              </span>
            </p>
            <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
              {m(locale, "network.tdh.current.categoryB.nakamotoSet")}{" "}
              <span className="tw-font-mono tw-font-medium tw-text-iron-100">
                {formatMultiplier(locale, 1.01)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="tw-mt-6">
        <h4 className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
          {m(locale, "network.tdh.current.categoryB.remainingTitle")}
        </h4>
        <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-2 tw-gap-2 tw-p-0 sm:tw-grid-cols-3">
          {SEASONS.map((season) => (
            <li
              className="tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-black/20 tw-px-3 tw-py-2"
              key={season}
            >
              <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                {m(locale, "network.tdh.current.categoryB.seasonLabel", {
                  number: formatInteger(locale, season),
                })}
              </span>
              <span className="tw-font-mono tw-text-xs tw-font-medium tw-text-iron-100">
                {formatMultiplier(locale, 1.05)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SetChoice({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-rounded-lg tw-bg-iron-900/70 tw-p-3">
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">{label}</p>
      <p className="tw-mb-0 tw-mt-1 tw-font-mono tw-text-base tw-font-medium tw-text-iron-100">
        {value}
      </p>
    </div>
  );
}

function CategoryC({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="tdh-category-c-heading"
      className={`${PANEL_CLASS} tw-mt-5 tw-p-5 sm:tw-p-6`}
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-center md:tw-gap-8">
        <div>
          <CategoryHeading
            id="tdh-category-c-heading"
            label={m(locale, "network.tdh.current.categoryC.label")}
            title={m(locale, "network.tdh.current.categoryC.title")}
          />
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m(locale, "network.tdh.current.categoryC.limit", {
              count: formatInteger(locale, 5),
            })}
          </p>
        </div>
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/25 tw-bg-primary-500/10 tw-px-5 tw-py-4 md:tw-text-right">
          <p className="tw-m-0 tw-font-mono tw-text-xl tw-font-semibold tw-text-iron-50">
            {formatMultiplier(locale, 1.02)}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
            {m(locale, "network.tdh.current.categoryC.perGradient")}
          </p>
        </div>
      </div>
    </section>
  );
}

function CategoryHeading({
  id,
  label,
  title,
}: {
  readonly id: string;
  readonly label: string;
  readonly title: string;
}) {
  return (
    <header>
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
        {label}
      </p>
      <h3
        className="tw-mb-0 tw-mt-2 tw-text-lg tw-font-medium tw-leading-7 tw-text-iron-100"
        id={id}
      >
        {title}
      </h3>
    </header>
  );
}
