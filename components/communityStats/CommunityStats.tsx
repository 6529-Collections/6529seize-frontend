"use client";

import { publicEnv } from "@/config/env";
import { useSetTitle } from "@/contexts/TitleContext";
import { DBResponse } from "@/entities/IDBResponse";
import { GlobalTDHHistory } from "@/entities/ITDH";
import { numberWithCommas } from "@/helpers/Helpers";
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
import { Col, Container, Row, Table } from "react-bootstrap";
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
      <tr key={x}>
        <td>Estimated days until {formatTdh(x)}</td>
        <td className="text-right">
          {numberWithCommas(getEstimatedDaysUntil(history, x))}
        </td>
      </tr>
    ));
  }

  useEffect(() => {
    let url = `${publicEnv.API_ENDPOINT}/api/tdh_global_history?page_size=${pageSize}&page=${page}`;
    fetchUrl(url).then((response: DBResponse) => {
      const tdhH = response.data.reverse();
      setTdhHistory(tdhH);
      setTdhLabels(tdhH.map((t) => t.date));
      setLatestHistory(tdhH[tdhH.length - 1]);
    });
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
        <Bar data={data} options={GRAPH_OPTIONS} />
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
        <Bar data={data} options={GRAPH_OPTIONS} />
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
        <Bar data={data} options={GRAPH_OPTIONS} />
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
        <Bar data={data} options={GRAPH_OPTIONS} />
        {/* <Line data={data} /> */}
      </>
    );
  }

  return (
    <Container>
      <Row>
        <Col sm={12} md={8} className="pt-4">
          <h1 className="mb-0">Network Stats</h1>
        </Col>
      </Row>
      {tdhHistory.length > 0 && (
        <>
          <Row className="pt-4 pb-4 font-bolder">
            <Col>
              <Container className="no-padding">
                <Row>
                  <Col
                    sm={12}
                    md={6}
                    lg={4}
                    className="d-flex flex-column gap-2">
                    <Table>
                      <tbody>
                        <tr>
                          <td>Network TDH</td>
                          <td className="text-right">
                            {numberWithCommas(latestHistory!.total_boosted_tdh)}
                          </td>
                        </tr>
                        <tr>
                          <td>Daily Change</td>
                          <td className="text-right">
                            {numberWithCommas(latestHistory!.net_boosted_tdh)}
                          </td>
                        </tr>
                        <tr>
                          <td>Daily % Change</td>
                          <td className="text-right">
                            {(
                              (latestHistory!.net_boosted_tdh /
                                latestHistory!.total_boosted_tdh) *
                              100
                            ).toFixed(2)}
                            %
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col sm={12} md={6} lg={{ span: 4, offset: 4 }}>
                    {latestHistory && (
                      <Table>
                        <tbody>
                          {printEstimatedDaysUntilCheckpoints(latestHistory)}
                        </tbody>
                      </Table>
                    )}
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
          <Row className="pt-4 pb-4">
            <Col>
              <Container className="no-padding">
                <Row>
                  <h2 className="mb-0 font-color">Total TDH</h2>
                </Row>
                <Row className="pt-4">
                  <Col className="d-flex justify-content-center">
                    {printTotalTDH()}
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
          <Row className="pt-4 pb-4">
            <Col>
              <Container className="no-padding">
                <Row>
                  <h2 className="mb-0 font-color">Net TDH Daily Change</h2>
                </Row>
                <Row className="pt-4">
                  <Col className="d-flex justify-content-center">
                    {printNetTDH()}
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
          <Row className="pt-4 pb-4">
            <Col>
              <Container className="no-padding">
                <Row>
                  <h2 className="mb-0 font-color">Created TDH Daily Change</h2>
                </Row>
                <Row className="pt-4">
                  <Col className="d-flex justify-content-center">
                    {printCreatedTDH()}
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
          <Row className="pt-4 pb-4">
            <Col>
              <Container className="no-padding">
                <Row>
                  <h2 className="mb-0 font-color">Destroyed TDH Change</h2>
                </Row>
                <Row className="pt-4">
                  <Col className="d-flex justify-content-center">
                    {printDestroyedTDH()}
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
