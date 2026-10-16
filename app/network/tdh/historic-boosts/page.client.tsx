"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import { NETWORK_REFERENCE_SECTION_HEADING_CLASSES } from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import TdhPager from "../shared/TdhPager";
import TdhSourcesNote from "../shared/TdhSourcesNote";
import TdhSubnav from "../shared/TdhSubnav";
import {
  TDH_DROPDOWN_ROW,
  TDH_H1,
  TDH_LEDE,
  TDH_LINK,
  TDH_PAGE,
  TDH_PAGE_HEADER_TOP,
} from "../shared/tdhStyles";
import type { TdhRules } from "../tdh-rules.helpers";
import {
  BoostTimeline,
  CurrentLadder,
  CurrentRuleCard,
  CurrentRuleDetails,
  CurrentRuleRow,
} from "./HistoricBoostsCurrent";
import {
  CURRENT_RULE,
  DETAIL_PANEL_CLASS,
  HISTORIC_RULES,
  MobileSummaryMetric,
  TABLE_CELL_CLASS,
  TABLE_HEADER_CLASS,
  VERSION_LABEL_KEY,
  formatGradientBonus,
  formatMultiplier,
  formatSeasonRange,
  formatShortDate,
  formatVersionLabel,
  m,
  type HistoricRule,
} from "./historicBoostsShared";

/** Schedules 1.1 to 1.3 as 6529.io's TDH pages first archived them. */
const ARCHIVE_SOURCE =
  "https://github.com/6529-Collections/6529seize-frontend/blob/2d92c9536698ea6056f8b47bdcd9a14cd2386bed/app/network/tdh/historic-boosts/page.client.tsx";
/** Schedule 1.4: the backend's rule file at the commit P26 cites. */
const RULES_SOURCE =
  "https://github.com/6529-Collections/6529seize-backend/blob/d0c070cc821ed0211cb6b19b17e27b2a32609ac3/src/tdhLoop/tdh-rules.ts";
/**
 * The same file on the backend's main branch: unchanged from d0c070c through
 * c2f4020 (16 October 2026).
 */
const RULES_CURRENT =
  "https://github.com/6529-Collections/6529seize-backend/blob/main/src/tdhLoop/tdh-rules.ts";

/** The current schedule's id among the rows that open. */
const CURRENT_ID = "boost-schedule-1-4";

export default function TDHHistoricBoostsPage({
  rules = null,
}: {
  /** The current boost rules, read on the server when it could. */
  readonly rules?: TdhRules | null;
}) {
  const locale = useBrowserLocale();
  const [expandedRuleIds, setExpandedRuleIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  useSetTitle("TDH historic boosts | Network");

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
    <main className={TDH_PAGE}>
      <AboutContentsDropdown
        className={TDH_DROPDOWN_ROW}
        currentHref="/network/tdh/historic-boosts"
        desktopFlush
        withDivider
      />
      <article className="tw-mx-auto tw-max-w-6xl tw-pb-8">
        <TdhSubnav current="/network/tdh/historic-boosts" locale={locale} />
        <header className={`tw-pb-8 sm:tw-pb-10 ${TDH_PAGE_HEADER_TOP}`}>
          <h1 className={TDH_H1}>
            {m(locale, "network.tdhHistoric.hero.title")}
          </h1>
          <p className={`tw-mb-0 tw-mt-4 tw-max-w-[38em] ${TDH_LEDE}`}>
            {m(locale, "network.tdhHistoric.hero.intro")}
          </p>
        </header>

        <section
          aria-labelledby="historic-versions-heading"
          className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 sm:tw-py-10 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-10"
        >
          <div className="lg:tw-sticky lg:tw-top-28">
            <h2
              className={NETWORK_REFERENCE_SECTION_HEADING_CLASSES}
              id="historic-versions-heading"
            >
              {m(locale, "network.tdhHistoric.versions.title")}
            </h2>
            <BoostTimeline locale={locale} />
          </div>

          <div className="tw-min-w-0 tw-space-y-4">
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
            <CurrentLadder locale={locale} initialRules={rules} />
            <div className="tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
              <p className="tw-m-0">
                {m(locale, "network.tdhHistoric.provenance")}
              </p>
              {/* The chips and the two source files in the standard closed
                  Sources disclosure, as on every other TDH page. */}
              <TdhSourcesNote
                locale={locale}
                className="tw-mt-3"
                refs={["P26 §10", "DEV-3"]}
                note={
                  <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
                    <li>{m(locale, "network.tdhHistoric.provenance.dev3")}</li>
                    <li>
                      <a
                        href={ARCHIVE_SOURCE}
                        className={TDH_LINK}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {m(locale, "network.tdhHistoric.provenance.archive")}
                      </a>
                    </li>
                    <li>
                      <a
                        href={RULES_SOURCE}
                        className={TDH_LINK}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {m(locale, "network.tdhHistoric.provenance.rules")}
                      </a>{" "}
                      {m(locale, "network.tdhHistoric.provenance.unchanged")}{" "}
                      <a
                        href={RULES_CURRENT}
                        className={TDH_LINK}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {m(locale, "network.tdhHistoric.provenance.current")}
                      </a>
                    </li>
                  </ul>
                }
              />
            </div>
          </div>
        </section>
        <TdhPager current="/network/tdh/historic-boosts" locale={locale} />
      </article>
    </main>
  );
}

