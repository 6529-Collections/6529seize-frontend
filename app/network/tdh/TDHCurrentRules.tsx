"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { ApiTdhRules } from "@/generated/models/ApiTdhRules";
import {
  formatDate,
  formatInteger,
  formatList,
  formatNumber,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import BoostLadder from "./shared/BoostLadder";
import TdhDisclosure from "./shared/TdhDisclosure";
import TDHSection, { TDH_PANEL, TDH_TEXT } from "./TDHSection";
import {
  getTdhBoostLadder,
  tdhRulesSchema,
  type TdhRules,
} from "./tdh-rules.helpers";

/**
 * The cycle a snapshot belongs to: the day after its block, whose 00:00 UTC
 * closes it, as the daily comparison names it.
 */
function cycleDateOf(blockTimestamp: string): number {
  const day = Math.floor(Date.parse(blockTimestamp) / 86_400_000);
  return (day + 1) * 86_400_000;
}

const formatBonus = (locale: SupportedLocale, value: number) =>
  formatNumber(locale, value, { maximumFractionDigits: 6 });
const formatMultiplier = (locale: SupportedLocale, value: number) =>
  formatNumber(locale, value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * The current TDH rules from the API, shared by every page that shows them.
 * A page that read them on the server passes them in, so they render at once
 * and a failed refresh in the browser keeps them on screen.
 */
export function useTdhRules(initialRules: TdhRules | null = null) {
  return useQuery({
    queryKey: [QueryKey.TDH_RULES],
    queryFn: async ({ signal }) =>
      tdhRulesSchema.parse(
        await commonApiFetch<ApiTdhRules>({
          endpoint: "tdh/rules",
          signal,
          errorMode: "structured",
          includeWalletAuth: false,
        })
      ),
    ...(initialRules ? { initialData: initialRules } : {}),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export default function TDHCurrentRules({
  locale,
  initialRules = null,
}: {
  readonly locale: SupportedLocale;
  /** The rules as the server read them, if it could. */
  readonly initialRules?: TdhRules | null;
}) {
  const query = useTdhRules(initialRules);
  return (
    <TDHSection
      id="tdh-1-4"
      title={t(locale, "network.tdh.rules.title")}
      description={t(locale, "network.tdh.rules.intro")}
    >
      <div aria-live="polite">
        {query.isPending && (
          <p className={`${TDH_PANEL} ${TDH_TEXT} tw-p-5`}>
            {t(locale, "network.tdh.rules.loading")}
          </p>
        )}
        {query.isError && !query.data && (
          <div className={`${TDH_PANEL} tw-p-5`}>
            <p className={TDH_TEXT}>{t(locale, "network.tdh.rules.error")}</p>
            <Button
              variant="tertiary"
              size="sm"
              className="tw-mt-3"
              loading={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t(locale, "network.tdh.rules.retry")}
            </Button>
          </div>
        )}
      </div>
      {query.data && <Rules rules={query.data} locale={locale} />}
      <nav
        aria-label={t(locale, "network.tdh.rules.links")}
        className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-3"
      >
        <ButtonLink
          variant="tertiary"
          size="lg"
          href="/network/tdh/historic-boosts"
        >
          {t(locale, "network.tdh.related.historic.title")}
        </ButtonLink>
        <ButtonLink variant="tertiary" size="lg" href="/network/definitions">
          {t(locale, "network.tdh.related.definitions.title")}
        </ButtonLink>
      </nav>
    </TDHSection>
  );
}

/**
 * Consecutive seasons with the same bonus, as ranges: 1–16 at +0.05.
 *
 * @api Exported for its unit test.
 */
export function seasonRanges(
  seasons: readonly { readonly season: number; readonly bonus: number }[]
): { readonly from: number; readonly to: number; readonly bonus: number }[] {
  const sorted = [...seasons].sort((left, right) => left.season - right.season);
  const ranges: { from: number; to: number; bonus: number }[] = [];
  for (const { season, bonus } of sorted) {
    const last = ranges.at(-1);
    if (last && last.to + 1 === season && last.bonus === bonus) {
      last.to = season;
    } else {
      ranges.push({ from: season, to: season, bonus });
    }
  }
  return ranges;
}

const STAT =
  "tw-flex tw-min-w-0 tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4";
const STAT_LABEL =
  "tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const STAT_VALUE =
  "tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50";
const STAT_NOTE = "tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300";
const CHIP =
  "tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-sm tw-tabular-nums tw-text-iron-100";

function Rules({
  rules,
  locale,
}: {
  readonly rules: TdhRules;
  readonly locale: SupportedLocale;
}) {
  const { boost, snapshot } = rules;
  return (
    <div className="tw-space-y-5">
      <p className="tw-m-0 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.rules.snapshot", {
          cycle: formatDate(locale, cycleDateOf(snapshot.block_timestamp), {
            dateStyle: "medium",
            timeZone: "UTC",
          }),
          date: t(locale, "network.tdh.value.utcTime", {
            time: formatDate(locale, snapshot.block_timestamp, {
              dateStyle: "medium",
              timeStyle: "medium",
              hourCycle: "h23",
              timeZone: "UTC",
            }),
          }),
          block: formatInteger(locale, snapshot.block_number),
        })}{" "}
        {t(locale, "network.tdh.rules.snapshotNote")}
      </p>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
        <li className={STAT}>
          <p className={STAT_LABEL}>
            {t(locale, "network.tdh.rules.full.title")}
          </p>
          <p className={STAT_VALUE}>
            {t(locale, "network.tdh.rules.full.multiplier", {
              value: formatMultiplier(
                locale,
                boost.base_multiplier + boost.full_collection.first_set_bonus
              ),
            })}
          </p>
          <p className={STAT_NOTE}>
            {t(locale, "network.tdh.rules.full.short", {
              count: formatInteger(locale, snapshot.eligible_memes_count),
            })}
          </p>
        </li>
        <li className={STAT}>
          <p className={STAT_LABEL}>
            {t(locale, "network.tdh.rules.gradient.title")}
          </p>
          <p className={STAT_VALUE}>
            {t(locale, "network.tdh.rules.gradient.value", {
              bonus: formatBonus(locale, boost.gradients.bonus_per_token),
            })}
          </p>
          <p className={STAT_NOTE}>
            {t(locale, "network.tdh.rules.gradient.short", {
              count: formatInteger(locale, boost.gradients.max_count),
              maximum: formatBonus(locale, boost.gradients.max_bonus),
            })}
          </p>
        </li>
      </ul>
      <BoostLadder
        locale={locale}
        values={getTdhBoostLadder(rules)}
        eligibleMemes={snapshot.eligible_memes_count}
        lastSeason={boost.season_schedule.last_boosted_season}
        gradients={boost.gradients.max_count}
      />
      <PartialSets rules={rules} locale={locale} />
      <TdhDisclosure
        tone="strong"
        className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-px-4"
        summary={t(locale, "network.tdh.rules.details")}
      >
        <div className="tw-space-y-3 tw-pb-4 tw-pl-6">
          <p className={TDH_TEXT}>
            {t(locale, "network.tdh.rules.full.body", {
              count: formatInteger(locale, snapshot.eligible_memes_count),
              bonus: formatBonus(locale, boost.full_collection.first_set_bonus),
            })}
          </p>
          <p className={TDH_TEXT}>
            {t(locale, "network.tdh.rules.full.extra", {
              initial: formatBonus(
                locale,
                boost.full_collection.additional_set_initial_bonus
              ),
              decay: formatBonus(
                locale,
                boost.full_collection.additional_set_decay_ratio
              ),
              limit: formatBonus(
                locale,
                boost.full_collection.additional_sets_limit_bonus
              ),
            })}
          </p>
          <p className={TDH_TEXT}>
            {t(locale, "network.tdh.rules.partial.body")}{" "}
            {t(locale, "network.tdh.rules.partial.note")}
          </p>
          <p className={TDH_TEXT}>
            {t(locale, "network.tdh.rules.gradient.body", {
              bonus: formatBonus(locale, boost.gradients.bonus_per_token),
              count: formatInteger(locale, boost.gradients.max_count),
              maximum: formatBonus(locale, boost.gradients.max_bonus),
              decimals: formatInteger(locale, boost.final_rounding_decimals),
            })}
          </p>
          <FutureSchedule rules={rules} locale={locale} />
        </div>
      </TdhDisclosure>
    </div>
  );
}

function PartialSets({
  rules: { boost },
  locale,
}: {
  readonly rules: TdhRules;
  readonly locale: SupportedLocale;
}) {
  const ranges = seasonRanges(boost.season_sets);
  return (
    <div className={`${TDH_PANEL} tw-p-4 sm:tw-p-5`}>
      <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {t(locale, "network.tdh.rules.partial.title")}
      </h3>
      <p className={`${TDH_TEXT} tw-mt-1`}>
        {t(locale, "network.tdh.rules.partial.short")}
      </p>
      {ranges.length ? (
        <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
          {ranges.map((range) => (
            <li key={range.from} className={CHIP}>
              {range.from === range.to
                ? t(locale, "network.tdh.rules.season", {
                    season: formatInteger(locale, range.from),
                    bonus: formatBonus(locale, range.bonus),
                  })
                : t(locale, "network.tdh.rules.seasonRange", {
                    from: formatInteger(locale, range.from),
                    to: formatInteger(locale, range.to),
                    bonus: formatBonus(locale, range.bonus),
                  })}
            </li>
          ))}
          {boost.season_one_partials.map((partial) => (
            <li key={partial.key} className={CHIP}>
              {t(locale, `network.tdh.rules.partial.${partial.key}`, {
                ids: formatList(
                  locale,
                  partial.token_ids.map((id) => formatInteger(locale, id))
                ),
                bonus: formatBonus(locale, partial.bonus),
              })}
            </li>
          ))}
        </ul>
      ) : (
        <p className={`${TDH_TEXT} tw-mt-3`}>
          {t(locale, "network.tdh.rules.noSeasons")}
        </p>
      )}
    </div>
  );
}

function FutureSchedule({
  rules,
  locale,
}: {
  readonly rules: TdhRules;
  readonly locale: SupportedLocale;
}) {
  const { boost } = rules;
  return (
    <>
      <p className={TDH_TEXT}>
        {t(locale, "network.tdh.rules.future.body", {
          lastSeason: formatInteger(
            locale,
            boost.season_schedule.last_boosted_season
          ),
          bonus: formatBonus(locale, boost.season_schedule.bonus_per_season),
        })}{" "}
        {t(locale, "network.tdh.rules.future.full", {
          count: formatInteger(
            locale,
            boost.season_schedule.last_boosted_season
          ),
          multiplier: formatMultiplier(
            locale,
            boost.base_multiplier + boost.season_schedule.max_bonus
          ),
        })}
      </p>
      <p className={TDH_TEXT}>
        {t(locale, "network.tdh.rules.future.condition", {
          gradients: formatInteger(locale, boost.gradients.max_count),
        })}{" "}
        {t(locale, "network.tdh.rules.future.cards")}
      </p>
    </>
  );
}
