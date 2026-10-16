import Link from "next/link";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import BoostLadder from "../shared/BoostLadder";
import { TDH_LINK } from "../shared/tdhStyles";
import { getTdhBoostLadder } from "../tdh-rules.helpers";
import { useTdhRules } from "../TDHCurrentRules";
import {
  CURRENT_KEY,
  CURRENT_RULE,
  HISTORIC_RULES,
  MobileSummaryMetric,
  TABLE_CELL_CLASS,
  VERSION_LABEL_KEY,
  formatGradientBonus,
  formatMultiplier,
  formatShortDate,
  formatVersionLabel,
  m,
} from "./historicBoostsShared";

/** A bar from 1.00× to the axis maximum, 2.00×. */
function barWidth(value: number): string {
  return `${((value - 1) / (CURRENT_RULE.ceiling - 1)) * 100}%`;
}

/**
 * The full-set boost of each schedule, oldest first, as bars on one axis
 * from 1.00× to 2.00×, ending with the current schedule: its value on the
 * latest cycle, and the dashed reach to its ceiling, each labelled where it
 * is drawn.
 */
export function BoostTimeline({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const ordered = [...HISTORIC_RULES].reverse();
  return (
    <figure className="tw-m-0 tw-mt-5">
      <figcaption className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
        {m(locale, "network.tdhHistoric.timeline.title")}
      </figcaption>
      <ol className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-2.5 tw-p-0">
        {ordered.map((rule) => (
          <li key={rule.id}>
            <p className="tw-m-0 tw-flex tw-justify-between tw-gap-3 tw-text-xs tw-text-iron-200">
              <span>{formatVersionLabel(locale, rule)}</span>
              <span className="tw-tabular-nums tw-text-iron-400">
                {formatShortDate(locale, rule.startDateIso)}
              </span>
            </p>
            <span className="tw-mt-1 tw-flex tw-items-center tw-gap-2">
              <span className="tw-h-2 tw-flex-1 tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
                <span
                  className="tw-block tw-h-full tw-rounded-full tw-bg-iron-400"
                  style={{ width: barWidth(rule.completeSetMultiplier) }}
                />
              </span>
              <span className="tw-w-12 tw-text-right tw-text-xs tw-tabular-nums tw-text-iron-100">
                {formatMultiplier(locale, rule.completeSetMultiplier)}
              </span>
            </span>
          </li>
        ))}
        <li>
          <p className="tw-m-0 tw-flex tw-justify-between tw-gap-3 tw-text-xs tw-text-iron-100">
            <span className="tw-font-medium">
              {m(locale, VERSION_LABEL_KEY, {
                version: CURRENT_RULE.version,
              })}{" "}
              <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-1.5 tw-text-xs tw-text-primary-300">
                {m(locale, CURRENT_KEY)}
              </span>
            </span>
            <span className="tw-tabular-nums tw-text-iron-400">
              {formatShortDate(locale, CURRENT_RULE.startDateIso)}
            </span>
          </p>
          <span className="tw-mt-1 tw-flex tw-items-center tw-gap-2">
            <span className="tw-relative tw-h-2 tw-flex-1 tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
              <span
                className="tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-full tw-border tw-border-dashed tw-border-primary-400/60"
                style={{ width: barWidth(CURRENT_RULE.ceiling) }}
              />
              <span
                className="tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-full tw-bg-primary-400"
                style={{ width: barWidth(CURRENT_RULE.today) }}
              />
            </span>
            <span className="tw-w-12 tw-text-right tw-text-xs tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {formatMultiplier(locale, CURRENT_RULE.today)}
            </span>
          </span>
          <span className="tw-mr-14 tw-mt-1 tw-flex tw-flex-wrap tw-justify-between tw-gap-x-2 tw-text-xs tw-text-iron-400">
            <span className="tw-text-primary-300">
              {m(locale, "network.tdhHistoric.timeline.todayLabel", {
                value: formatMultiplier(locale, CURRENT_RULE.today),
                date: formatShortDate(locale, CURRENT_RULE.valueDateIso),
              })}
            </span>
            <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-right">
              <span
                aria-hidden="true"
                className="tw-h-2 tw-w-4 tw-rounded-full tw-border tw-border-dashed tw-border-primary-400/60"
              />
              {m(locale, "network.tdhHistoric.timeline.reachLabel", {
                value: formatMultiplier(locale, CURRENT_RULE.ceiling),
              })}
            </span>
          </span>
        </li>
      </ol>
      <p
        aria-hidden="true"
        className="tw-m-0 tw-mr-14 tw-mt-2 tw-flex tw-justify-between tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-1 tw-text-xs tw-tabular-nums tw-text-iron-400"
      >
        <span>{formatMultiplier(locale, 1)}</span>
        <span>{formatMultiplier(locale, CURRENT_RULE.ceiling)}</span>
      </p>
      <p className="tw-m-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
        {m(locale, "network.tdhHistoric.timeline.note")}
      </p>
    </figure>
  );
}

/** The current schedule's row, first in the table, linking to its values. */
export function CurrentRuleRow({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <tbody className="tw-border-0">
      <tr className="tw-border-0 tw-bg-primary-500/[0.05]">
        <th
          className={`${TABLE_CELL_CLASS} tw-whitespace-nowrap tw-font-medium tw-text-iron-50`}
          scope="row"
        >
          {m(locale, VERSION_LABEL_KEY, {
            version: CURRENT_RULE.version,
          })}{" "}
          <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-1.5 tw-text-xs tw-font-normal tw-text-primary-300">
            {m(locale, CURRENT_KEY)}
          </span>
        </th>
        <td className={`${TABLE_CELL_CLASS} tw-text-iron-200`}>
          {m(locale, "network.tdhHistoric.current.period", {
            date: formatShortDate(locale, CURRENT_RULE.startDateIso),
          })}
        </td>
        <td
          className={`${TABLE_CELL_CLASS} tw-font-semibold tw-tabular-nums tw-text-iron-50`}
        >
          <span className="tw-block">
            {m(locale, "network.tdhHistoric.current.fullSet", {
              today: formatMultiplier(locale, CURRENT_RULE.today),
              date: formatShortDate(locale, CURRENT_RULE.valueDateIso),
            })}
          </span>
          <span className="tw-mt-0.5 tw-block tw-text-xs tw-font-normal tw-text-iron-400">
            {m(locale, "network.tdhHistoric.current.fullSetReach", {
              ceiling: formatMultiplier(locale, CURRENT_RULE.ceiling),
              max: formatInteger(locale, CURRENT_RULE.maxSeason),
            })}
          </span>
        </td>
        <td className={`${TABLE_CELL_CLASS} tw-tabular-nums tw-text-iron-200`}>
          {m(locale, "network.tdhHistoric.current.seasons", {
            max: formatInteger(locale, CURRENT_RULE.maxSeason),
            paying: formatInteger(locale, CURRENT_RULE.payingSeasons),
          })}
        </td>
        <td
          className={`${TABLE_CELL_CLASS} tw-hidden tw-whitespace-nowrap tw-tabular-nums tw-text-iron-200 2xl:tw-table-cell`}
        >
          {formatGradientBonus(locale, CURRENT_RULE.gradients)}
        </td>
        <td className={`${TABLE_CELL_CLASS} tw-text-right`}>
          <Link
            href="/network/tdh#tdh-1-4"
            className={`${TDH_LINK} tw-whitespace-nowrap tw-text-xs`}
          >
            {m(locale, "network.tdhHistoric.current.link")}
          </Link>
        </td>
      </tr>
    </tbody>
  );
}

/** The current schedule as the first card below xl, linking to its values. */
export function CurrentRuleCard({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <article className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-500/[0.04]">
      <div className="tw-flex tw-min-h-16 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-1 tw-px-4 tw-py-3">
        <span className="tw-min-w-0">
          <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-50">
            {m(locale, VERSION_LABEL_KEY, {
              version: CURRENT_RULE.version,
            })}{" "}
            <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-1.5 tw-text-xs tw-font-normal tw-text-primary-300">
              {m(locale, CURRENT_KEY)}
            </span>
          </span>
          <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
            {m(locale, "network.tdhHistoric.current.period", {
              date: formatShortDate(locale, CURRENT_RULE.startDateIso),
            })}
          </span>
        </span>
        <Link
          href="/network/tdh#tdh-1-4"
          className={`${TDH_LINK} tw-shrink-0 tw-text-xs`}
        >
          {m(locale, "network.tdhHistoric.current.link")}
        </Link>
      </div>
      <dl className="tw-m-0 tw-grid tw-grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3">
        <MobileSummaryMetric
          label={m(locale, "network.tdhHistoric.table.categoryA")}
          value={`${m(locale, "network.tdhHistoric.current.fullSet", {
            today: formatMultiplier(locale, CURRENT_RULE.today),
            date: formatShortDate(locale, CURRENT_RULE.valueDateIso),
          })}; ${m(locale, "network.tdhHistoric.current.fullSetReach", {
            ceiling: formatMultiplier(locale, CURRENT_RULE.ceiling),
            max: formatInteger(locale, CURRENT_RULE.maxSeason),
          })}`}
          valueClassName="tw-font-semibold tw-text-iron-50"
        />
        <MobileSummaryMetric
          label={m(locale, "network.tdhHistoric.table.categoryB")}
          value={m(locale, "network.tdhHistoric.current.seasons", {
            max: formatInteger(locale, CURRENT_RULE.maxSeason),
            paying: formatInteger(locale, CURRENT_RULE.payingSeasons),
          })}
        />
        <MobileSummaryMetric
          label={m(locale, "network.tdhHistoric.table.categoryC")}
          value={formatGradientBonus(locale, CURRENT_RULE.gradients)}
        />
      </dl>
    </article>
  );
}

/**
 * Today’s four boost figures on one scale, from the current rules, as on
 * the overview’s Current boosts: the same picture in both places.
 */
export function CurrentLadder({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const query = useTdhRules();
  if (!query.data) {
    return null;
  }
  const rules = query.data;
  return (
    <BoostLadder
      locale={locale}
      values={getTdhBoostLadder(rules)}
      eligibleMemes={rules.snapshot.eligible_memes_count}
      lastSeason={rules.boost.season_schedule.last_boosted_season}
      gradients={rules.boost.gradients.max_count}
    />
  );
}
