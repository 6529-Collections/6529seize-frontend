import { Line } from "react-chartjs-2";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
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
import { useMemo } from "react";
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

function getGraphOptions(locale: SupportedLocale) {
  return {
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
            typeof value === "number"
              ? formatTdhHistoryValue(value, locale)
              : value,
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
}

export default function UserPageStatsActivityTDHHistoryChart({
  data,
  locale = DEFAULT_LOCALE,
}: {
  readonly data: ChartProps;
  readonly locale?: SupportedLocale | undefined;
}) {
  const headingId = `tdh-history-chart-${data.id}`;
  const graphOptions = useMemo(() => getGraphOptions(locale), [locale]);

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
          options={graphOptions}
          role="img"
        />
      </div>
    </div>
  );
}
