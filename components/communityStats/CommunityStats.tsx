import styles from "./CommunityStats.module.scss";
import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import { GlobalTDHHistory } from "../../entities/ITDH";
import { Bar, Line } from "react-chartjs-2";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement
);

export default function CommunityStats() {
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(7);

  const [tdhHistory, setTdhHistory] = useState<GlobalTDHHistory[]>([]);
  const [tdhLabels, setTdhLabels] = useState<Date[]>([]);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/tdh_global_history?page_size=${pageSize}&page=${page}`;
    fetchUrl(url).then((response: DBResponse) => {
      const tdhH = response.data.reverse();
      setTdhHistory(tdhH);
      setTdhLabels(tdhH.map((t) => t.date));
    });
  }, [pageSize]);

  function printNetTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Net Boosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_boosted_tdh
          ),
          borderColor: "#48E85F",
          backgroundColor: "#48E85F",
        },
        {
          label: "Net Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_tdh
          ),
          borderColor: "#3773F2",
          backgroundColor: "#3773F2",
        },
        {
          label: "Net Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_tdh__raw
          ),
          borderColor: "#DB4748",
          backgroundColor: "#DB4748",
        },
      ],
    };

    return (
      <>
        <Bar data={data} />
        <Line data={data} />
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
          borderColor: "#48E85F",
          backgroundColor: "#48E85F",
        },
        {
          label: "Created Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_tdh
          ),
          borderColor: "#3773F2",
          backgroundColor: "#3773F2",
        },
        {
          label: "Created Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_tdh__raw
          ),
          borderColor: "#DB4748",
          backgroundColor: "#DB4748",
        },
      ],
    };

    return (
      <>
        <Bar data={data} />
        <Line data={data} />
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
          borderColor: "#48E85F",
          backgroundColor: "#48E85F",
        },
        {
          label: "Destroyed Unboosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_tdh
          ),
          borderColor: "#3773F2",
          backgroundColor: "#3773F2",
        },
        {
          label: "Destroyed Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_tdh__raw
          ),
          borderColor: "#DB4748",
          backgroundColor: "#DB4748",
        },
      ],
    };

    return (
      <>
        <Bar data={data} />
        <Line data={data} />
      </>
    );
  }

  return (
    <Container>
      <Row>
        <Col sm={12} md={8} className="pt-4">
          <h1 className="mb-0">COMMUNITY STATS</h1>
        </Col>
        <Col
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
        </Col>
      </Row>
      {tdhHistory.length > 0 && (
        <>
          <Row className="pt-4 pb-4">
            <Col sm={12} md={{ span: 10, offset: 1 }}>
              <Container className="no-padding">
                <Row>
                  <h2 className="mb-0 font-color">Net TDH</h2>
                </Row>
                <Row className="pt-4">
                  <Col>{printNetTDH()}</Col>
                </Row>
              </Container>
            </Col>
          </Row>
          <Row className="pt-4 pb-4">
            <Col sm={12} md={{ span: 10, offset: 1 }}>
              <Container className="no-padding">
                <Row>
                  <h2 className="mb-0 font-color">Created TDH</h2>
                </Row>
                <Row className="pt-4">
                  <Col>{printCreatedTDH()}</Col>
                </Row>
              </Container>
            </Col>
          </Row>
          <Row className="pt-4 pb-4">
            <Col sm={12} md={{ span: 10, offset: 1 }}>
              <Container className="no-padding">
                <Row>
                  <h2 className="mb-0 font-color">Destroyed TDH</h2>
                </Row>
                <Row className="pt-4">
                  <Col>{printDestroyedTDH()}</Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
