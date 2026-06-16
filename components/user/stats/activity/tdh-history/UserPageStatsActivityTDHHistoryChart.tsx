import { Line } from "react-chartjs-2";

import { formatTdhHistoryValue } from "./tdh-history.messages";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import type { ChartProps } from "./UserPageStatsActivityTDHHistoryCharts";

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
        callback: (value: string | number) =>
          typeof value === "number" ? formatTdhHistoryValue(value) : value,
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
  const headingId = `tdh-history-chart-${data.id}`;

  return (
    <div
      aria-labelledby={headingId}
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
      role="listitem"
    >
      <div className="tw-flex tw-px-4 tw-pt-6 sm:tw-px-6">
        <h3
          className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100"
          id={headingId}
        >
          {data.title}
        </h3>
      </div>
      <div className="tw-p-6">
        <Line
          aria-label={data.ariaLabel}
          data={data}
          options={GRAPH_OPTIONS}
          role="img"
        />
      </div>
    </div>
  );
}
