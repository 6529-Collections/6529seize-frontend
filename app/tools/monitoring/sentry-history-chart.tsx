import type { ApiMonitoringSentryHistory } from "@/generated/models/ApiMonitoringSentryHistory";
import { formatDate, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// Primary blue and amber identify series; shape/dashes distinguish projects too.
const COLORS = ["#528BFF", "#fbbf24", "#a78bfa", "#34d399", "#fb7185"];

export default function SentryHistoryChart({
  history,
  metric,
  locale,
}: {
  readonly history: ApiMonitoringSentryHistory;
  readonly metric: "events" | "issues";
  readonly locale: SupportedLocale;
}) {
  const label = t(locale, `monitoring.sentry.history.${metric}`);
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    locale,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        grid: { color: "rgb(45, 45, 45)" },
        ticks: {
          color: "rgb(173, 173, 173)",
          maxTicksLimit: 6,
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgb(45, 45, 45)" },
        ticks: {
          color: "rgb(173, 173, 173)",
          precision: 0,
          callback: (value) =>
            typeof value === "number" ? formatNumber(locale, value) : value,
        },
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "rgb(200, 200, 200)", usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label ?? ""}: ${formatNumber(locale, context.parsed.y)}`,
        },
      },
    },
  };
  const dates = history.projects[0]?.days.map((day) => day.date) ?? [];
  return (
    <div className="tw-relative tw-h-64 tw-min-w-0">
      <Line
        role="img"
        aria-label={t(locale, "monitoring.sentry.history.chart", {
          metric: label,
        })}
        options={options}
        data={{
          labels: dates.map((date) =>
            formatDate(locale, date, {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })
          ),
          datasets: history.projects.map((project, index) => ({
            label: project.project,
            data: project.days.map((day) => day[metric]),
            borderColor: COLORS[index % COLORS.length],
            backgroundColor: COLORS[index % COLORS.length],
            borderDash: index % 2 === 0 ? [] : [5, 4],
            pointStyle: index % 2 === 0 ? "circle" : "rectRot",
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 2,
            spanGaps: false,
          })),
        }}
      />
    </div>
  );
}
