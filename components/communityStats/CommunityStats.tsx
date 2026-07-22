"use client";

import { publicEnv } from "@/config/env";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { GlobalTDHHistory } from "@/entities/ITDH";
import { numberWithCommas } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t as translate, type MessageKey } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
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
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement
);

type NetworkStatsMessageKey = Extract<MessageKey, `network.stats.${string}`>;

const SECTION_HEADING_CLASS =
  "tw-m-0 tw-text-lg tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl";
const SUMMARY_PANEL_CLASS =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-p-3 sm:tw-p-4";

const m = (
  locale: SupportedLocale,
  key: NetworkStatsMessageKey,
  params: Parameters<typeof translate>[2] = {}
) => translate(locale, key, params);

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

export default function CommunityStats() {
  const locale = useBrowserLocale();

  useSetTitle("Stats | Network");

  const page = 1;
  const pageSize = 10;

  const [tdhHistory, setTdhHistory] = useState<GlobalTDHHistory[]>([]);
  const [latestHistory, setLatestHistory] = useState<GlobalTDHHistory>();
  const [tdhLabels, setTdhLabels] = useState<Date[]>([]);

  function getEstimatedDaysUntil(history: GlobalTDHHistory, x: number) {
    const diff = x - history.total_boosted_tdh;
    const days = diff / history.net_boosted_tdh;
    return Math.round(days);
  }

  function formatTdh(x: number): string {
    if (x >= 1_000_000_000) return `${x / 1_000_000_000}B`;
    if (x >= 1_000_000) return `${x / 1_000_000}M`;
    if (x >= 1_000) return `${x / 1_000}K`;
    return `${x}`;
  }

  function getNextCheckpoints(
    current: number,
    count = 3,
    step = 250_000_000
  ): number[] {
    const next = Math.ceil(current / step) * step;
    return Array.from({ length: count }, (_, i) => next + i * step);
  }

  function printEstimatedDaysUntilCheckpoints(history: GlobalTDHHistory) {
    const checkpoints = getNextCheckpoints(history.total_boosted_tdh);
    return checkpoints.map((x) => (
      <tr
        className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] last:tw-border-b-0"
        key={x}
      >
        <th
          scope="row"
          className="tw-py-1 tw-text-left tw-text-sm tw-font-normal tw-text-iron-400 sm:tw-py-1.5"
        >
          {m(locale, "network.stats.summary.estimatedDays", {
            target: formatTdh(x),
          })}
        </th>
        <td className="tw-py-1 tw-text-right tw-font-mono tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100 sm:tw-py-1.5">
          {numberWithCommas(getEstimatedDaysUntil(history, x))}
        </td>
      </tr>
    ));
  }

  useEffect(() => {
    const url = `${publicEnv.API_ENDPOINT}/api/tdh_global_history?page_size=${pageSize}&page=${page}`;
    void fetchUrl<DBResponse<GlobalTDHHistory>>(url)
      .then((response) => {
        const tdhH = response.data.reverse();
        setTdhHistory(tdhH);
        setTdhLabels(tdhH.map((t) => t.date));
        setLatestHistory(tdhH[tdhH.length - 1]);
      })
      .catch(() => undefined);
  }, [pageSize]);

  function printTotalTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Total Boosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.total_boosted_tdh
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Total Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.total_tdh
          ),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Total Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.total_tdh__raw
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    return (
      <>
        <Bar
          data={data}
          options={GRAPH_OPTIONS}
          role="img"
          aria-label="Bar chart comparing total boosted, unboosted, and unweighted TDH over time."
        />
        {/* <Line data={data} /> */}
      </>
    );
  }

  function printNetTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Net Boosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_boosted_tdh
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Net Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_tdh
          ),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Net Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_tdh__raw
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    return (
      <>
        <Bar
          data={data}
          options={GRAPH_OPTIONS}
          role="img"
          aria-label="Bar chart comparing daily net boosted, unboosted, and unweighted TDH changes."
        />
        {/* <Line data={data} /> */}
      </>
    );
  }

  function printCreatedTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Created Boosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_boosted_tdh
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Created Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_tdh
          ),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Created Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_tdh__raw
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    return (
      <>
        <Bar
          data={data}
          options={GRAPH_OPTIONS}
          role="img"
          aria-label="Bar chart comparing daily created boosted, unboosted, and unweighted TDH."
        />
        {/* <Line data={data} /> */}
      </>
    );
  }

  function printDestroyedTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Destroyed Boosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_boosted_tdh
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Destroyed Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_tdh
          ),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Destroyed Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_tdh__raw
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    return (
      <>
        <Bar
          data={data}
          options={GRAPH_OPTIONS}
          role="img"
          aria-label="Bar chart comparing daily destroyed boosted, unboosted, and unweighted TDH."
        />
        {/* <Line data={data} /> */}
      </>
    );
  }

  return (
    <section className="tw-w-full">
      <header className="tw-pb-6 sm:tw-pb-8">
        <h1 className="tw-m-0 tw-text-[22px] tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
          {m(locale, "network.stats.hero.title")}
        </h1>
      </header>
      {tdhHistory.length > 0 && (
        <>
          <section className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pb-8 sm:tw-gap-6 md:tw-grid-cols-2">
            <div className={SUMMARY_PANEL_CLASS}>
              <table className="tw-m-0 tw-w-full">
                <tbody>
                  <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07]">
                    <th
                      scope="row"
                      className="tw-py-1 tw-text-left tw-text-sm tw-font-normal tw-text-iron-400 sm:tw-py-1.5"
                    >
                      {m(locale, "network.stats.summary.networkTdh")}
                    </th>
                    <td className="tw-py-1 tw-text-right tw-font-mono tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100 sm:tw-py-1.5">
                      {numberWithCommas(latestHistory!.total_boosted_tdh)}
                    </td>
                  </tr>
                  <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07]">
                    <th
                      scope="row"
                      className="tw-py-1 tw-text-left tw-text-sm tw-font-normal tw-text-iron-400 sm:tw-py-1.5"
                    >
                      {m(locale, "network.stats.summary.dailyChange")}
                    </th>
                    <td className="tw-py-1 tw-text-right tw-font-mono tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100 sm:tw-py-1.5">
                      {numberWithCommas(latestHistory!.net_boosted_tdh)}
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="tw-py-1 tw-text-left tw-text-sm tw-font-normal tw-text-iron-400 sm:tw-py-1.5"
                    >
                      {m(locale, "network.stats.summary.dailyPercentChange")}
                    </th>
                    <td className="tw-py-1 tw-text-right tw-font-mono tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100 sm:tw-py-1.5">
                      {(
                        (latestHistory!.net_boosted_tdh /
                          latestHistory!.total_boosted_tdh) *
                        100
                      ).toFixed(2)}
                      %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={SUMMARY_PANEL_CLASS}>
              {latestHistory && (
                <table className="tw-m-0 tw-w-full">
                  <tbody>
                    {printEstimatedDaysUntilCheckpoints(latestHistory)}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          <section
            className="tw-pb-8 sm:tw-pb-12"
            aria-labelledby="network-stats-total-tdh-heading"
          >
            <h2
              id="network-stats-total-tdh-heading"
              className={SECTION_HEADING_CLASS}
            >
              {m(locale, "network.stats.charts.total")}
            </h2>
            <div className="tw-flex tw-justify-center tw-pt-4">
              {printTotalTDH()}
            </div>
          </section>
          <section
            className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-py-8 sm:tw-py-12"
            aria-labelledby="network-stats-net-tdh-heading"
          >
            <h2
              id="network-stats-net-tdh-heading"
              className={SECTION_HEADING_CLASS}
            >
              {m(locale, "network.stats.charts.netDailyChange")}
            </h2>
            <div className="tw-flex tw-justify-center tw-pt-4">
              {printNetTDH()}
            </div>
          </section>
          <section
            className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-py-8 sm:tw-py-12"
            aria-labelledby="network-stats-created-tdh-heading"
          >
            <h2
              id="network-stats-created-tdh-heading"
              className={SECTION_HEADING_CLASS}
            >
              {m(locale, "network.stats.charts.createdDailyChange")}
            </h2>
            <div className="tw-flex tw-justify-center tw-pt-4">
              {printCreatedTDH()}
            </div>
          </section>
          <section
            className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-py-8 sm:tw-py-12"
            aria-labelledby="network-stats-destroyed-tdh-heading"
          >
            <h2
              id="network-stats-destroyed-tdh-heading"
              className={SECTION_HEADING_CLASS}
            >
              {m(locale, "network.stats.charts.destroyedChange")}
            </h2>
            <div className="tw-flex tw-justify-center tw-pt-4">
              {printDestroyedTDH()}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
