import Link from "next/link";
import type { ReactNode } from "react";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import BoostLadder from "../shared/BoostLadder";
import { t } from "@/i18n/messages";
import { TDH_BUTTON, TDH_LINK } from "../shared/tdhStyles";
import { getTdhBoostLadder, type TdhRules } from "../tdh-rules.helpers";
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

/**
 * A bar from 1.00× to the axis maximum, 2.24×: the scale of the boost
 * ladder below, so a value is the same length in both drawings.
 */
function barWidth(value: number): string {
  return `${((value - 1) / (CURRENT_RULE.axisMax - 1)) * 100}%`;
}

/** A legend swatch: the solid bar or its dashed reach. */
function Swatch({ dashed }: { readonly dashed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`tw-inline-block tw-h-2 tw-w-4 tw-shrink-0 tw-rounded-full ${
        dashed
          ? "tw-border tw-border-dashed tw-border-primary-300/80 tw-bg-primary-400/15"
          : "tw-bg-primary-400"
      }`}
    />
  );
}

/**
 * The full-set boost of each schedule, oldest first, as bars on one axis
 * from 1.00× to 2.24×, ending with the current schedule: its value on the
 * latest cycle and the dashed reach to its ceiling, told apart by a legend.
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
            <p className="tw-m-0 tw-flex tw-justify-between tw-gap-3 tw-text-sm tw-text-iron-200">
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
              <span className="tw-w-12 tw-text-right tw-text-sm tw-tabular-nums tw-text-iron-100">
                {formatMultiplier(locale, rule.completeSetMultiplier)}
              </span>
            </span>
          </li>
        ))}
        <li>
          <p className="tw-m-0 tw-flex tw-justify-between tw-gap-3 tw-text-sm tw-text-iron-100">
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
            {/* The reach to the ceiling drawn on the bar's own track: a
                dashed, lightly filled segment past today's value. */}
            <span className="tw-relative tw-h-3 tw-flex-1 tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
              <span
                className="tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-full tw-border-2 tw-border-dashed tw-border-primary-300/80 tw-bg-primary-400/15"
                style={{ width: barWidth(CURRENT_RULE.ceiling) }}
              />
              <span
                className="tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-full tw-bg-primary-400"
                style={{ width: barWidth(CURRENT_RULE.today) }}
              />
            </span>
            <span className="tw-w-12 tw-text-right tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {formatMultiplier(locale, CURRENT_RULE.today)}
            </span>
          </span>
          <span className="tw-mr-14 tw-mt-1.5 tw-flex tw-flex-col tw-gap-1 tw-text-sm tw-text-iron-300">
            <span className="tw-inline-flex tw-items-center tw-gap-2">
              <Swatch dashed={false} />
              {m(locale, "network.tdhHistoric.timeline.todayLabel", {
                value: formatMultiplier(locale, CURRENT_RULE.today),
                date: formatShortDate(locale, CURRENT_RULE.valueDateIso),
              })}
            </span>
            <span className="tw-inline-flex tw-items-center tw-gap-2">
              <Swatch dashed />
              {m(locale, "network.tdhHistoric.timeline.reachLabel", {
                value: formatMultiplier(locale, CURRENT_RULE.ceiling),
              })}
            </span>
          </span>
        </li>
      </ol>
      <p
        aria-hidden="true"
        className="tw-m-0 tw-mr-14 tw-mt-2 tw-flex tw-justify-between tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-1 tw-text-sm tw-tabular-nums tw-text-iron-400"
      >
        <span>{formatMultiplier(locale, 1)}</span>
        <span>{formatMultiplier(locale, CURRENT_RULE.axisMax)}</span>
      </p>
      <p className="tw-m-0 tw-mt-3 tw-max-w-[38em] tw-text-sm tw-leading-5 tw-text-iron-400">
        {m(locale, "network.tdhHistoric.timeline.note")}
      </p>
    </figure>
  );
}

/** The current schedule's rules in a sentence, and where its values are. */
export function CurrentRuleDetails({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-max-w-[36em] tw-space-y-2 tw-text-sm tw-leading-6 tw-text-iron-300">
      <p className="tw-m-0">{m(locale, "network.tdhHistoric.current.rules")}</p>
      <p className="tw-m-0 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1">
        <Link href="/network/tdh#tdh-1-4" className={TDH_LINK}>
          {m(locale, "network.tdhHistoric.current.link")}
        </Link>
        <Link href="/network/tdh/how-it-works#step-9" className={TDH_LINK}>
          {m(locale, "network.tdhHistoric.current.ruleLink")}
        </Link>
      </p>
    </div>
  );
}