/**
 * The current schedule, 1.4 (from October 10, 2025): its full-set boost on
 * the cycle of October 16, 2026 (17 seasons listed, so seasons 1 to 16 pay)
 * and its ceiling once seasons 1 to 20 all pay.
 */
function HistoricRulesTable({
  expandedRuleIds,
  locale,
  onToggle,
}: {
  readonly expandedRuleIds: ReadonlySet<string>;
  readonly locale: SupportedLocale;
  readonly onToggle: (ruleId: string) => void;
}) {
  const currentLabel = m(locale, VERSION_LABEL_KEY, {
    version: CURRENT_RULE.version,
  });
  return (
    <div className="tw-hidden xl:tw-block">
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60">
        <table
          className="tw-m-0 tw-w-full tw-border-collapse tw-border-0"
          aria-label={m(locale, "network.tdhHistoric.table.caption")}
        >
          <thead className="tw-bg-iron-900/80">
            <tr className="tw-border-0">
              <th className={TABLE_HEADER_CLASS} scope="col">
                {m(locale, "network.tdhHistoric.table.version")}
              </th>
              <th className={TABLE_HEADER_CLASS} scope="col">
                {m(locale, "network.tdhHistoric.table.period")}
              </th>
              <th
                className={`${TABLE_HEADER_CLASS} tw-w-36 tw-whitespace-nowrap`}
                scope="col"
              >
                {m(locale, "network.tdhHistoric.table.categoryA")}
              </th>
              <th
                className={`${TABLE_HEADER_CLASS} tw-whitespace-nowrap`}
                scope="col"
              >
                {m(locale, "network.tdhHistoric.table.categoryB")}
              </th>
              <th
                className={`${TABLE_HEADER_CLASS} tw-hidden 2xl:tw-table-cell`}
                scope="col"
              >
                {m(locale, "network.tdhHistoric.table.categoryC")}
              </th>
              <th
                className={`${TABLE_HEADER_CLASS} tw-w-28 tw-text-right`}
                scope="col"
              >
                {m(locale, "network.tdhHistoric.table.details")}
              </th>
            </tr>
          </thead>
          <CurrentRuleRow
            locale={locale}
            toggle={
              <RuleToggleButton
                controlsId={`${CURRENT_ID}-desktop-details`}
                isExpanded={expandedRuleIds.has(CURRENT_ID)}
                locale={locale}
                onToggle={() => onToggle(CURRENT_ID)}
                versionLabel={currentLabel}
              />
            }
            details={
              <tr
                className="tw-border-0 tw-bg-black/20"
                hidden={!expandedRuleIds.has(CURRENT_ID)}
                id={`${CURRENT_ID}-desktop-details`}
              >
                <td className="tw-border-0 tw-p-4 sm:tw-p-6" colSpan={6}>
                  <CurrentRuleDetails locale={locale} />
                </td>
              </tr>
            }
          />
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
                    className={`${TABLE_CELL_CLASS} tw-whitespace-nowrap tw-font-medium tw-text-iron-100`}
                    scope="row"
                  >
                    {versionLabel}
                  </th>
                  <td className={TABLE_CELL_CLASS}>
                    <RulePeriod locale={locale} rule={rule} />
                  </td>
                  <td
                    className={`${TABLE_CELL_CLASS} tw-whitespace-nowrap tw-font-semibold tw-tabular-nums tw-text-iron-50`}
                  >
                    {formatMultiplier(locale, rule.completeSetMultiplier)}
                  </td>
                  <td
                    className={`${TABLE_CELL_CLASS} tw-whitespace-nowrap tw-tabular-nums tw-text-iron-200`}
                  >
                    {formatSeasonRange(locale, rule)}
                  </td>
                  <td
                    className={`${TABLE_CELL_CLASS} tw-hidden tw-whitespace-nowrap tw-tabular-nums tw-text-iron-200 2xl:tw-table-cell`}
                  >
                    {formatGradientBonus(locale)}
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
  const currentLabel = m(locale, VERSION_LABEL_KEY, {
    version: CURRENT_RULE.version,
  });
  return (
    <div className="tw-grid tw-gap-3 md:tw-grid-cols-2 xl:tw-hidden">
      <CurrentRuleCard
        locale={locale}
        toggle={
          <RuleToggleButton
            controlsId={`${CURRENT_ID}-mobile-details`}
            isExpanded={expandedRuleIds.has(CURRENT_ID)}
            locale={locale}
            onToggle={() => onToggle(CURRENT_ID)}
            versionLabel={currentLabel}
          />
        }
        details={
          <div
            className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-p-4"
            hidden={!expandedRuleIds.has(CURRENT_ID)}
            id={`${CURRENT_ID}-mobile-details`}
          >
            <CurrentRuleDetails locale={locale} />
          </div>
        }
      />
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
                <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-100">
                  {versionLabel}
                </span>
                <span className="tw-mt-1 tw-block tw-text-sm tw-leading-5 tw-text-iron-400">
                  <RulePeriod locale={locale} rule={rule} />
                </span>
              </span>
              <span className="tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-400">
                <span className="tw-sr-only min-[400px]:tw-not-sr-only">
                  {m(
                    locale,
                    isExpanded
                      ? "network.tdhHistoric.details.hide"
                      : "network.tdhHistoric.details.show"
                  )}
                </span>
                <ChevronDownIcon
                  aria-hidden="true"
                  className={`tw-size-4 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
                    isExpanded ? "tw-rotate-180" : ""
                  }`}
                />
              </span>
            </button>

            <dl className="tw-m-0 tw-grid tw-grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3">
              <MobileSummaryMetric
                label={m(locale, "network.tdhHistoric.table.categoryA")}
                value={formatMultiplier(locale, rule.completeSetMultiplier)}
                valueClassName="tw-font-semibold tw-text-iron-50"
              />
              <MobileSummaryMetric
                label={m(locale, "network.tdhHistoric.table.categoryB")}
                value={formatSeasonRange(locale, rule)}
              />
              <MobileSummaryMetric
                label={m(locale, "network.tdhHistoric.table.categoryC")}
                value={formatGradientBonus(locale)}
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
      className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none"
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true">
        {m(
          locale,
          isExpanded
            ? "network.tdhHistoric.details.hide"
            : "network.tdhHistoric.details.show"
        )}
      </span>
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
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
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
          <ul className="tw-m-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-600">
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
            <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-5 tw-text-iron-400">
              {m(
                locale,
                "network.tdhHistoric.details.categoryB.appliesToTotal"
              )}
            </p>
          ) : null}
          <ul className="tw-m-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-600">
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
          <ul className="tw-m-0 tw-mt-4 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-600">
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
    <span className="tw-inline-flex tw-flex-wrap tw-gap-x-1">
      <span className="tw-whitespace-nowrap">
        <time dateTime={rule.startDateIso}>
          {formatShortDate(locale, rule.startDate)}
        </time>
        <span> –</span>
      </span>
      <time className="tw-whitespace-nowrap" dateTime={rule.endDateIso}>
        {formatShortDate(locale, rule.endDate)}
      </time>
    </span>
  );
}
