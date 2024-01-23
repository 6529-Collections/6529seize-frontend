import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import { GlobalTDHHistory } from "../../entities/ITDH";
import { Line } from "react-chartjs-2";
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
import CommunityStatsDaysSelector from "./CommunityStatsDaysSelector";
import CommunityStatsGraphs from "./CommunityStatsGraphs";

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
  const [latestHistory, setLatestHistory] = useState<GlobalTDHHistory>();

  function getEstimatedDaysUntil(x: number) {
    const diff = x - latestHistory!.total_boosted_tdh;
    const days = diff / latestHistory!.net_boosted_tdh;
    return Math.round(days);
  }

  return (
    <Container>
      <Row>
        <Col sm={12} md={8} className="pt-4">
          <h1 className="mb-0">COMMUNITY STATS</h1>
        </Col>
      </Row>
      {latestHistory && (
        <Row className="pt-4 pb-4 font-bolder">
          <Col sm={12} md={{ span: 10, offset: 1 }}>
            <Container className="no-padding">
              <Row>
                <Col sm={12} md={6} lg={4} className="d-flex flex-column gap-2">
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
                        <td>Estimated days until 250M</td>
                        <td className="text-right">
                          {numberWithCommas(getEstimatedDaysUntil(250000000))}
                        </td>
                      </tr>
                      <tr>
                        <td>Estimated days until 500M</td>
                        <td className="text-right">
                          {numberWithCommas(getEstimatedDaysUntil(500000000))}
                        </td>
                      </tr>
                      <tr>
                        <td>Estimated days until 1B</td>
                        <td className="text-right">
                          {numberWithCommas(getEstimatedDaysUntil(1000000000))}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      )}
      <Row>
        <Col>
          <CommunityStatsGraphs setLatestHistory={setLatestHistory} />
        </Col>
      </Row>
    </Container>
  );
}
