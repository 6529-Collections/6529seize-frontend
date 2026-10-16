import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MAX_BOOST_CENTS, MINUTE_EXAMPLE } from "./how-it-works/examples";
import TdhSource from "./shared/TdhSource";
import { TDH_FOCUS_RING, TDH_SERIES } from "./shared/tdhStyles";

const STEPS = ["hold", "weigh", "boost"] as const;
const SOURCES = [
  "P26 §4.3",
  "P26 §7.1",
  "P26 §5.3",
  "P26 §8.1",
  "P26 §8.3",
  "P26 §8.4",
] as const;

const PANEL =
  "tw-grid tw-min-w-0 tw-grid-rows-[auto_1fr_auto] tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 sm:tw-p-5";
const PANEL_LABEL =
  "tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const PANEL_VALUE =
  "tw-m-0 tw-text-xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50";
const GLYPH =
  "tw-flex tw-items-center tw-justify-center tw-text-2xl tw-font-light tw-text-iron-500";
const CAPTION = "tw-m-0 tw-text-xs tw-leading-4";

const cents = (locale: SupportedLocale, value: number) =>
  formatNumber(locale, value / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Days: ten groups of ten whole days, from the purchase to the snapshot. */
function DaysPanel({ locale }: { readonly locale: SupportedLocale }) {
  const blocks = Math.ceil(MINUTE_EXAMPLE.days / 10);
  return (
    <div className={PANEL}>
      <p className={PANEL_LABEL}>
        {t(locale, "network.tdh.explainer.minute.days")}
      </p>
      <div className="tw-self-center">
        <div className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-size-3 tw-shrink-0 tw-rounded-full tw-bg-iron-50" />
          <span className="tw-grid tw-flex-1 tw-grid-cols-10 tw-gap-1">
            {Array.from({ length: blocks }, (_, index) => (
              <span
                key={index}
                className={`tw-h-5 tw-rounded-sm ${TDH_SERIES.memes.bg} tw-opacity-80`}
              />
            ))}
          </span>
        </div>
        <p
          className={`${CAPTION} tw-mt-2 tw-flex tw-justify-between tw-gap-2 tw-text-iron-300`}
        >
          <span>{t(locale, "network.tdh.explainer.minute.bought")}</span>
          <span>{t(locale, "network.tdh.explainer.minute.today")}</span>
        </p>
        <p className={`${CAPTION} tw-mt-1 tw-text-center tw-text-iron-400`}>
          {t(locale, "network.tdh.explainer.minute.daysBlocks")}
        </p>
      </div>
      <p className={PANEL_VALUE}>
        {t(locale, "network.tdh.explainer.minute.daysCaption", {
          days: formatInteger(locale, MINUTE_EXAMPLE.days),
        })}
      </p>
    </div>
  );
}

/** Rate: the largest edition and this card's on one shared scale. */
function RatePanel({ locale }: { readonly locale: SupportedLocale }) {
  const share = MINUTE_EXAMPLE.edition / MINUTE_EXAMPLE.largestEdition;
  const bar = (
    label: string,
    copies: number,
    width: number,
    fill: string,
    tone: string
  ) => (
    <div>
      <p
        className={`${CAPTION} tw-flex tw-justify-between tw-gap-2 tw-tabular-nums ${tone}`}
      >
        <span>{label}</span>
        <span>
          {t(locale, "network.tdh.explainer.minute.copies", {
            copies: formatInteger(locale, copies),
          })}
        </span>
      </p>
      <div className="tw-mt-1 tw-h-3 tw-w-full tw-rounded-sm tw-bg-iron-800">
        <div
          className={`tw-h-full tw-rounded-sm ${fill}`}
          style={{ width: `${Math.max(width * 100, 1.5)}%` }}
        />
      </div>
    </div>
  );
  return (
    <div className={PANEL}>
      <p className={PANEL_LABEL}>
        {t(locale, "network.tdh.explainer.minute.rate")}
      </p>
      <div className="tw-flex tw-flex-col tw-justify-center tw-gap-3">
        {bar(
          t(locale, "network.tdh.explainer.minute.largest"),
          MINUTE_EXAMPLE.largestEdition,
          1,
          "tw-bg-iron-500",
          "tw-text-iron-300"
        )}
        {bar(
          t(locale, "network.tdh.explainer.minute.thisCard"),
          MINUTE_EXAMPLE.edition,
          share,
          TDH_SERIES.memes.bg,
          "tw-text-sky-200"
        )}
      </div>
      <p className={PANEL_VALUE}>
        {t(locale, "network.tdh.explainer.minute.division", {
          largest: formatInteger(locale, MINUTE_EXAMPLE.largestEdition),
          edition: formatInteger(locale, MINUTE_EXAMPLE.edition),
          rate: cents(locale, MINUTE_EXAMPLE.rateCents),
        })}
      </p>
    </div>
  );
}

/** Boost: a scale from 1.00 to the highest boost today, marked at 1.02. */
function BoostPanel({ locale }: { readonly locale: SupportedLocale }) {
  const at = (value: number) => ((value - 100) / (MAX_BOOST_CENTS - 100)) * 100;
  const position = at(MINUTE_EXAMPLE.betaCents);
  return (
    <div className={PANEL}>
      <p className={PANEL_LABEL}>
        {t(locale, "network.tdh.explainer.minute.boostLabel")}
      </p>
      <div className="tw-self-center">
        <p className={`${CAPTION} tw-text-fuchsia-200`}>
          {t(locale, "network.tdh.explainer.minute.oneGradient")}{" "}
          <span className="tw-tabular-nums">
            +{cents(locale, MINUTE_EXAMPLE.betaCents - 100)}
          </span>
        </p>
        <div className="tw-relative tw-mt-1.5 tw-h-3 tw-rounded-full tw-bg-iron-800">
          <span
            className={`tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-full ${TDH_SERIES.gradients.bg}`}
            style={{ width: `${Math.max(position, 2.5)}%` }}
          />
          <span
            className="tw-absolute tw-top-1/2 tw-size-4 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-950 tw-bg-fuchsia-300"
            style={{ left: `${Math.max(position, 2.5)}%` }}
          />
        </div>
        <p
          className={`${CAPTION} tw-mt-1.5 tw-flex tw-justify-between tw-gap-2 tw-tabular-nums tw-text-iron-400`}
        >
          <span>{cents(locale, 100)}</span>
          <span>
            {t(locale, "network.tdh.explainer.minute.boostMax", {
              max: cents(locale, MAX_BOOST_CENTS),
            })}
          </span>
        </p>
      </div>
      <p className={PANEL_VALUE}>× {cents(locale, MINUTE_EXAMPLE.betaCents)}</p>
    </div>
  );
}

/** The sources of the minute section, with what P, D, DEV and BUG mean. */
export function TdhSourcesFootnote({
  locale,
  refs,
  legend = true,
}: {
  readonly locale: SupportedLocale;
  readonly refs: readonly string[];
  readonly legend?: boolean;
}) {
  return (
    <div className="tw-mt-6 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 tw-text-sm tw-leading-6 tw-text-iron-300">
      <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1">
        <span className="tw-font-medium tw-text-iron-300">
          {t(locale, "network.tdh.explainer.sources.label")}
        </span>
        <TdhSource refs={refs} locale={locale} />
      </p>
      {legend && (
        <p className="tw-m-0 tw-mt-1 tw-max-w-prose">
          {t(locale, "network.tdh.explainer.sources.legend")}{" "}
          <a
            href="#glossary"
            className={`tw-text-iron-300 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 ${TDH_FOCUS_RING}`}
          >
            {t(locale, "network.tdh.explainer.sources.glossary")}
          </a>
        </p>
      )}
    </div>
  );
}

/** "TDH in a minute": three steps, a diagram, one worked example. */
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
        className="tw-m-0 tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 focus:tw-outline-none min-[360px]:tw-text-2xl"
      >
        {t(locale, "network.tdh.explainer.minute.title")}
      </h2>
      <ol className="tw-m-0 tw-mt-6 tw-grid tw-list-none tw-gap-5 tw-p-0 md:tw-grid-cols-3 md:tw-gap-8">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3"
          >
            <span className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-text-primary-300 tw-ring-1 tw-ring-inset tw-ring-primary-400/40">
              {formatInteger(locale, index + 1)}
            </span>
            <p className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-300">
              <strong className="tw-font-semibold tw-text-iron-50">
                {t(locale, `network.tdh.explainer.minute.${step}.title`)}
              </strong>{" "}
              {t(locale, `network.tdh.explainer.minute.${step}.body`)}
            </p>
          </li>
        ))}
      </ol>
      <figure className="tw-m-0 tw-mt-8">
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
          {t(locale, "network.tdh.explainer.minute.exampleLabel")}
        </p>
        <p className="tw-m-0 tw-mb-3 tw-mt-1 tw-max-w-prose tw-text-[15px] tw-leading-7 tw-text-iron-300">
          {t(locale, "network.tdh.explainer.minute.example")}
        </p>
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
        <figcaption className="tw-mt-4">
          <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/15 tw-px-4 tw-py-1.5 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-primary-400/40">
              {t(locale, "network.tdh.explainer.minute.result", {
                final: values.final,
              })}
            </span>
            <span className="tw-max-w-prose tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-300">
              {t(locale, "network.tdh.explainer.minute.whatMoves", {
                base: values.base,
                fullSetBoost: cents(locale, MINUTE_EXAMPLE.fullSetBetaCents),
                fullSet: formatInteger(locale, MINUTE_EXAMPLE.fullSetFinal),
              })}
            </span>
          </span>
        </figcaption>
      </figure>
      {/* Three short notes side by side from md, under the three panels,
          so the band keeps one measure. */}
      <div className="tw-mt-6 tw-grid tw-gap-x-8 tw-gap-y-2 tw-text-sm tw-leading-6 tw-text-iron-300 md:tw-grid-cols-3">
        <p className="tw-m-0">
          {t(locale, "network.tdh.explainer.minute.resultNote")}
        </p>
        <p className="tw-m-0">
          {t(locale, "network.tdh.explainer.minute.reference")}
        </p>
        <p className="tw-m-0">
          {t(locale, "network.tdh.explainer.minute.snapshot")}{" "}
          {t(locale, "network.tdh.explainer.eligible")}
        </p>
      </div>
      <div className="tw-mt-2">
        <Link
          href="/network/tdh/how-it-works"
          className={`tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline hover:tw-text-primary-400 ${TDH_FOCUS_RING}`}
        >
          {t(locale, "network.tdh.explainer.minute.deeper")}
          <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
        </Link>
      </div>
      <TdhSourcesFootnote locale={locale} refs={SOURCES} />
    </section>
  );
}
