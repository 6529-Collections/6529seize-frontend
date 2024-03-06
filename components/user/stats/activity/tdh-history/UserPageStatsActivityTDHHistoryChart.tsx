import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { ChartProps } from "./UserPageStatsActivityTDHHistoryCharts";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement
);

const GRAPH_OPTIONS = {
  scales: {
    x: {
      grid: {
        color: "rgb(45, 45, 45)",
      },
      ticks: {
        color: "rgb(154, 154, 154)",
      },
    },
    y: {
      grid: {
        color: "rgb(45, 45, 45)",
      },
      ticks: {
        color: "rgb(154, 154, 154)",
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: "rgb(200, 200, 200)",
      },
    },
  },
};

export default function UserPageStatsActivityTDHHistoryChart({
  data,
}: {
  readonly data: ChartProps;
}) {
  return (
    <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
      <div className="tw-pt-6 tw-px-4 sm:tw-px-6 tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          {data.title}
        </h3>
      </div>
      <div className="tw-p-6">
        <Line data={data} options={GRAPH_OPTIONS} />
      </div>
    </div>
  );
}
