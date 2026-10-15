import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MINUTE_EXAMPLE } from "./how-it-works/examples";
import TdhSource from "./shared/TdhSource";
import { TDH_SERIES } from "./shared/tdhStyles";

const STEPS = [
  { key: "hold", refs: ["P26 §4.3", "P26 §7.1"] },
  { key: "weigh", refs: ["P26 §5.3", "P26 §8.1"] },
  { key: "boost", refs: ["P26 §8.3"] },
] as const;

const PANEL =
  "tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 sm:tw-p-5";
const PANEL_LABEL =
  "tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const PANEL_VALUE =
  "tw-m-0 tw-mt-auto tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50";
const GLYPH =
  "tw-flex tw-items-center tw-justify-center tw-text-2xl tw-font-light tw-text-iron-500";
const SVG_TEXT = "tw-fill-iron-300 tw-text-[12px]";

const cents = (locale: SupportedLocale, value: number) =>
  formatNumber(locale, value / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function DaysPanel({ locale }: { readonly locale: SupportedLocale }) {
  const ticks = Array.from(
    { length: MINUTE_EXAMPLE.days },
    (_, index) => index
  );
  return (
    <div className={PANEL}>
      <p className={PANEL_LABEL}>
        {t(locale, "network.tdh.explainer.minute.days")}
      </p>
      <svg
        viewBox="0 0 300 74"
        aria-hidden="true"
        className="tw-block tw-h-auto tw-w-full"
      >
        {ticks.map((tick) => {
          const x = 14 + tick * 2.7 + Math.floor(tick / 10) * 0.6;
          const major = tick % 10 === 0;
          return (
            <rect
              key={tick}
              x={x}
              y={major ? 16 : 22}
              width="1.6"
              height={major ? 26 : 14}
              rx="0.8"
              className={major ? "tw-fill-sky-300" : "tw-fill-sky-400/60"}
            />
          );
        })}
        <circle cx="14" cy="29" r="5.5" className="tw-fill-iron-50" />
        <text x="8" y="64" className={SVG_TEXT}>
          {t(locale, "network.tdh.explainer.minute.bought")}
        </text>
        <text x="296" y="64" textAnchor="end" className={SVG_TEXT}>
          {t(locale, "network.tdh.explainer.minute.today")}
        </text>
      </svg>
      <p className={PANEL_VALUE}>
        {t(locale, "network.tdh.explainer.minute.daysCaption", {
          days: formatInteger(locale, MINUTE_EXAMPLE.days),
        })}
      </p>
    </div>
  );
}

function RatePanel({ locale }: { readonly locale: SupportedLocale }) {
  const perSquare = 50;
  const columns = 6;
  const size = 6;
  const tall = Math.round(MINUTE_EXAMPLE.largestEdition / perSquare);
  const short = Math.round(MINUTE_EXAMPLE.edition / perSquare);
  const squares = (count: number, x0: number, className: string) =>
    Array.from({ length: count }, (_, index) => (
      <rect
        key={index}
        x={x0 + (index % columns) * (size + 3)}
        y={108 - Math.floor(index / columns) * (size + 2)}
        width={size}
        height={size}
        rx="1.2"
        className={className}
      />
    ));
  return (
    <div className={PANEL}>
      <p className={PANEL_LABEL}>
        {t(locale, "network.tdh.explainer.minute.rate")}
      </p>
      <div className="tw-grid tw-grid-cols-2 tw-items-end tw-gap-3">
        <div className="tw-min-w-0">
          <svg
            viewBox="0 0 54 116"
            aria-hidden="true"
            className="tw-block tw-h-24 tw-w-auto"
          >
            {squares(tall, 0, "tw-fill-iron-500")}
          </svg>
          <p className="tw-m-0 tw-mt-2 tw-text-xs tw-leading-4 tw-text-iron-300">
            {t(locale, "network.tdh.explainer.minute.largest", {
              copies: formatInteger(locale, MINUTE_EXAMPLE.largestEdition),
            })}
          </p>
        </div>
        <div className="tw-min-w-0">
          <svg
            viewBox="0 0 54 116"
            aria-hidden="true"
            className="tw-block tw-h-24 tw-w-auto"
          >
            {squares(short, 0, "tw-fill-sky-400")}
          </svg>
          <p className="tw-m-0 tw-mt-2 tw-text-xs tw-leading-4 tw-text-sky-200">
            {t(locale, "network.tdh.explainer.minute.thisCard", {
              copies: formatInteger(locale, MINUTE_EXAMPLE.edition),
            })}
          </p>
        </div>
      </div>
      <p className={`${PANEL_VALUE} tw-font-mono tw-text-base`}>
        {t(locale, "network.tdh.explainer.minute.division", {
          largest: formatInteger(locale, MINUTE_EXAMPLE.largestEdition),
          edition: formatInteger(locale, MINUTE_EXAMPLE.edition),
          rate: cents(locale, MINUTE_EXAMPLE.rateCents),
        })}
      </p>
    </div>
  );
}

function BoostPanel({ locale }: { readonly locale: SupportedLocale }) {
  const ceiling = 224;
  const width = 272;
  const fill = ((MINUTE_EXAMPLE.betaCents - 100) / (ceiling - 100)) * width;
  return (
    <div className={PANEL}>
      <p className={PANEL_LABEL}>
        {t(locale, "network.tdh.explainer.minute.boostLabel")}
      </p>
      <svg
        viewBox="0 0 300 74"
        aria-hidden="true"
        className="tw-block tw-h-auto tw-w-full"
      >
        <rect
          x="14"
          y="18"
          width={width}
          height="14"
          rx="7"
          className="tw-fill-iron-800"
        />
        <rect
          x="14"
          y="18"
          width={Math.max(fill, 7)}
          height="14"
          rx="7"
          className={TDH_SERIES.gradients.fill}
        />
        <text x="14" y="52" className={`${SVG_TEXT} tw-tabular-nums`}>
          {cents(locale, 100)}
        </text>
        <text
          x={14 + width}
          y="52"
          textAnchor="end"
          className={`${SVG_TEXT} tw-tabular-nums`}
        >
          {cents(locale, ceiling)}
        </text>
        <text x="58" y="52" className="tw-fill-fuchsia-200 tw-text-[12px]">
          {t(locale, "network.tdh.explainer.minute.oneGradient")}
        </text>
      </svg>
      <p className={PANEL_VALUE}>× {cents(locale, MINUTE_EXAMPLE.betaCents)}</p>
    </div>
  );
}

/** "TDH in a minute" (plan §5.2, §5.3): three steps, a diagram and one example. */
export default function TDHInAMinute({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const values = {
    days: formatInteger(locale, MINUTE_EXAMPLE.days),
    rate: cents(locale, MINUTE_EXAMPLE.rateCents),
    base: formatInteger(locale, MINUTE_EXAMPLE.base),
    boost: cents(locale, MINUTE_EXAMPLE.betaCents),
    final: formatInteger(locale, MINUTE_EXAMPLE.final),
  };
  return (
    <section
      id="tdh-minute"
      aria-labelledby="tdh-minute-heading"
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 sm:tw-py-10"
    >
      <h2
        id="tdh-minute-heading"
        tabIndex={-1}
        className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 focus:tw-outline-none"
      >
        {t(locale, "network.tdh.explainer.minute.title")}
      </h2>
      <ol className="tw-m-0 tw-mt-6 tw-grid tw-list-none tw-gap-5 tw-p-0 md:tw-grid-cols-3 md:tw-gap-8">
        {STEPS.map((step, index) => (
          <li
            key={step.key}
            className="tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3"
          >
            <span className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-text-primary-300 tw-ring-1 tw-ring-inset tw-ring-primary-400/40">
              {formatInteger(locale, index + 1)}
            </span>
            <p className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-300">
              <strong className="tw-font-semibold tw-text-iron-50">
                {t(locale, `network.tdh.explainer.minute.${step.key}.title`)}
              </strong>{" "}
              {t(locale, `network.tdh.explainer.minute.${step.key}.body`)}
              <TdhSource refs={step.refs} locale={locale} />
            </p>
          </li>
        ))}
      </ol>
      <figure className="tw-m-0 tw-mt-8">
        <div
          role="img"
          aria-label={t(locale, "network.tdh.explainer.minute.diagramDesc")}
          className="tw-grid tw-gap-2 md:tw-grid-cols-[minmax(0,1fr)_1.75rem_minmax(0,1fr)_1.75rem_minmax(0,1fr)]"
        >
          <DaysPanel locale={locale} />
          <span aria-hidden="true" className={GLYPH}>
            ×
          </span>
          <RatePanel locale={locale} />
          <span aria-hidden="true" className={GLYPH}>
            ×
          </span>
          <BoostPanel locale={locale} />
        </div>
        <figcaption className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/15 tw-px-4 tw-py-1.5 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-primary-400/40">
            {t(locale, "network.tdh.explainer.minute.result", {
              final: values.final,
            })}
          </span>
          <span className="tw-text-sm tw-tabular-nums tw-text-iron-400">
            {t(locale, "network.tdh.explainer.minute.textVersion", values)}
          </span>
        </figcaption>
      </figure>
      <div className="tw-mt-6 tw-max-w-3xl tw-space-y-2">
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "network.tdh.explainer.minute.example", values)}
          <TdhSource refs={["P26 §8.2", "P26 §8.4"]} locale={locale} />
        </p>
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "network.tdh.explainer.eligible")}
          <TdhSource refs={["P26 §2"]} locale={locale} />
        </p>
      </div>
    </section>
  );
}
