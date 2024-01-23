import { useEffect, useState } from "react";
import { TDHHistory } from "../../../../../entities/ITDH";
import UserPageStatsActivityTDHHistoryChart from "./UserPageStatsActivityTDHHistoryChart";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";

interface ChartData {
  readonly label: string;
  readonly data: number[];
  readonly backgroundColor: string;
  readonly borderColor: string;
}
export interface ChartProps {
  readonly title: string;
  readonly labels: Date[];
  readonly datasets: ChartData[];
}

enum TDHHistoryChartType {
  BOOSTED_TDH = "BOOSTED_TDH",
  NET_TDH = "NET_TDH",
  CREATED_TDH = "CREATED_TDH",
  DESTROYED_TDH = "DESTROYED_TDH",
}

interface ChartConfigDataset {
  readonly label: string;
  readonly field: keyof TDHHistory;
  readonly color: string;
}

interface ChartConfig {
  readonly title: string;
  readonly datasets: ChartConfigDataset[];
}

const CHART_CONFIGS: ChartConfig[] = [
  {
    title: "Total TDH",
    datasets: [
      {
        label: "Total Boosted TDH",
        field: "boosted_tdh",
        color: "#00DC21",
      },
      {
        label: "Total Unboosted TDH",
        field: "tdh",
        color: "#1861FF",
      },
      {
        label: "Total Unweighted TDH",
        field: "tdh__raw",
        color: "#e55137",
      },
    ],
  },
  {
    title: "Net TDH Daily Change",
    datasets: [
      {
        label: "Net Boosted TDH",
        field: "net_boosted_tdh",
        color: "#00DC21",
      },
      {
        label: "Net Unboosted TDH",
        field: "net_tdh",
        color: "#1861FF",
      },
      {
        label: "Net Unweighted TDH",
        field: "net_tdh__raw",
        color: "#e55137",
      },
    ],
  },
  {
    title: "Created TDH Daily Change",
    datasets: [
      {
        label: "Created Boosted TDH",
        field: "created_boosted_tdh",
        color: "#00DC21",
      },
      {
        label: "Created Unboosted TDH",
        field: "created_tdh",
        color: "#1861FF",
      },
      {
        label: "Created Unweighted TDH",
        field: "created_tdh__raw",
        color: "#e55137",
      },
    ],
  },
  {
    title: "Destroyed TDH Daily Change",
    datasets: [
      {
        label: "Destroyed Boosted TDH",
        field: "destroyed_boosted_tdh",
        color: "#00DC21",
      },
      {
        label: "Destroyed Unboosted TDH",
        field: "destroyed_tdh",
        color: "#1861FF",
      },
      {
        label: "Destroyed Unweighted TDH",
        field: "destroyed_tdh__raw",
        color: "#e55137",
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
    labels,
    field,
  }: {
    tdh: TDHHistory[];
    labels: Date[];
    field: keyof TDHHistory;
  }): number[] => {
    return labels.map((l) => {
      const tdhItem = tdh.find((t) => t.date === l);
      if (!tdhItem) {
        return 0;
      }
      const value = tdhItem[field];
      return tdhItem && isNumber(value) ? value : 0;
    });
  };

  const getDataSets = ({
    tdh,
    labels,
  }: {
    tdh: TDHHistory[];
    labels: Date[];
  }): ChartProps[] => {
    return CHART_CONFIGS.map((config) => {
      return {
        title: config.title,
        labels,
        datasets: config.datasets.map((d) => ({
          label: d.label,
          data: getData({ tdh, labels, field: d.field }),
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
    const tdhLabels = tdhHistoryReversed.map((t) => t.date);
    setDataSets(getDataSets({ tdh: tdhHistoryReversed, labels: tdhLabels }));
  }, [tdhHistory]);

  return (
    <div className="tw-mt-2 sm:tw-mt-4 tw-flex tw-flex-col tw-gap-y-8">
      {dataSets.map((dataSet, i) => (
        <UserPageStatsActivityTDHHistoryChart
          key={getRandomObjectId()}
          data={dataSet}
        />
      ))}
    </div>
  );
}
