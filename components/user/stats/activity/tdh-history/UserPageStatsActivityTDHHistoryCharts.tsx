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

export default function UserPageStatsActivityTDHHistoryCharts({
  tdhHistory,
}: {
  readonly tdhHistory: TDHHistory[];
}) {
  const [dataSets, setDataSets] = useState<ChartProps[]>([]);

  useEffect(() => {
    if (!tdhHistory.length) {
      setDataSets([]);
      return;
    }

    const tdhHistoryReversed = tdhHistory.toReversed();
    const tdhLabels = tdhHistoryReversed.map((t) => t.date);
    const data: ChartProps[] = [];

    const boostedTDH: ChartProps = {
      title: "Total TDH",
      labels: tdhLabels,
      datasets: [
        {
          label: "Total Boosted TDH",
          data: tdhLabels.map(
            (l) =>
              tdhHistoryReversed.find((t) => t.date === l)?.boosted_tdh ?? 0
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Total Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistoryReversed.find((t) => t.date === l)?.tdh ?? 0
          ),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Total Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistoryReversed.find((t) => t.date === l)?.tdh__raw ?? 0
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    const haveBoostedTdh = boostedTDH.datasets.some((d) =>
      d.data.some((d) => d)
    );
    if (haveBoostedTdh) {
      data.push(boostedTDH);
    }

    const netTDH: ChartProps = {
      title: "Net TDH Daily Change",
      labels: tdhLabels,
      datasets: [
        {
          label: "Net Boosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_boosted_tdh ?? 0
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Net Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_tdh ?? 0
          ),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Net Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_tdh__raw ?? 0
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    const haveNetTdh = netTDH.datasets.some((d) => d.data.some((d) => d));
    if (haveNetTdh) {
      data.push(netTDH);
    }

    const createdTDH: ChartProps = {
      title: "Created TDH Daily Change",
      labels: tdhLabels,
      datasets: [
        {
          label: "Created Boosted TDH",
          data: tdhLabels.map(
            (l) =>
              tdhHistory.find((t) => t.date === l)?.created_boosted_tdh ?? 0
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Created Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_tdh ?? 0
          ),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Created Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_tdh__raw ?? 0
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    const haveCreatedTdh = createdTDH.datasets.some((d) =>
      d.data.some((d) => d)
    );
    if (haveCreatedTdh) {
      data.push(createdTDH);
    }

    const destroyedTDH: ChartProps = {
      title: "Destroyed TDH Daily Change",
      labels: tdhLabels,
      datasets: [
        {
          label: "Destroyed Boosted TDH",
          data: tdhLabels.map(
            (l) =>
              tdhHistory.find((t) => t.date === l)?.destroyed_boosted_tdh ?? 0
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Destroyed Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_tdh ?? 0
          ),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Destroyed Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_tdh__raw ?? 0
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    const haveDestroyedTdh = destroyedTDH.datasets.some((d) =>
      d.data.some((d) => d)
    );
    if (haveDestroyedTdh) {
      data.push(destroyedTDH);
    }
    setDataSets(data);
  }, [tdhHistory]);

  return (
    <div>
      {dataSets.map((dataSet, i) => (
        <UserPageStatsActivityTDHHistoryChart
          key={getRandomObjectId()}
          data={dataSet}
        />
      ))}
    </div>
  );
}
