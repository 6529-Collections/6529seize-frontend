"use client";

import type {
  AggregatedActivity,
  AggregatedActivityMemes,
} from "@/entities/IAggregatedActivity";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { Fragment, useEffect, useState } from "react";
import { getStatsPath } from "./userPageStats.helpers";
import {
  STATS_SECTION_HEADING_CLASS,
  STATS_TABLE_CLASS,
  STATS_TABLE_GROUP_START_ROW_CLASS,
  STATS_TABLE_HEADER_CELL_CLASS,
  STATS_TABLE_HEAD_CLASS,
  STATS_TABLE_ROW_CLASS,
  STATS_TABLE_ROW_HEADER_CLASS,
  STATS_TABLE_VALUE_CELL_CLASS,
  UserPageStatsDisclosure,
  UserPageStatsTableHead,
  UserPageStatsTableScroll,
} from "./UserPageStatsTableShared";

type ActivityOverviewMessageKey = Extract<
  MessageKey,
  `user.collected.stats.activityOverview.${string}`
>;

type NumericAggregatedActivityField = {
  [Field in keyof AggregatedActivity]: AggregatedActivity[Field] extends number
    ? Field
    : never;
}[keyof AggregatedActivity];
type NumericAggregatedActivityMemesField = {
  [Field in keyof AggregatedActivityMemes]: AggregatedActivityMemes[Field] extends number
    ? Field
    : never;
}[keyof AggregatedActivityMemes];
type ActivityValueType = "integer" | "eth";
type OverviewFieldRoot =
  | "airdrops"
  | "transfers_in"
  | "primary_purchases_count"
  | "primary_purchases_value"
  | "secondary_purchases_count"
  | "secondary_purchases_value"
  | "transfers_out"
  | "burns"
  | "sales_count"
  | "sales_value";

interface OverviewRowConfig {
  readonly labelKey: ActivityOverviewMessageKey;
  readonly valueType: ActivityValueType;
  readonly fields: readonly [
    NumericAggregatedActivityField,
    NumericAggregatedActivityField,
    NumericAggregatedActivityField,
    NumericAggregatedActivityField,
    NumericAggregatedActivityField,
  ];
}

interface SeasonColumnConfig {
  readonly labelKey: ActivityOverviewMessageKey;
  readonly valueType: ActivityValueType;
  readonly field: NumericAggregatedActivityMemesField;
}

const COLLECTION_FIELD_SUFFIXES = [
  "",
  "_memes",
  "_nextgen",
  "_gradients",
  "_memelab",
] as const;

function collectionFields(
  root: OverviewFieldRoot
): OverviewRowConfig["fields"] {
  return COLLECTION_FIELD_SUFFIXES.map(
    (suffix) => `${root}${suffix}`
  ) as unknown as OverviewRowConfig["fields"];
}

function overviewRow(
  labelKey: ActivityOverviewMessageKey,
  valueType: ActivityValueType,
  root: OverviewFieldRoot
): OverviewRowConfig {
  return { labelKey, valueType, fields: collectionFields(root) };
}

function seasonColumn(
  labelKey: ActivityOverviewMessageKey,
  valueType: ActivityValueType,
  field: NumericAggregatedActivityMemesField
): SeasonColumnConfig {
  return { labelKey, valueType, field };
}

const OVERVIEW_ROW_GROUPS: readonly (readonly OverviewRowConfig[])[] = [
  [
    overviewRow(
      "user.collected.stats.activityOverview.rows.airdrops",
      "integer",
      "airdrops"
    ),
    overviewRow(
      "user.collected.stats.activityOverview.rows.transfersIn",
      "integer",
      "transfers_in"
    ),
    overviewRow(
      "user.collected.stats.activityOverview.rows.mints",
      "integer",
      "primary_purchases_count"
    ),
    overviewRow(
      "user.collected.stats.activityOverview.rows.mintsEth",
      "eth",
      "primary_purchases_value"
    ),
    overviewRow(
      "user.collected.stats.activityOverview.rows.purchases",
      "integer",
      "secondary_purchases_count"
    ),
    overviewRow(
      "user.collected.stats.activityOverview.rows.purchasesEth",
      "eth",
      "secondary_purchases_value"
    ),
  ],
  [
    overviewRow(
      "user.collected.stats.activityOverview.rows.transfersOut",
      "integer",
      "transfers_out"
    ),
    overviewRow(
      "user.collected.stats.activityOverview.rows.burns",
      "integer",
      "burns"
    ),
    overviewRow(
      "user.collected.stats.activityOverview.rows.sales",
      "integer",
      "sales_count"
    ),
    overviewRow(
      "user.collected.stats.activityOverview.rows.salesEth",
      "eth",
      "sales_value"
    ),
  ],
];

