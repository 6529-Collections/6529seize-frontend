"use client";

import type {
  AggregatedActivity,
  AggregatedActivityMemes,
} from "@/entities/IAggregatedActivity";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { Fragment, useEffect, useState } from "react";
import { Accordion, Col, Container, Row, Table } from "react-bootstrap";
import { getStatsPath } from "./userPageStats.helpers";
import styles from "./UserPageStats.module.scss";
import {
  UserPageStatsTableHead,
  UserPageStatsTableHr,
} from "./UserPageStatsTableShared";

type ActivityOverviewMessageKey = Extract<
  MessageKey,
  `user.collected.stats.activityOverview.${string}`
>;

type AggregatedActivityField = keyof AggregatedActivity;
type AggregatedActivityMemesField = keyof AggregatedActivityMemes;
type ActivityValueType = "integer" | "eth";

interface OverviewRowConfig {
  readonly labelKey: ActivityOverviewMessageKey;
  readonly valueType: ActivityValueType;
  readonly fields: readonly [
    AggregatedActivityField,
    AggregatedActivityField,
    AggregatedActivityField,
    AggregatedActivityField,
    AggregatedActivityField,
  ];
}

interface SeasonColumnConfig {
  readonly labelKey: ActivityOverviewMessageKey;
  readonly valueType: ActivityValueType;
  readonly field: AggregatedActivityMemesField;
}

const OVERVIEW_ROW_GROUPS: readonly (readonly OverviewRowConfig[])[] = [
  [
    {
      labelKey: "user.collected.stats.activityOverview.rows.airdrops",
      valueType: "integer",
      fields: [
        "airdrops",
        "airdrops_memes",
        "airdrops_nextgen",
        "airdrops_gradients",
        "airdrops_memelab",
      ],
    },
    {
      labelKey: "user.collected.stats.activityOverview.rows.transfersIn",
      valueType: "integer",
      fields: [
        "transfers_in",
        "transfers_in_memes",
        "transfers_in_nextgen",
        "transfers_in_gradients",
        "transfers_in_memelab",
      ],
    },
    {
      labelKey: "user.collected.stats.activityOverview.rows.mints",
      valueType: "integer",
      fields: [
        "primary_purchases_count",
        "primary_purchases_count_memes",
        "primary_purchases_count_nextgen",
        "primary_purchases_count_gradients",
        "primary_purchases_count_memelab",
      ],
    },
    {
      labelKey: "user.collected.stats.activityOverview.rows.mintsEth",
      valueType: "eth",
      fields: [
        "primary_purchases_value",
        "primary_purchases_value_memes",
        "primary_purchases_value_nextgen",
        "primary_purchases_value_gradients",
        "primary_purchases_value_memelab",
      ],
    },
    {
      labelKey: "user.collected.stats.activityOverview.rows.purchases",
      valueType: "integer",
      fields: [
        "secondary_purchases_count",
        "secondary_purchases_count_memes",
        "secondary_purchases_count_nextgen",
        "secondary_purchases_count_gradients",
        "secondary_purchases_count_memelab",
      ],
    },
    {
      labelKey: "user.collected.stats.activityOverview.rows.purchasesEth",
      valueType: "eth",
      fields: [
        "secondary_purchases_value",
        "secondary_purchases_value_memes",
        "secondary_purchases_value_nextgen",
        "secondary_purchases_value_gradients",
        "secondary_purchases_value_memelab",
      ],
    },
  ],
  [
    {
      labelKey: "user.collected.stats.activityOverview.rows.transfersOut",
      valueType: "integer",
      fields: [
        "transfers_out",
        "transfers_out_memes",
        "transfers_out_nextgen",
        "transfers_out_gradients",
        "transfers_out_memelab",
      ],
    },
    {
      labelKey: "user.collected.stats.activityOverview.rows.burns",
      valueType: "integer",
      fields: [
        "burns",
        "burns_memes",
        "burns_nextgen",
        "burns_gradients",
        "burns_memelab",
      ],
    },
    {
      labelKey: "user.collected.stats.activityOverview.rows.sales",
      valueType: "integer",
      fields: [
        "sales_count",
        "sales_count_memes",
        "sales_count_nextgen",
        "sales_count_gradients",
        "sales_count_memelab",
      ],
    },
    {
      labelKey: "user.collected.stats.activityOverview.rows.salesEth",
      valueType: "eth",
      fields: [
        "sales_value",
        "sales_value_memes",
        "sales_value_nextgen",
        "sales_value_gradients",
        "sales_value_memelab",
      ],
    },
  ],
];

