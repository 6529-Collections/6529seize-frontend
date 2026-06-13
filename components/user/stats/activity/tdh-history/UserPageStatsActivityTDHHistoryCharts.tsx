"use client";

import { useEffect, useState } from "react";
import type { TDHHistory } from "@/entities/ITDH";
import UserPageStatsActivityTDHHistoryChart from "./UserPageStatsActivityTDHHistoryChart";
import {
  formatTdhHistoryDate,
  getTdhHistoryMessage,
} from "./tdh-history.messages";

interface ChartData {
  readonly label: string;
  readonly data: number[];
  readonly backgroundColor: string;
  readonly borderColor: string;
}
export interface ChartProps {
  readonly id: string;
  readonly title: string;
  readonly ariaLabel: string;
  readonly labels: string[];
  readonly datasets: ChartData[];
}

interface ChartConfigDataset {
  readonly labelKey: Parameters<typeof getTdhHistoryMessage>[0];
  readonly field: keyof TDHHistory;
  readonly color: string;
}

interface ChartConfig {
  readonly id: string;
  readonly titleKey: Parameters<typeof getTdhHistoryMessage>[0];
  readonly datasets: ChartConfigDataset[];
}

const CHART_CONFIGS: ChartConfig[] = [
  {
    id: "total-tdh",
    titleKey: "user.collected.stats.tdhHistory.charts.totalTdh.title",
    datasets: [
      {
        labelKey:
          "user.collected.stats.tdhHistory.charts.totalTdh.totalBoosted",
        field: "boosted_tdh",
        color: "#00DC21",
      },
    ],
  },
  {
    id: "net-daily-change",
    titleKey: "user.collected.stats.tdhHistory.charts.netDailyChange.title",
    datasets: [
      {
        labelKey:
          "user.collected.stats.tdhHistory.charts.netDailyChange.netBoosted",
        field: "net_boosted_tdh",
        color: "#00DC21",
      },
    ],
  },
  {
    id: "created-daily-change",
    titleKey: "user.collected.stats.tdhHistory.charts.createdDailyChange.title",
    datasets: [
      {
        labelKey:
          "user.collected.stats.tdhHistory.charts.createdDailyChange.createdBoosted",
        field: "created_boosted_tdh",
        color: "#00DC21",
      },
    ],
  },
  {
    id: "destroyed-daily-change",
    titleKey:
      "user.collected.stats.tdhHistory.charts.destroyedDailyChange.title",
    datasets: [
      {
        labelKey:
          "user.collected.stats.tdhHistory.charts.destroyedDailyChange.destroyedBoosted",
        field: "destroyed_boosted_tdh",
        color: "#00DC21",
      },
    ],
  },
];

export default function UserPageStatsActivityTDHHistoryCharts({
  tdhHistory,
}: {
  readonly tdhHistory: TDHHistory[];
}) {
  const [dataSets, setDataSets] = useState<ChartProps[]>([]);

  const isNumber = (n: any): n is number => typeof n === "number";

  const getData = ({
    tdh,
    dates,
    field,
  }: {
    tdh: TDHHistory[];
    dates: TDHHistory["date"][];
    field: keyof TDHHistory;
  }): number[] => {
    return dates.map((date) => {
      const tdhItem = tdh.find((t) => t.date === date);
      if (!tdhItem) {
        return 0;
      }
      const value = tdhItem[field];
      return tdhItem && isNumber(value) ? value : 0;
    });
  };

  const getDataSets = ({
    tdh,
    dates,
  }: {
    tdh: TDHHistory[];
    dates: TDHHistory["date"][];
  }): ChartProps[] => {
    const labels = dates.map(formatTdhHistoryDate);

    return CHART_CONFIGS.map((config) => {
      const title = getTdhHistoryMessage(config.titleKey);
      return {
        id: config.id,
        title,
        ariaLabel: getTdhHistoryMessage(
          "user.collected.stats.tdhHistory.chartAriaLabel",
          { title }
        ),
        labels,
        datasets: config.datasets.map((d) => ({
          label: getTdhHistoryMessage(d.labelKey),
          data: getData({ tdh, dates, field: d.field }),
          backgroundColor: d.color,
          borderColor: d.color,
        })),
      };
    }).filter((c) => c.datasets.some((d) => d.data.some((n) => n > 0)));
  };

  useEffect(() => {
    if (!tdhHistory.length) {
      setDataSets([]);
      return;
    }

    const tdhHistoryReversed = tdhHistory.toReversed();
    const tdhDates = tdhHistoryReversed.map((t) => t.date);
    setDataSets(getDataSets({ tdh: tdhHistoryReversed, dates: tdhDates }));
  }, [tdhHistory]);

  return (
    <div
      aria-label={getTdhHistoryMessage(
        "user.collected.stats.tdhHistory.chartListLabel"
      )}
      className="tw-mt-2 tw-flex tw-flex-col tw-gap-y-6 sm:tw-mt-4 md:tw-gap-y-8"
      role="list"
    >
      {dataSets.map((dataSet) => (
        <UserPageStatsActivityTDHHistoryChart key={dataSet.id} data={dataSet} />
      ))}
    </div>
  );
}