const SEASON_ACTIVITY_COLUMNS: readonly SeasonColumnConfig[] = [
  seasonColumn(
    "user.collected.stats.activityOverview.rows.transfersIn",
    "integer",
    "transfers_in"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.airdrops",
    "integer",
    "airdrops"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.mints",
    "integer",
    "primary_purchases_count"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.mintsEth",
    "eth",
    "primary_purchases_value"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.purchases",
    "integer",
    "secondary_purchases_count"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.purchasesEth",
    "eth",
    "secondary_purchases_value"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.transfersOut",
    "integer",
    "transfers_out"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.burns",
    "integer",
    "burns"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.sales",
    "integer",
    "sales_count"
  ),
  seasonColumn(
    "user.collected.stats.activityOverview.rows.salesEth",
    "eth",
    "sales_value"
  ),
];

function activityMessage(
  locale: SupportedLocale,
  key: ActivityOverviewMessageKey,
  params: Record<string, string | number> = {}
): string {
  return t(locale, key, params);
}

function formatActivityValue(
  locale: SupportedLocale,
  value: number | undefined,
  valueType: ActivityValueType
): string {
  if (valueType === "eth") {
    return formatNumber(locale, value, { maximumFractionDigits: 2 });
  }

  return formatInteger(locale, value);
}

export default function UserPageStatsActivityOverview({
  profile,
  activeAddress,
  locale = DEFAULT_LOCALE,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly locale?: SupportedLocale | undefined;
}) {
  const [activity, setActivity] = useState<AggregatedActivity | undefined>();
  const [activityMemes, setActivityMemes] = useState<AggregatedActivityMemes[]>(
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    const url = `aggregated-activity/${getStatsPath(profile, activeAddress)}`;
    commonApiFetch<AggregatedActivity>({
      endpoint: url,
      signal: controller.signal,
    })
      .then(setActivity)
      .catch(() => {
        setActivity(undefined);
      });
    return () => controller.abort();
  }, [activeAddress, profile]);

  useEffect(() => {
    const controller = new AbortController();
    const url = `aggregated-activity/${getStatsPath(
      profile,
      activeAddress
    )}/memes`;
    commonApiFetch<AggregatedActivityMemes[]>({
      endpoint: url,
      signal: controller.signal,
    })
      .then((response) => {
        setActivityMemes(response);
      })
      .catch(() => {
        setActivityMemes([]);
      });
    return () => controller.abort();
  }, [activeAddress, profile]);

  return (
    <section
      aria-labelledby="activity-overview-heading"
      className="tw-space-y-3"
    >
      <h3
        className={STATS_SECTION_HEADING_CLASS}
        id="activity-overview-heading"
      >
        {activityMessage(locale, "user.collected.stats.activityOverview.title")}
      </h3>
      <UserPageStatsActivityOverviewTotals
        activity={activity}
        locale={locale}
      />
      <UserPageStatsActivityOverviewMemes
        activity={activityMemes}
        locale={locale}
      />
    </section>
  );
}

