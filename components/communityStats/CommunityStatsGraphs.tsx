import { Container, Row, Col } from "react-bootstrap";
import CommunityStatsDaysSelector from "./CommunityStatsDaysSelector";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { DBResponse } from "../../entities/IDBResponse";
import { GlobalTDHHistory, TDHHistory } from "../../entities/ITDH";
import { fetchUrl } from "../../services/6529api";
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

export default function CommunityStatsGraphs(
  props: Readonly<{
    wallet?: string;
    setLatestHistory?: (history: any) => void;
  }>
) {
  const [tdhHistory, setTdhHistory] = useState<
    TDHHistory[] | GlobalTDHHistory[]
  >([]);
  const [tdhLabels, setTdhLabels] = useState<Date[]>([]);
  const [tdhHistoryLoaded, setTdhHistoryLoaded] = useState(false);

  const [pageSize, setPageSize] = useState(30);

  useEffect(() => {
    setTdhHistoryLoaded(false);
  }, [pageSize]);

  useEffect(() => {
    if (tdhHistoryLoaded) {
      return;
    }

    let url = `${process.env.API_ENDPOINT}/api/${
      props.wallet
        ? `tdh_history?wallet=${props.wallet}`
        : "tdh_global_history?"
    }&page_size=${pageSize}&page=1`;
    fetchUrl(url).then((response: DBResponse) => {
      const tdhH = response.data;
      tdhH.reverse();
      setTdhHistory(tdhH);
      if (props.setLatestHistory) {
        props.setLatestHistory(tdhH[tdhH.length - 1]);
      }
      setTdhLabels(tdhH.map((t) => t.date));
      setTdhHistoryLoaded(true);
    });
  }, [pageSize, tdhHistoryLoaded]);

  function printTotalTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Total Boosted TDH",
          data: tdhLabels.map((l) => {
            const a: any = tdhHistory.find((t) => t.date === l);
            if (!a) {
              return 0;
            }
            if (a.total_boosted_tdh) {
              return a.total_boosted_tdh;
            }
            return a.boosted_tdh;
          }),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Total Unboosted TDH",
          data: tdhLabels.map((l) => {
            const a: any = tdhHistory.find((t) => t.date === l);
            if (!a) {
              return 0;
            }
            if (a.total_tdh) {
              return a.total_tdh;
            }
            return a.tdh;
          }),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Total Unweighted TDH",
          data: tdhLabels.map((l) => {
            const a: any = tdhHistory.find((t) => t.date === l);
            if (!a) {
              return 0;
            }
            if (a.total_tdh__raw) {
              return a.total_tdh__raw;
            }
            return a.tdh__raw;
          }),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    return (
      <>
        {/* <Bar data={data} options={GRAPH_OPTIONS} /> */}
        <Line data={data} options={GRAPH_OPTIONS} />
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
        {/* <Bar data={data} options={GRAPH_OPTIONS} /> */}
        <Line data={data} options={GRAPH_OPTIONS} />
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
        {/* <Bar data={data} options={GRAPH_OPTIONS} /> */}
        <Line data={data} options={GRAPH_OPTIONS} />
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
        {/* <Bar data={data} options={GRAPH_OPTIONS} /> */}
        <Line data={data} options={GRAPH_OPTIONS} />
      </>
    );
  }

  if (!tdhHistory.length && tdhHistoryLoaded) {
    return <></>;
  }

  return (
    <Container>
      <Row className="pt-3">
        <Col className="d-flex align-items-center">
          <h3 className="mb-0">Graphs</h3>
        </Col>
        <Col>
          <CommunityStatsDaysSelector
            loaded={tdhHistoryLoaded}
            page_size={pageSize}
            setPageSize={setPageSize}
          />
        </Col>
      </Row>
      <Row className="pt-4 pb-4">
        <Col sm={12} md={{ span: 10, offset: 1 }}>
          <Container className="no-padding">
            <Row>
              <h2 className="mb-0 font-color">Total TDH</h2>
            </Row>
            <Row className="pt-4">
              <Col>{tdhHistory.length > 0 && <>{printTotalTDH()}</>}</Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-4 pb-4">
        <Col sm={12} md={{ span: 10, offset: 1 }}>
          <Container className="no-padding">
            <Row>
              <h2 className="mb-0 font-color">Net TDH Daily Change</h2>
            </Row>
            <Row className="pt-4">
              <Col>{tdhHistory.length > 0 && <>{printNetTDH()}</>}</Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-4 pb-4">
        <Col sm={12} md={{ span: 10, offset: 1 }}>
          <Container className="no-padding">
            <Row>
              <h2 className="mb-0 font-color">Created TDH Daily Change</h2>
            </Row>
            <Row className="pt-4">
              <Col>{tdhHistory.length > 0 && <>{printCreatedTDH()}</>}</Col>
            </Row>
          </Container>
        </Col>
      </Row>
      {tdhHistory.some((t) => t.destroyed_boosted_tdh > 0) && (
        <Row className="pt-4 pb-4">
          <Col sm={12} md={{ span: 10, offset: 1 }}>
            <Container className="no-padding">
              <Row>
                <h2 className="mb-0 font-color">Destroyed TDH Daily Change</h2>
              </Row>
              <Row className="pt-4">
                <Col>{tdhHistory.length > 0 && <>{printDestroyedTDH()}</>}</Col>
              </Row>
            </Container>
          </Col>
        </Row>
      )}
    </Container>
  );
}
