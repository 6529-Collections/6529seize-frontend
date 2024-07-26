import styles from "./CommunityStats.module.scss";
import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import { GlobalTDHHistory } from "../../entities/ITDH";
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
import { numberWithCommas } from "../../helpers/Helpers";

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
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [tdhHistory, setTdhHistory] = useState<GlobalTDHHistory[]>([]);
  const [latestHistory, setLatestHistory] = useState<GlobalTDHHistory>();
  const [tdhLabels, setTdhLabels] = useState<Date[]>([]);

  function getEstimatedDaysUntil(x: number) {
    const diff = x - latestHistory!.total_boosted_tdh;
    const days = diff / latestHistory!.net_boosted_tdh;
    return Math.round(days);
  }

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/tdh_global_history?page_size=${pageSize}&page=${page}`;
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
          <h1 className="mb-0">
            <span className="font-lightest">Community</span> Stats
          </h1>
        </Col>
        {/* <Col
          sm={12}
          md={4}
          className="d-flex align-items-center justify-content-end gap-2 pt-4">
          <span
            className={`${styles.timeSelectionSpan} ${
              pageSize == 7 ? styles.timeSelectionSpanSelected : ""
            }`}
            onClick={() => setPageSize(7)}>
            7D
          </span>
          <span
            className={`${styles.timeSelectionSpan} ${
              pageSize == 30 ? styles.timeSelectionSpanSelected : ""
            }`}
            onClick={() => setPageSize(30)}>
            1M
          </span>
        </Col> */}
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
                          <td>Community TDH</td>
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
                    <Table>
                      <tbody>
                        <tr>
                          <td>Estimated days until 500M</td>
                          <td className="text-right">
                            {numberWithCommas(getEstimatedDaysUntil(500000000))}
                          </td>
                        </tr>
                        <tr>
                          <td>Estimated days until 750M</td>
                          <td className="text-right">
                            {numberWithCommas(getEstimatedDaysUntil(750000000))}
                          </td>
                        </tr>
                        <tr>
                          <td>Estimated days until 1B</td>
                          <td className="text-right">
                            {numberWithCommas(
                              getEstimatedDaysUntil(1000000000)
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
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
