"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  LogarithmicScale,
  type TooltipItem,
} from "chart.js";
import levels from "@/constants/levels.json";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  LogarithmicScale
);

interface LevelData {
  level: number;
  threshold: number;
}

export default function ProgressChart() {
  const locale = useBrowserLocale();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPrefersReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    }
  }, []);

  const data = {
    labels: (levels as LevelData[]).map((l) => l.level),
    datasets: [
      {
        label: t(locale, "network.levels.table.tdhRep"),
        data: (levels as LevelData[]).map((l) => l.threshold),
        fill: "start" as const,
        tension: 0.15,
        borderColor: "#84ADFF",
        backgroundColor: "rgba(132, 173, 255, 0.2)",
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.1)" },
        ticks: { color: "#E5E5E5" },
      },
      y: {
        type: "logarithmic" as const,
        grid: { color: "rgba(255,255,255,0.1)" },
        ticks: { color: "#E5E5E5" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"line">) =>
            t(locale, "network.levels.chart.tooltip", {
              level: ctx.label,
              threshold: formatInteger(locale, ctx.parsed.y ?? 0),
            }),
        },
      },
    },
    animation: prefersReducedMotion ? (false as const) : undefined,
  };

  const accessibleLabel = t(locale, "network.levels.chart.accessibleLabel");

  return (
    <div className="tw-h-[180px] tw-w-full md:tw-h-[280px]">
      <Line
        aria-label={accessibleLabel}
        data={data}
        fallbackContent={accessibleLabel}
        options={options}
        role="img"
      />
    </div>
  );
}
