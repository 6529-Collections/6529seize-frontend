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
import TDHSection, { TDH_PANEL, TDH_TEXT } from "./TDHSection";
import {
  getTdhFutureCeiling,
  tdhRulesSchema,
  type TdhRules,
} from "./tdh-rules.helpers";

const HEADING =
  "tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100";
const formatBonus = (locale: SupportedLocale, value: number) =>
  formatNumber(locale, value, { maximumFractionDigits: 6 });
const formatMultiplier = (locale: SupportedLocale, value: number) =>
  formatNumber(locale, value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function TDHCurrentRules({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const query = useQuery({
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
    staleTime: 5 * 60_000,
    retry: false,
  });
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
        {query.isError && (
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
      {query.data && !query.isError && (
        <Rules rules={query.data} locale={locale} />
      )}
      <nav
        aria-label={t(locale, "network.tdh.rules.links")}
        className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-3"
      >
        <ButtonLink
          variant="tertiary"
          size="sm"
          href="/network/tdh/historic-boosts"
        >
          {t(locale, "network.tdh.related.historic.title")}
        </ButtonLink>
        <ButtonLink variant="tertiary" size="sm" href="/network/definitions">
          {t(locale, "network.tdh.related.definitions.title")}
        </ButtonLink>
      </nav>
    </TDHSection>
  );
}

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
      <div className="tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-600 tw-pl-4">
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
          {t(locale, "network.tdh.rules.snapshot", {
            date: t(locale, "network.tdh.value.utcTime", {
              time: formatDate(locale, snapshot.block_timestamp, {
                dateStyle: "medium",
                timeStyle: "medium",
                timeZone: "UTC",
              }),
            }),
            block: formatInteger(locale, snapshot.block_number),
          })}
        </p>
        <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "network.tdh.rules.snapshotNote")}
        </p>
      </div>
      <div className={`${TDH_PANEL} tw-space-y-4 tw-p-5`}>
        <h3 className={HEADING}>{t(locale, "network.tdh.rules.full.title")}</h3>
        <p className="tw-m-0 tw-font-mono tw-text-2xl tw-font-semibold tw-text-iron-50">
          {t(locale, "network.tdh.rules.full.multiplier", {
            value: formatMultiplier(
              locale,
              boost.base_multiplier + boost.full_collection.first_set_bonus
            ),
          })}
        </p>
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
      </div>
      <PartialSets rules={rules} locale={locale} />
      <div className={`${TDH_PANEL} tw-space-y-3 tw-p-5`}>
        <h3 className={HEADING}>
          {t(locale, "network.tdh.rules.gradient.title")}
        </h3>
        <p className={TDH_TEXT}>
          {t(locale, "network.tdh.rules.gradient.body", {
            bonus: formatBonus(locale, boost.gradients.bonus_per_token),
            count: formatInteger(locale, boost.gradients.max_count),
            maximum: formatBonus(locale, boost.gradients.max_bonus),
            decimals: formatInteger(locale, boost.final_rounding_decimals),
          })}
        </p>
      </div>
      <FutureSchedule rules={rules} locale={locale} />
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
  return (
    <div className={`${TDH_PANEL} tw-space-y-3 tw-p-5`}>
      <h3 className={HEADING}>
        {t(locale, "network.tdh.rules.partial.title")}
      </h3>
      <p className={TDH_TEXT}>{t(locale, "network.tdh.rules.partial.body")}</p>
      {boost.season_sets.length ? (
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-5 tw-gap-y-2 tw-p-0 tw-text-sm tw-text-iron-200 sm:tw-grid-cols-2">
          {boost.season_sets.map((season) => (
            <li key={season.season}>
              {t(locale, "network.tdh.rules.season", {
                season: formatInteger(locale, season.season),
                bonus: formatBonus(locale, season.bonus),
              })}
            </li>
          ))}
        </ul>
      ) : (
        <p className={TDH_TEXT}>{t(locale, "network.tdh.rules.noSeasons")}</p>
      )}
      <ul className="tw-m-0 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-200">
        {boost.season_one_partials.map((partial) => (
          <li key={partial.key}>
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
      <p className={TDH_TEXT}>{t(locale, "network.tdh.rules.partial.note")}</p>
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
    <div className={`${TDH_PANEL} tw-space-y-4 tw-p-5`}>
      <h3 className={HEADING}>{t(locale, "network.tdh.rules.future.title")}</h3>
      <p className={TDH_TEXT}>
        {t(locale, "network.tdh.rules.future.body", {
          lastSeason: formatInteger(
            locale,
            boost.season_schedule.last_boosted_season
          ),
          bonus: formatBonus(locale, boost.season_schedule.bonus_per_season),
        })}
      </p>
      <p className={TDH_TEXT}>
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
      <p className="tw-m-0 tw-font-mono tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50">
        {t(locale, "network.tdh.rules.future.ceiling", {
          multiplier: formatMultiplier(locale, getTdhFutureCeiling(rules)),
        })}
      </p>
      <p className={TDH_TEXT}>
        {t(locale, "network.tdh.rules.future.condition", {
          gradients: formatInteger(locale, boost.gradients.max_count),
        })}
      </p>
      <p className={TDH_TEXT}>{t(locale, "network.tdh.rules.future.cards")}</p>
    </div>
  );
}
