import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import levels from '../../levels.json';
import { useEffect, useState, useMemo } from 'react';

ChartJS.register(CategoryScale, LogarithmicScale, PointElement, LineElement, Filler, Tooltip);

interface LevelData {
  level: number;
  threshold: number;
}

export default function ProgressChart() {
  /* ───────────── prefers-reduced-motion ───────────── */
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  /* ───────────── prepare data ───────────── */
  const filtered = useMemo(
    () => (levels as LevelData[]).filter(l => l.threshold > 0),
    []
  );

  const data = {
    labels: filtered.map(l => l.level),
    datasets: [
      {
        label: 'TDH + Rep',
        data: filtered.map(l => l.threshold),
        fill: 'start' as const,
        tension: 0.15,
        borderColor: '#84ADFF',
        backgroundColor: 'rgba(132, 173, 255, 0.2)',
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
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E5E5' },
      },
      y: {
        type: 'logarithmic' as const,
        min: 1,
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E5E5' },
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
    animation: prefersReducedMotion ? false : undefined,
    hover: {
      onHover: (_: any, active) => {
        if (active.length > 0) {
          const idx = active[0].index;
          const level = filtered[idx].level;
          window.dispatchEvent(
            new CustomEvent('level-hover', { detail: { level } })
          );
        }
      },
    },
  };

  return (
    <div className="tw-w-full tw-h-[180px] md:tw-h-[280px]" tabIndex={0}>
      <Line data={data} options={options} />
    </div>
  );
}
