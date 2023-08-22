import styles from "./CommunityStats.module.scss";
import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import { GlobalTDHHistory } from "../../entities/ITDH";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";

const PAGE_SIZE = 30;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export default function CommunityStats() {
  const [page, setPage] = useState(1);

  const [tdhHistory, setTdhHistory] = useState<GlobalTDHHistory[]>([]);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/tdh_global_history?page_size=${PAGE_SIZE}&page=${page}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTdhHistory(response.data);
    });
  }, []);

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getLabels(): string[] {
    const today = new Date();
    const dates = [];

    for (let i = 29; i >= 0; i--) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - i);
      dates.push(formatDate(currentDate));
    }

    return dates;
  }

  function printTDHLines() {
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: false,
        },
      },
    };
    // const labels = getLabels();
    const labels = tdhHistory.map((t) => t.date);
    const data = {
      labels,
      datasets: [
        {
          label: "Net TDH",
          data: labels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_boosted_tdh
          ),
          borderColor: "#48E85F",
          backgroundColor: "#48E85F",
        },
        {
          label: "Total Created TDH",
          data: labels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_boosted_tdh
          ),
          borderColor: "#3773F2",
          backgroundColor: "#3773F2",
        },
        {
          label: "Total Destroyed TDH",
          data: labels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_boosted_tdh
          ),
          borderColor: "#DB4748",
          backgroundColor: "#DB4748",
        },
      ],
    };

    return (
      <>
        <Row className="pt-2 pb-4">
          <Col>
            <h2 className="mb-0 font-color">TDH Day Change</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <Line options={options} data={data} />
          </Col>
        </Row>
      </>
    );
  }

  function printTDHPie() {
    const history = tdhHistory[tdhHistory.length - 1];
    const pieData = {
      labels: ["Memes", "Gradients"],
      datasets: [
        {
          label: "TDH",
          data: [history.memes_boosted_tdh, history.gradients_boosted_tdh],
          backgroundColor: ["#3773F2", "#DB4748"],
          borderColor: ["#3773F2", "#DB4748"],
          borderWidth: 1,
        },
      ],
    };
    const barOptions = {
      indexAxis: "y" as const,
      elements: {
        bar: {
          borderWidth: 2,
        },
      },
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
      },
    };
    const barData = {
      labels: ["Count"],
      datasets: [
        {
          label: "Total Individual Addresses",
          data: [history.total_wallets],
          borderColor: "#3773F2",
          backgroundColor: "#3773F2",
        },
        {
          label: "Total Consolidated Addresses",
          data: [history.total_consolidated_wallets],
          borderColor: "#DB4748",
          backgroundColor: "#DB4748",
        },
      ],
    };
    return (
      <>
        <Row className="pt-5 pb-2">
          <Col xs={{ span: 12 }} sm={{ span: 6 }} className="pt-2 pb-2">
            <Container fluid className="no-padding">
              <Row>
                <Col>
                  <h2 className="mb-0 font-color">TDH Split Memes/Gradients</h2>
                </Col>
              </Row>
              <Row className="pt-2 pb-2">
                <Col xs={{ span: 8, offset: 2 }}>{<Pie data={pieData} />}</Col>
              </Row>
            </Container>
          </Col>
          <Col xs={{ span: 12 }} sm={{ span: 6 }} className="pt-2 pb-2">
            <Container fluid className="no-padding">
              <Row>
                <Col>
                  <h2 className="mb-0 font-color">Address Counts</h2>
                </Col>
              </Row>
              <Row className="pt-2 pb-2">
                <Col>{<Bar options={barOptions} data={barData} />}</Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <Container className="no-padding">
      {tdhHistory.length > 0 && (
        <>
          {printTDHLines()}
          {printTDHPie()}
        </>
      )}
    </Container>
  );
}
