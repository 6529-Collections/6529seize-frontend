"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  LogarithmicScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

import levels from "@/constants/levels.json";


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
        label: "TDH + Rep",
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
          label: (ctx: any) =>
            `Level ${ctx.label}: ${ctx.parsed.y.toLocaleString()} TDH+Rep`,
        },
      },
    },
    animation: prefersReducedMotion ? (false as const) : undefined,
    onHover: (_: any, activeElements: any[]) => {
      if (activeElements.length > 0) {
        const idx = activeElements[0].index;
        const level = (levels as LevelData[])[idx]?.level;
        window.dispatchEvent(
          new CustomEvent("level-hover", { detail: { level } })
        );
      }
    },
  };

  return (
    <div className="tw-h-[180px] tw-w-full md:tw-h-[280px]">
      <Line data={data} options={options} />
    </div>
  );
}
