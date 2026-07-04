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
import styles from "./UserPageStats.module.css";
import {
  UserPageStatsTableHead,
  UserPageStatsTableHr,
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

function className(...classNames: readonly (string | undefined)[]): string {
  return classNames
    .filter((value): value is string => value !== undefined && value !== "")
    .join(" ");
}

const ACTIVITY_DISCLOSURE_SUMMARY_CLASS = className(
  styles["collectedAccordionButton"],
  "tw-flex tw-w-full tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-px-5 tw-py-4 tw-text-left tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden"
);
const ACTIVITY_DISCLOSURE_CARET_CLASS =
  "tw-h-2 tw-w-2 tw-shrink-0 tw-rotate-45 tw-border-b-2 tw-border-r-2 tw-border-iron-400 tw-transition-transform tw-duration-200 group-open:tw-rotate-[225deg]";
const ACTIVITY_DISCLOSURE_BODY_CLASS = className(
  styles["collectedAccordionBody"],
  "tw-px-5 tw-py-4"
);
const ACTIVITY_SCROLL_CONTAINER_CLASS = className(
  "tw-py-2",
  styles["scrollContainer"]
);
const ACTIVITY_TABLE_CLASS = className(
  "tw-w-full",
  styles["collectedAccordionTable"]
);

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
    <div className="tw-py-2">
      <div className="tw-flex tw-py-2">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {activityMessage(
            locale,
            "user.collected.stats.activityOverview.title"
          )}
        </h3>
      </div>
      <div className="tw-py-2">
        <UserPageStatsActivityOverviewTotals
          activity={activity}
          locale={locale}
        />
      </div>
      <div className="tw-py-2">
        <UserPageStatsActivityOverviewMemes
          activity={activityMemes}
          locale={locale}
        />
      </div>
    </div>
  );
}

function UserPageStatsActivityOverviewTotals({
  activity,
  locale,
}: {
  readonly activity: AggregatedActivity | undefined;
  readonly locale: SupportedLocale;
}) {
  return (
    <details className="tw-group" open>
      <summary className={ACTIVITY_DISCLOSURE_SUMMARY_CLASS}>
        <b>
          {activityMessage(
            locale,
            "user.collected.stats.activityOverview.overview"
          )}
        </b>
        <span aria-hidden="true" className={ACTIVITY_DISCLOSURE_CARET_CLASS} />
      </summary>
      <div className={ACTIVITY_DISCLOSURE_BODY_CLASS}>
        <div className={ACTIVITY_SCROLL_CONTAINER_CLASS}>
          <table className={ACTIVITY_TABLE_CLASS}>
            <UserPageStatsTableHead
              locale={locale}
              caption={activityMessage(
                locale,
                "user.collected.stats.activityOverview.tables.overviewCaption"
              )}
            />
            <tbody>
              {OVERVIEW_ROW_GROUPS.map((group, groupIndex) => (
                <Fragment key={`activity-overview-group-${groupIndex}`}>
                  <UserPageStatsTableHr span={6} />
                  {group.map((row) => (
                    <ActivityOverviewRow
                      key={row.labelKey}
                      row={row}
                      activity={activity}
                      locale={locale}
                    />
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

function ActivityOverviewRow({
  row,
  activity,
  locale,
}: {
  readonly row: OverviewRowConfig;
  readonly activity: AggregatedActivity | undefined;
  readonly locale: SupportedLocale;
}) {
  return (
    <tr>
      <th scope="row" className="!tw-text-[#93939f]">
        <b>{activityMessage(locale, row.labelKey)}</b>
      </th>
      {row.fields.map((field) => (
        <td key={field} className="tw-text-right !tw-text-[#fff]">
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
  return (
    <details className="tw-group" open>
      <summary className={ACTIVITY_DISCLOSURE_SUMMARY_CLASS}>
        <b>
          {activityMessage(
            locale,
            "user.collected.stats.activityOverview.memesBySeason"
          )}
        </b>
        <span aria-hidden="true" className={ACTIVITY_DISCLOSURE_CARET_CLASS} />
      </summary>
      <div className={ACTIVITY_DISCLOSURE_BODY_CLASS}>
        <div className={ACTIVITY_SCROLL_CONTAINER_CLASS}>
          {activity.length > 0 ? (
            <table className={ACTIVITY_TABLE_CLASS}>
              <caption className="tw-sr-only">
                {activityMessage(
                  locale,
                  "user.collected.stats.activityOverview.tables.memesBySeasonCaption"
                )}
              </caption>
              <thead>
                <tr>
                  <th aria-hidden="true"></th>
                  {SEASON_ACTIVITY_COLUMNS.map((column) => (
                    <th
                      key={column.field}
                      scope="col"
                      className="tw-text-right !tw-text-[#93939f]"
                    >
                      {activityMessage(locale, column.labelKey)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((seasonActivity) => (
                  <Fragment
                    key={`stats-activity-memes-${seasonActivity.season}`}
                  >
                    <UserPageStatsTableHr span={11} />
                    <tr>
                      <th scope="row" className="!tw-text-[#93939f]">
                        {activityMessage(
                          locale,
                          "user.collected.stats.activityOverview.seasonLabel",
                          { seasonNumber: seasonActivity.season }
                        )}
                      </th>
                      {SEASON_ACTIVITY_COLUMNS.map((column) => (
                        <td
                          key={column.field}
                          className="tw-text-right !tw-text-[#fff]"
                        >
                          {formatActivityValue(
                            locale,
                            seasonActivity[column.field],
                            column.valueType
                          )}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="tw-mb-0 tw-px-2 tw-py-3 tw-text-sm tw-text-iron-300">
              {activityMessage(
                locale,
                "user.collected.stats.activityOverview.tables.memesBySeasonEmpty"
              )}
            </p>
          )}
        </div>
      </div>
    </details>
  );
}
