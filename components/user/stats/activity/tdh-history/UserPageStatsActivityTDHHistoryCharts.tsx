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

  const getBoostedTDH = ({
    tdh,
    labels,
  }: {
    tdh: TDHHistory[];
    labels: Date[];
  }) => {
    const data: ChartProps = {
      title: "Total TDH",
      labels,
      datasets: [
        {
          label: "Total Boosted TDH",
          data: getData({ tdh, labels, field: "boosted_tdh" }),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Total Unboosted TDH",
          data: getData({ tdh, labels, field: "tdh" }),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Total Unweighted TDH",
          data: getData({ tdh, labels, field: "tdh__raw" }),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    const haveValues = data.datasets.some((d) => d.data.some((d) => d));
    return haveValues ? data : null;
  };

  const getNetTDH = ({
    tdh,
    labels,
  }: {
    tdh: TDHHistory[];
    labels: Date[];
  }) => {
    const data: ChartProps = {
      title: "Net TDH Daily Change",
      labels,
      datasets: [
        {
          label: "Net Boosted TDH",
          data: getData({ tdh, labels, field: "net_boosted_tdh" }),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Net Unboosted TDH",
          data: getData({ tdh, labels, field: "net_tdh" }),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Net Unweighted TDH",
          data: getData({ tdh, labels, field: "net_tdh__raw" }),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    const haveValues = data.datasets.some((d) => d.data.some((d) => d));
    return haveValues ? data : null;
  };

  const getCreatedTDH = ({
    tdh,
    labels,
  }: {
    tdh: TDHHistory[];
    labels: Date[];
  }) => {
    const data: ChartProps = {
      title: "Created TDH Daily Change",
      labels,
      datasets: [
        {
          label: "Created Boosted TDH",
          data: getData({
            tdh,
            labels,
            field: "created_boosted_tdh",
          }),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Created Unboosted TDH",
          data: getData({
            tdh,
            labels,
            field: "created_tdh",
          }),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Created Unweighted TDH",
          data: getData({
            tdh,
            labels,
            field: "created_tdh__raw",
          }),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    const haveValues = data.datasets.some((d) => d.data.some((d) => d));
    return haveValues ? data : null;
  };

  const getDestroyedTDH = ({
    tdh,
    labels,
  }: {
    tdh: TDHHistory[];
    labels: Date[];
  }) => {
    const data: ChartProps = {
      title: "Destroyed TDH Daily Change",
      labels,
      datasets: [
        {
          label: "Destroyed Boosted TDH",
          data: getData({
            tdh,
            labels,
            field: "destroyed_boosted_tdh",
          }),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Destroyed Unboosted TDH",
          data: getData({
            tdh,
            labels,
            field: "destroyed_tdh",
          }),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Destroyed Unweighted TDH",
          data: getData({
            tdh,
            labels,
            field: "destroyed_tdh__raw",
          }),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    const haveValues = data.datasets.some((d) => d.data.some((d) => d));
    return haveValues ? data : null;
  };

  useEffect(() => {
    if (!tdhHistory.length) {
      setDataSets([]);
      return;
    }

    const tdhHistoryReversed = tdhHistory.toReversed();
    const tdhLabels = tdhHistoryReversed.map((t) => t.date);
    const data: ChartProps[] = [];

    const boostedTDH = getBoostedTDH({
      tdh: tdhHistoryReversed,
      labels: tdhLabels,
    });

    if (boostedTDH) {
      data.push(boostedTDH);
    }

    const netTDH = getNetTDH({
      tdh: tdhHistoryReversed,
      labels: tdhLabels,
    });

    if (netTDH) {
      data.push(netTDH);
    }

    const createdTDH = getCreatedTDH({
      tdh: tdhHistoryReversed,
      labels: tdhLabels,
    });

    if (createdTDH) {
      data.push(createdTDH);
    }

    const destroyedTDH = getDestroyedTDH({
      tdh: tdhHistoryReversed,
      labels: tdhLabels,
    });

    if (destroyedTDH) {
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
