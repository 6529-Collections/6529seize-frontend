import { Line } from "react-chartjs-2";
import { Col, Container, Row } from "react-bootstrap";
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
import { useEffect, useState } from "react";
import { TDHHistory } from "../../../entities/ITDH";
import { fetchUrl } from "../../../services/6529api";
import { DBResponse } from "../../../entities/IDBResponse";
import CommunityStatsDaysSelector from "../../communityStats/CommunityStatsDaysSelector";

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
export default function UserPageStatsTDHcharts({
  mainAddress,
}: {
  readonly mainAddress: string;
}) {
  const [tdhHistory, setTdhHistory] = useState<TDHHistory[]>([]);
  const [tdhLabels, setTdhLabels] = useState<Date[]>([]);
  const [tdhHistoryLoaded, setTdhHistoryLoaded] = useState(false);

  const [pageSize, setPageSize] = useState(30);

  useEffect(() => {
    setTdhHistoryLoaded(false);
  }, [mainAddress, pageSize]);

  useEffect(() => {
    if (tdhHistoryLoaded) {
      return;
    }

    let url = `${process.env.API_ENDPOINT}/api/tdh_history?wallet=${mainAddress}&page_size=${pageSize}`;
    fetchUrl(url).then((response: DBResponse) => {
      const tdhH = response.data.reverse();
      setTdhHistory(tdhH);
      setTdhLabels(tdhH.map((t) => t.date));
      setTdhHistoryLoaded(true);
    });
  }, [mainAddress, pageSize, tdhHistoryLoaded]);

  function printTotalTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Total Boosted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.boosted_tdh
          ),
          borderColor: "#00DC21",
          backgroundColor: "#00DC21",
        },
        {
          label: "Total Unboosted TDH",
          data: tdhLabels.map((l) => tdhHistory.find((t) => t.date === l)?.tdh),
          borderColor: "#1861FF",
          backgroundColor: "#1861FF",
        },
        {
          label: "Total Unweighted TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.tdh__raw
          ),
          borderColor: "#e55137",
          backgroundColor: "#e55137",
        },
      ],
    };

    return (
      <>
        {/* <Bar data={data} options={GRAPH_OPTIONS} /> */}
        <Line data={data} />
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
        <Line data={data} />
      </>
    );
  }

  if (!tdhHistory.length && tdhHistoryLoaded) {
    return <></>;
  }

  return (
    <Container className="no-padding">
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