/** The current schedule's row, first in the table, with its rules below. */
export function CurrentRuleRow({
  locale,
  toggle,
  details,
}: {
  readonly locale: SupportedLocale;
  /** The row's show-rules control. */
  readonly toggle: ReactNode;
  /** The row that opens under it. */
  readonly details: ReactNode;
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
            })}
          </span>
          {/* The value today, then its ceiling; the period column already
              says "today", and the chart beside it names the day. */}
          <span className="tw-mt-0.5 tw-block tw-text-[13px] tw-font-normal tw-text-iron-400">
            {m(locale, "network.tdhHistoric.current.fullSetReach", {
              ceiling: formatMultiplier(locale, CURRENT_RULE.ceiling),
              max: formatInteger(locale, CURRENT_RULE.maxSeason),
            })}
          </span>
        </td>
        <td className={`${TABLE_CELL_CLASS} tw-tabular-nums tw-text-iron-200`}>
          <span className="tw-block tw-whitespace-nowrap">
            {m(locale, "network.tdhHistoric.current.seasons", {
              max: formatInteger(locale, CURRENT_RULE.maxSeason),
            })}
          </span>
          <span className="tw-mt-0.5 tw-block tw-text-[13px] tw-text-iron-400">
            {m(locale, "network.tdhHistoric.current.paying", {
              paying: formatInteger(locale, CURRENT_RULE.payingSeasons),
              date: formatUtcDate(locale, CURRENT_RULE.valueDateIso, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
            })}
          </span>
        </td>
        <td
          className={`${TABLE_CELL_CLASS} tw-hidden tw-whitespace-nowrap tw-tabular-nums tw-text-iron-200 2xl:tw-table-cell`}
        >
          {formatGradientBonus(locale, CURRENT_RULE.gradients)}
        </td>
        <td className={`${TABLE_CELL_CLASS} tw-text-right`}>{toggle}</td>
      </tr>
      {details}
    </tbody>
  );
}

/** The current schedule as the first card below xl, with its rules below. */
export function CurrentRuleCard({
  locale,
  toggle,
  details,
}: {
  readonly locale: SupportedLocale;
  readonly toggle: ReactNode;
  readonly details: ReactNode;
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
          <span className="tw-mt-1 tw-block tw-text-sm tw-leading-5 tw-text-iron-400">
            {m(locale, "network.tdhHistoric.current.period", {
              date: formatShortDate(locale, CURRENT_RULE.startDateIso),
            })}
          </span>
        </span>
        {toggle}
      </div>
      <dl className="tw-m-0 tw-grid tw-grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3">
        <MobileSummaryMetric
          label={m(locale, "network.tdhHistoric.table.categoryA")}
          value={m(locale, "network.tdhHistoric.current.fullSet", {
            today: formatMultiplier(locale, CURRENT_RULE.today),
          })}
          sub={m(locale, "network.tdhHistoric.current.fullSetReach", {
            ceiling: formatMultiplier(locale, CURRENT_RULE.ceiling),
            max: formatInteger(locale, CURRENT_RULE.maxSeason),
          })}
          valueClassName="tw-font-semibold tw-text-iron-50"
        />
        <MobileSummaryMetric
          label={m(locale, "network.tdhHistoric.table.categoryB")}
          value={m(locale, "network.tdhHistoric.current.seasons", {
            max: formatInteger(locale, CURRENT_RULE.maxSeason),
          })}
          sub={m(locale, "network.tdhHistoric.current.paying", {
            paying: formatInteger(locale, CURRENT_RULE.payingSeasons),
            date: formatUtcDate(locale, CURRENT_RULE.valueDateIso, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          })}
        />
        <MobileSummaryMetric
          label={m(locale, "network.tdhHistoric.table.categoryC")}
          value={formatGradientBonus(locale, CURRENT_RULE.gradients)}
        />
      </dl>
      {details}
    </article>
  );
}

/**
 * Today’s four boost figures on one scale, from the current rules, as on
 * the overview’s Current boosts: the same picture in both places.
 */
export function CurrentLadder({
  locale,
  initialRules = null,
}: {
  readonly locale: SupportedLocale;
  /** The rules as the server read them, if it could. */
  readonly initialRules?: TdhRules | null;
}) {
  const query = useTdhRules(initialRules);
  if (!query.data) {
    // Hold the ladder's place while the rules load, and say so if they fail,
    // so the panel never vanishes from the page.
    return (
      <div
        aria-live="polite"
        className="tw-flex tw-min-h-[22rem] tw-flex-col tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-5"
      >
        {query.isError ? (
          <>
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "network.tdh.rules.error")}
            </p>
            <button
              type="button"
              className={`${TDH_BUTTON} tw-mt-3 tw-self-start`}
              onClick={() => void query.refetch()}
            >
              {t(locale, "network.tdh.rules.retry")}
            </button>
          </>
        ) : (
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdh.rules.loading")}
          </p>
        )}
      </div>
    );
  }
  const rules = query.data;
  // The cycle the rules' snapshot belongs to: the day after its block.
  const snapshotDay = Math.floor(
    Date.parse(rules.snapshot.block_timestamp) / 86_400_000
  );
  return (
    <BoostLadder
      locale={locale}
      cycle={formatUtcDate(locale, (snapshotDay + 1) * 86_400_000, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}
      values={getTdhBoostLadder(rules)}
      eligibleMemes={rules.snapshot.eligible_memes_count}
      lastSeason={rules.boost.season_schedule.last_boosted_season}
      gradients={rules.boost.gradients.max_count}
    />
  );
}