function UserPageStatsActivityOverviewTotals({
  activity,
  locale,
}: {
  readonly activity: AggregatedActivity | undefined;
  readonly locale: SupportedLocale;
}) {
  const caption = activityMessage(
    locale,
    "user.collected.stats.activityOverview.tables.overviewCaption"
  );

  return (
    <UserPageStatsDisclosure
      title={activityMessage(
        locale,
        "user.collected.stats.activityOverview.overview"
      )}
    >
      <UserPageStatsTableScroll label={caption}>
        <table className={`${STATS_TABLE_CLASS} tw-min-w-[46rem]`}>
          <UserPageStatsTableHead locale={locale} caption={caption} />
          <tbody>
            {OVERVIEW_ROW_GROUPS.map((group, groupIndex) => (
              <Fragment key={`activity-overview-group-${groupIndex}`}>
                {group.map((row, rowIndex) => (
                  <ActivityOverviewRow
                    key={row.labelKey}
                    row={row}
                    activity={activity}
                    locale={locale}
                    startsGroup={groupIndex > 0 && rowIndex === 0}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </UserPageStatsTableScroll>
    </UserPageStatsDisclosure>
  );
}

function ActivityOverviewRow({
  row,
  activity,
  locale,
  startsGroup,
}: {
  readonly row: OverviewRowConfig;
  readonly activity: AggregatedActivity | undefined;
  readonly locale: SupportedLocale;
  readonly startsGroup: boolean;
}) {
  return (
    <tr
      className={
        startsGroup ? STATS_TABLE_GROUP_START_ROW_CLASS : STATS_TABLE_ROW_CLASS
      }
    >
      <th scope="row" className={STATS_TABLE_ROW_HEADER_CLASS}>
        {activityMessage(locale, row.labelKey)}
      </th>
      {row.fields.map((field) => (
        <td key={field} className={STATS_TABLE_VALUE_CELL_CLASS}>
          {formatActivityValue(locale, activity?.[field], row.valueType)}
        </td>
      ))}
    </tr>
  );
}

function UserPageStatsActivityOverviewMemes({
  activity,
  locale,
}: {
  readonly activity: AggregatedActivityMemes[];
  readonly locale: SupportedLocale;
}) {
  const caption = activityMessage(
    locale,
    "user.collected.stats.activityOverview.tables.memesBySeasonCaption"
  );

  return (
    <UserPageStatsDisclosure
      title={activityMessage(
        locale,
        "user.collected.stats.activityOverview.memesBySeason"
      )}
    >
      {activity.length > 0 ? (
        <UserPageStatsTableScroll label={caption}>
          <table className={`${STATS_TABLE_CLASS} tw-min-w-[76rem]`}>
            <caption className="tw-sr-only">{caption}</caption>
            <thead className={STATS_TABLE_HEAD_CLASS}>
              <tr>
                <th
                  scope="col"
                  className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-sticky tw-left-0 tw-z-[2] tw-bg-iron-900 tw-text-left`}
                >
                  {t(
                    locale,
                    "user.collected.stats.details.tables.column.season"
                  )}
                </th>
                {SEASON_ACTIVITY_COLUMNS.map((column) => (
                  <th
                    key={column.field}
                    scope="col"
                    className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-text-right`}
                  >
                    {activityMessage(locale, column.labelKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.map((seasonActivity) => (
                <tr
                  key={`stats-activity-memes-${seasonActivity.season}`}
                  className={STATS_TABLE_ROW_CLASS}
                >
                  <th scope="row" className={STATS_TABLE_ROW_HEADER_CLASS}>
                    {activityMessage(
                      locale,
                      "user.collected.stats.activityOverview.seasonLabel",
                      { seasonNumber: seasonActivity.season }
                    )}
                  </th>
                  {SEASON_ACTIVITY_COLUMNS.map((column) => (
                    <td
                      key={column.field}
                      className={STATS_TABLE_VALUE_CELL_CLASS}
                    >
                      {formatActivityValue(
                        locale,
                        seasonActivity[column.field],
                        column.valueType
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </UserPageStatsTableScroll>
      ) : (
        <p className="tw-mb-0 tw-px-4 tw-py-5 tw-text-sm tw-text-iron-500">
          {activityMessage(
            locale,
            "user.collected.stats.activityOverview.tables.memesBySeasonEmpty"
          )}
        </p>
      )}
    </UserPageStatsDisclosure>
  );
}
