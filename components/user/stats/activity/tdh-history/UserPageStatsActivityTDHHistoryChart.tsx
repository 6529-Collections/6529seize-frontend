import { Bar } from "react-chartjs-2";

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
    <div>
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
          {data.title}
        </h3>
      </div>
      <div className="tw-mt-4 tw-mb-6">
        <Bar data={data} options={GRAPH_OPTIONS} />
      </div>
    </div>
  );
}
