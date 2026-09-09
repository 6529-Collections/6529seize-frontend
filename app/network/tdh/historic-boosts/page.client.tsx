"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import NetworkReferenceNavigation from "@/components/network/NetworkReferenceNavigation";
import {
  NETWORK_PAGE_TITLE_CLASSES,
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
  NETWORK_REFERENCE_SECTION_HEADING_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

type HistoricBoostsMessageKey = Extract<
  MessageKey,
  `network.tdhHistoric.${string}`
>;

interface HistoricRule {
  readonly id: string;
  readonly version: string;
  readonly startDate: number;
  readonly startDateIso: string;
  readonly endDate: number;
  readonly endDateIso: string;
  readonly completeSetMultiplier: number;
  readonly maxSeason: number;
  readonly categoryBAppliesToTotal: boolean;
}

const HISTORIC_RULES: readonly HistoricRule[] = [
  {
    id: "tdh-1-3",
    version: "1.3",
    startDate: Date.UTC(2024, 2, 29),
    startDateIso: "2024-03-29",
    endDate: Date.UTC(2025, 9, 9),
    endDateIso: "2025-10-09",
    completeSetMultiplier: 1.55,
    maxSeason: 11,
    categoryBAppliesToTotal: true,
  },
  {
    id: "tdh-1-2",
    version: "1.2",
    startDate: Date.UTC(2023, 11, 30),
    startDateIso: "2023-12-30",
    endDate: Date.UTC(2024, 2, 28),
    endDateIso: "2024-03-28",
    completeSetMultiplier: 1.25,
    maxSeason: 5,
    categoryBAppliesToTotal: false,
  },
  {
    id: "tdh-1-1",
    version: "1.1",
    startDate: Date.UTC(2023, 6, 14),
    startDateIso: "2023-07-14",
    endDate: Date.UTC(2023, 11, 29),
    endDateIso: "2023-12-29",
    completeSetMultiplier: 1.2,
    maxSeason: 4,
    categoryBAppliesToTotal: false,
  },
] as const;

const TABLE_HEADER_CLASS =
  "tw-border-0 tw-px-3 tw-py-3.5 tw-text-left tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 first:tw-pl-4 sm:first:tw-pl-6 last:tw-pr-4 sm:last:tw-pr-6";
const TABLE_CELL_CLASS =
  "tw-border-0 tw-px-3 tw-py-4 tw-text-left tw-text-sm tw-leading-5 tw-text-iron-400 first:tw-pl-4 sm:first:tw-pl-6 last:tw-pr-4 sm:last:tw-pr-6";
const DETAIL_PANEL_CLASS =
  "tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/45 tw-p-4";

const m = (
  locale: SupportedLocale,
  key: HistoricBoostsMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

export default function TDHHistoricBoostsPage() {
  const locale = useBrowserLocale();
  const [expandedRuleIds, setExpandedRuleIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  useSetTitle("TDH Historic Boosts | Network");

  const toggleRule = (ruleId: string) => {
    setExpandedRuleIds((current) => {
      const next = new Set(current);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/tdh/historic-boosts"
          desktopFlush
          withDivider
        />

        <article className="tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <header className="tw-pb-8 sm:tw-pb-10">
            <h1 className={NETWORK_PAGE_TITLE_CLASSES}>
              {m(locale, "network.tdhHistoric.hero.title")}
            </h1>
            <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
              {m(locale, "network.tdhHistoric.hero.intro")}
            </p>
          </header>

          <section
            aria-labelledby="historic-versions-heading"
            className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-8 sm:tw-py-12 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-12"
          >
            <div className="lg:tw-sticky lg:tw-top-28">
              <h2
                className={NETWORK_REFERENCE_SECTION_HEADING_CLASSES}
                id="historic-versions-heading"
              >
                {m(locale, "network.tdhHistoric.versions.title")}
              </h2>
            </div>

            <div className="tw-min-w-0">
              <HistoricRulesTable
                expandedRuleIds={expandedRuleIds}
                locale={locale}
                onToggle={toggleRule}
              />
              <HistoricRulesMobileCards
                expandedRuleIds={expandedRuleIds}
                locale={locale}
                onToggle={toggleRule}
              />
            </div>
          </section>

          <NetworkReferenceNavigation
            currentHref="/network/tdh/historic-boosts"
            locale={locale}
          />
        </article>
      </div>
    </main>
  );
}

function HistoricRulesTable({
  expandedRuleIds,
  locale,
  onToggle,
}: {
  readonly expandedRuleIds: ReadonlySet<string>;
  readonly locale: SupportedLocale;
  readonly onToggle: (ruleId: string) => void;
}) {
  return (
    <div className="tw-hidden md:tw-block">
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60">
        <table className="tw-m-0 tw-w-full tw-border-collapse tw-border-0">
          <caption className="tw-sr-only">
            {m(locale, "network.tdhHistoric.table.caption")}
          </caption>
          <thead className="tw-bg-iron-900/80">
            <tr className="tw-border-0">
              <th className={TABLE_HEADER_CLASS} scope="col">
                {m(locale, "network.tdhHistoric.table.version")}
              </th>
              <th className={TABLE_HEADER_CLASS} scope="col">
                {m(locale, "network.tdhHistoric.table.period")}
              </th>
              <th className={TABLE_HEADER_CLASS} scope="col">
                {m(locale, "network.tdhHistoric.table.categoryA")}
              </th>
              <th className={TABLE_HEADER_CLASS} scope="col">
                {m(locale, "network.tdhHistoric.table.categoryB")}
              </th>
              <th
                className={`${TABLE_HEADER_CLASS} tw-hidden lg:tw-table-cell`}
                scope="col"
              >
                {m(locale, "network.tdhHistoric.table.categoryC")}
              </th>
              <th className={`${TABLE_HEADER_CLASS} tw-w-14`} scope="col">
                <span className="tw-sr-only">
                  {m(locale, "network.tdhHistoric.table.details")}
                </span>
              </th>
            </tr>
          </thead>
          {HISTORIC_RULES.map((rule, index) => {
            const isExpanded = expandedRuleIds.has(rule.id);
            const detailsId = `${rule.id}-desktop-details`;
            const versionLabel = formatVersionLabel(locale, rule);

            return (
              <tbody
                className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.04]"
                key={rule.id}
              >
                <tr
                  className={`tw-border-0 tw-transition-colors tw-duration-200 tw-ease-out hover:tw-bg-white/[0.04] motion-reduce:tw-transition-none ${
                    index % 2 === 0
                      ? "tw-bg-white/[0.015]"
                      : "tw-bg-transparent"
                  }`}
                >
                  <th
                    className={`${TABLE_CELL_CLASS} tw-whitespace-nowrap tw-font-mono tw-font-medium tw-text-iron-100`}
                    scope="row"
                  >
                    {versionLabel}
                  </th>
                  <td className={TABLE_CELL_CLASS}>
                    <RulePeriod locale={locale} rule={rule} />
                  </td>
                  <td
                    className={`${TABLE_CELL_CLASS} tw-whitespace-nowrap tw-font-mono tw-tabular-nums tw-text-[#00f0ff]`}
                  >
                    {formatMultiplier(locale, rule.completeSetMultiplier)}
                  </td>
                  <td
                    className={`${TABLE_CELL_CLASS} tw-whitespace-nowrap tw-font-mono tw-tabular-nums`}
                  >
                    {formatSeasonRange(locale, rule)}
                  </td>
                  <td
                    className={`${TABLE_CELL_CLASS} tw-hidden tw-whitespace-nowrap tw-font-mono tw-tabular-nums lg:tw-table-cell`}
                  >
                    {formatMultiplier(locale, 1.02)}
                  </td>
                  <td className={`${TABLE_CELL_CLASS} tw-text-right`}>
                    <RuleToggleButton
                      controlsId={detailsId}
                      isExpanded={isExpanded}
                      locale={locale}
                      onToggle={() => onToggle(rule.id)}
                      versionLabel={versionLabel}
                    />
                  </td>
                </tr>
                <tr
                  className="tw-border-0 tw-bg-black/20"
                  hidden={!isExpanded}
                  id={detailsId}
                >
                  <td className="tw-border-0 tw-p-4 sm:tw-p-6" colSpan={6}>
                    <HistoricRuleDetails
                      idPrefix={`${rule.id}-desktop`}
                      locale={locale}
                      rule={rule}
                    />
                  </td>
                </tr>
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}

function HistoricRulesMobileCards({
  expandedRuleIds,
  locale,
  onToggle,
}: {
  readonly expandedRuleIds: ReadonlySet<string>;
  readonly locale: SupportedLocale;
  readonly onToggle: (ruleId: string) => void;
}) {
  return (
    <div className="tw-space-y-3 md:tw-hidden">
      {HISTORIC_RULES.map((rule) => {
        const isExpanded = expandedRuleIds.has(rule.id);
        const detailsId = `${rule.id}-mobile-details`;
        const versionLabel = formatVersionLabel(locale, rule);

        return (
          <article
            className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60"
            key={rule.id}
          >
            <button
              aria-controls={detailsId}
              aria-expanded={isExpanded}
              className="tw-flex tw-min-h-16 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-bg-transparent tw-px-4 tw-py-3 tw-text-left focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
              onClick={() => onToggle(rule.id)}
              type="button"
            >
              <span className="tw-min-w-0">
                <span className="tw-block tw-font-mono tw-text-sm tw-font-medium tw-text-iron-100">
                  {versionLabel}
                </span>
                <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                  <RulePeriod locale={locale} rule={rule} />
                </span>
              </span>
              <span className="tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-400">
                {m(
                  locale,
                  isExpanded
                    ? "network.tdhHistoric.details.hide"
                    : "network.tdhHistoric.details.show"
                )}
                <ChevronDownIcon
                  aria-hidden="true"
                  className={`tw-size-4 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
                    isExpanded ? "tw-rotate-180" : ""
                  }`}
                />
              </span>
            </button>

            <dl className="tw-m-0 tw-grid tw-grid-cols-3 tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3">
              <MobileSummaryMetric
                label={m(locale, "network.tdhHistoric.table.categoryA")}
                value={formatMultiplier(locale, rule.completeSetMultiplier)}
                valueClassName="tw-text-[#00f0ff]"
              />
              <MobileSummaryMetric
                label={m(locale, "network.tdhHistoric.table.categoryB")}
                value={formatSeasonRange(locale, rule)}
              />
              <MobileSummaryMetric
                label={m(locale, "network.tdhHistoric.table.categoryC")}
                value={formatMultiplier(locale, 1.02)}
              />
            </dl>

            <div
              className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-p-4"
              hidden={!isExpanded}
              id={detailsId}
            >
              <HistoricRuleDetails
                idPrefix={`${rule.id}-mobile`}
                locale={locale}
                rule={rule}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MobileSummaryMetric({
  label,
  value,
  valueClassName = "tw-text-iron-300",
}: {
  readonly label: string;
  readonly value: string;
  readonly valueClassName?: string;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className="tw-text-[10px] tw-font-medium tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-400">
        {label}
      </dt>
      <dd
        className={`tw-m-0 tw-mt-1 tw-truncate tw-font-mono tw-text-xs tw-font-medium tw-tabular-nums tw-leading-5 ${valueClassName}`}
      >
        {value}
      </dd>
    </div>
  );
}

function RuleToggleButton({
  controlsId,
  isExpanded,
  locale,
  onToggle,
  versionLabel,
}: {
  readonly controlsId: string;
  readonly isExpanded: boolean;
  readonly locale: SupportedLocale;
  readonly onToggle: () => void;
  readonly versionLabel: string;
}) {
  return (
    <button
      aria-controls={controlsId}
      aria-expanded={isExpanded}
      aria-label={m(
        locale,
        isExpanded
          ? "network.tdhHistoric.details.hideForVersion"
          : "network.tdhHistoric.details.showForVersion",
        { version: versionLabel }
      )}
      className="tw-inline-flex tw-size-11 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900/60 tw-text-iron-400 tw-transition-colors hover:tw-border-white/[0.12] hover:tw-bg-iron-800 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none"
      onClick={onToggle}
      type="button"
    >
      <ChevronDownIcon
        aria-hidden="true"
        className={`tw-size-4 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
          isExpanded ? "tw-rotate-180" : ""
        }`}
      />
    </button>
  );
}

function HistoricRuleDetails({
  idPrefix,
  locale,
  rule,
}: {
  readonly idPrefix: string;
  readonly locale: SupportedLocale;
  readonly rule: HistoricRule;
}) {
  return (
    <>
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(
          locale,
          rule.version === "1.2"
            ? "network.tdhHistoric.details.combinationLowercase"
            : "network.tdhHistoric.details.combination"
        )}
      </p>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 xl:tw-grid-cols-3">
        <section
          aria-labelledby={`${idPrefix}-category-a-heading`}
          className={DETAIL_PANEL_CLASS}
        >
          <RuleCategoryHeading
            id={`${idPrefix}-category-a-heading`}
            title={m(locale, "network.tdhHistoric.details.categoryA.title")}
          />
          <ul className="tw-m-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600">
            <li>
              {m(locale, "network.tdhHistoric.details.categoryA.completeSet")}{" "}
              <Multiplier locale={locale} value={rule.completeSetMultiplier} />
            </li>
            <li>
              {m(locale, "network.tdhHistoric.details.categoryA.additionalSet")}{" "}
              <Multiplier locale={locale} value={1.02} />
              {m(
                locale,
                "network.tdhHistoric.details.categoryA.additionalSetMaximum",
                { count: formatInteger(locale, 2) }
              )}
            </li>
          </ul>
        </section>

        <section
          aria-labelledby={`${idPrefix}-category-b-heading`}
          className={DETAIL_PANEL_CLASS}
        >
          <RuleCategoryHeading
            id={`${idPrefix}-category-b-heading`}
            title={m(locale, "network.tdhHistoric.details.categoryB.title")}
          />
          {rule.categoryBAppliesToTotal ? (
            <p className="tw-mb-0 tw-mt-4 tw-text-xs tw-leading-5 tw-text-iron-400">
              {m(
                locale,
                "network.tdhHistoric.details.categoryB.appliesToTotal"
              )}
            </p>
          ) : null}
          <ul className="tw-m-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600">
            <li>
              {m(locale, "network.tdhHistoric.details.categoryB.szn1")}
              <ul className="tw-m-0 tw-mt-2 tw-space-y-1.5 tw-pl-4 tw-text-iron-400 marker:tw-text-iron-700">
                <li>
                  {m(
                    locale,
                    "network.tdhHistoric.details.categoryB.completeSet"
                  )}{" "}
                  <Multiplier locale={locale} value={1.05} />{" "}
                  {m(locale, "network.tdhHistoric.details.categoryB.or")}
                </li>
                <li>
                  {m(
                    locale,
                    "network.tdhHistoric.details.categoryB.genesisSet"
                  )}{" "}
                  <Multiplier locale={locale} value={1.01} />{" "}
                  {m(locale, "network.tdhHistoric.details.categoryB.and")}
                </li>
                <li>
                  {m(
                    locale,
                    "network.tdhHistoric.details.categoryB.nakamotoSet"
                  )}{" "}
                  <Multiplier locale={locale} value={1.01} />
                </li>
              </ul>
            </li>
            <li>
              {Array.from(
                { length: rule.maxSeason - 1 },
                (_, index) => index + 2
              ).map((season) => (
                <span className="tw-block" key={season}>
                  {m(locale, "network.tdhHistoric.details.categoryB.season", {
                    season: formatInteger(locale, season),
                  })}{" "}
                  <Multiplier locale={locale} value={1.05} />
                </span>
              ))}
            </li>
          </ul>
        </section>

        <section
          aria-labelledby={`${idPrefix}-category-c-heading`}
          className={DETAIL_PANEL_CLASS}
        >
          <RuleCategoryHeading
            id={`${idPrefix}-category-c-heading`}
            title={m(locale, "network.tdhHistoric.details.categoryC.title")}
          />
          <ul className="tw-m-0 tw-mt-4 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600">
            <li>
              {m(locale, "network.tdhHistoric.details.categoryC.gradient")}{" "}
              <Multiplier locale={locale} value={1.02} />{" "}
              {m(locale, "network.tdhHistoric.details.categoryC.maximum", {
                count: formatInteger(locale, 3),
              })}
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}

function RuleCategoryHeading({
  id,
  title,
}: {
  readonly id: string;
  readonly title: string;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <h3
        className="tw-m-0 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100"
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

function Multiplier({
  locale,
  value,
}: {
  readonly locale: SupportedLocale;
  readonly value: number;
}) {
  return (
    <span className="tw-whitespace-nowrap tw-font-mono tw-font-medium tw-tabular-nums tw-text-[#00f0ff]">
      {formatMultiplier(locale, value)}
    </span>
  );
}

function RulePeriod({
  locale,
  rule,
}: {
  readonly locale: SupportedLocale;
  readonly rule: HistoricRule;
}) {
  return (
    <span className="tw-whitespace-normal md:tw-whitespace-nowrap">
      <time dateTime={rule.startDateIso}>
        {formatLongDate(locale, rule.startDate)}
      </time>
      <span> — </span>
      <time dateTime={rule.endDateIso}>
        {formatLongDate(locale, rule.endDate)}
      </time>
    </span>
  );
}

function formatLongDate(locale: SupportedLocale, date: number): string {
  return formatDate(locale, date, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatVersionLabel(
  locale: SupportedLocale,
  rule: HistoricRule
): string {
  return m(locale, "network.tdhHistoric.versionLabel", {
    version: rule.version,
  });
}

function formatSeasonRange(
  locale: SupportedLocale,
  rule: HistoricRule
): string {
  return m(locale, "network.tdhHistoric.table.seasonRange", {
    maxSeason: formatInteger(locale, rule.maxSeason),
  });
}

function formatMultiplier(locale: SupportedLocale, value: number): string {
  return t(locale, "network.tdh.value.multiplier", {
    value: formatNumber(locale, value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
}