const SEASON_ACTIVITY_COLUMNS: readonly SeasonColumnConfig[] = [
  {
    labelKey: "user.collected.stats.activityOverview.rows.transfersIn",
    valueType: "integer",
    field: "transfers_in",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.airdrops",
    valueType: "integer",
    field: "airdrops",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.mints",
    valueType: "integer",
    field: "primary_purchases_count",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.mintsEth",
    valueType: "eth",
    field: "primary_purchases_value",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.purchases",
    valueType: "integer",
    field: "secondary_purchases_count",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.purchasesEth",
    valueType: "eth",
    field: "secondary_purchases_value",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.transfersOut",
    valueType: "integer",
    field: "transfers_out",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.burns",
    valueType: "integer",
    field: "burns",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.sales",
    valueType: "integer",
    field: "sales_count",
  },
  {
    labelKey: "user.collected.stats.activityOverview.rows.salesEth",
    valueType: "eth",
    field: "sales_value",
  },
];

function activityMessage(
  key: ActivityOverviewMessageKey,
  params: Record<string, string | number> = {}
): string {
  return t(DEFAULT_LOCALE, key, params);
}

function formatActivityValue(
  value: number | undefined,
  valueType: ActivityValueType
): string {
  if (valueType === "eth") {
    return formatNumber(DEFAULT_LOCALE, value, { maximumFractionDigits: 2 });
  }

  return formatInteger(DEFAULT_LOCALE, value);
}

export default function UserPageStatsActivityOverview({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
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
    <div className="pt-2 pb-2">
      <div className="pt-2 pb-2 tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {activityMessage("user.collected.stats.activityOverview.title")}
        </h3>
      </div>
      <div className="pt-2 pb-2">
        <UserPageStatsActivityOverviewTotals activity={activity} />
      </div>
      <div className="pt-2 pb-2">
        <UserPageStatsActivityOverviewMemes activity={activityMemes} />
      </div>
    </div>
  );
}

function UserPageStatsActivityOverviewTotals({
  activity,
}: {
  readonly activity: AggregatedActivity | undefined;
}) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles["collectedAccordionButton"]}>
          <b>
            {activityMessage("user.collected.stats.activityOverview.overview")}
          </b>
        </Accordion.Button>
        <Accordion.Body className={styles["collectedAccordionBody"]}>
          <Container>
            <Row className={`pt-2 pb-2 ${styles["scrollContainer"]}`}>
              <Col>
                <Table className={styles["collectedAccordionTable"]}>
                  <UserPageStatsTableHead
                    caption={activityMessage(
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
                          />
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Container>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

function ActivityOverviewRow({
  row,
  activity,
}: {
  readonly row: OverviewRowConfig;
  readonly activity: AggregatedActivity | undefined;
}) {
  return (
    <tr>
      <th scope="row" className="!tw-text-[#93939f]">
        <b>{activityMessage(row.labelKey)}</b>
      </th>
      {row.fields.map((field) => (
        <td key={field} className="tw-text-right !tw-text-[#fff]">
          {formatActivityValue(activity?.[field], row.valueType)}
        </td>
      ))}
    </tr>
  );
}

function UserPageStatsActivityOverviewMemes({
  activity,
}: {
  readonly activity: AggregatedActivityMemes[];
}) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles["collectedAccordionButton"]}>
          <b>
            {activityMessage(
              "user.collected.stats.activityOverview.memesBySeason"
            )}
          </b>
        </Accordion.Button>
        <Accordion.Body className={styles["collectedAccordionBody"]}>
          <Container>
            <Row className={`pt-2 pb-2 ${styles["scrollContainer"]}`}>
              <Col>
                {activity && (
                  <Table className={styles["collectedAccordionTable"]}>
                    <caption className="tw-sr-only">
                      {activityMessage(
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
                            className="text-right !tw-text-[#93939f]"
                          >
                            {activityMessage(column.labelKey)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((activity) => (
                        <Fragment
                          key={`stats-activity-memes-${activity.season}`}
                        >
                          <UserPageStatsTableHr span={11} />
                          <tr>
                            <th scope="row" className="!tw-text-[#93939f]">
                              {activityMessage(
                                "user.collected.stats.activityOverview.seasonLabel",
                                { seasonNumber: activity.season }
                              )}
                            </th>
                            {SEASON_ACTIVITY_COLUMNS.map((column) => (
                              <td
                                key={column.field}
                                className="tw-text-right !tw-text-[#fff]"
                              >
                                {formatActivityValue(
                                  activity[column.field],
                                  column.valueType
                                )}
                              </td>
                            ))}
                          </tr>
                        </Fragment>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Col>
            </Row>
          </Container>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
