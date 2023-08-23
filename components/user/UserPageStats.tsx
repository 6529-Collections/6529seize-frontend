import styles from "./UserPage.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { TDHHistory } from "../../entities/ITDH";
import { fetchUrl } from "../../services/6529api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

interface Props {
  show: boolean;
  ownerAddress: `0x${string}` | undefined;
}

export default function UserPageStats(props: Props) {
  const [tdhHistory, setTdhHistory] = useState<TDHHistory[]>([]);
  const [tdhLabels, setTdhLabels] = useState<Date[]>([]);
  const [pageSize, setPageSize] = useState(7);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/tdh_history?wallet=${props.ownerAddress}&page_size=${pageSize}`;
    fetchUrl(url).then((response: DBResponse) => {
      const tdhH = response.data.reverse();
      setTdhHistory(tdhH);
      setTdhLabels(tdhH.map((t) => t.date));
    });
  }, [props.ownerAddress, pageSize]);

  function printNetTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Net TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.net_boosted_tdh
          ),
          borderColor: "#48E85F",
          backgroundColor: "#48E85F",
        },
      ],
    };

    return <Line data={data} />;
  }

  function printCreatedTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Created TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_boosted_tdh
          ),
          borderColor: "#3773F2",
          backgroundColor: "#3773F2",
        },
      ],
    };

    return <Line data={data} />;
  }

  function printDestroyedTDH() {
    const data = {
      labels: tdhLabels,
      datasets: [
        {
          label: "Destroyed TDH",
          data: tdhLabels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.destroyed_boosted_tdh
          ),
          borderColor: "#DB4748",
          backgroundColor: "#DB4748",
        },
      ],
    };

    return <Line data={data} />;
  }

  if (props.show && tdhHistory.length > 0) {
    return (
      <>
        <Row className="pt-3">
          <Col className="d-flex align-items-center justify-content-end gap-2 pt-4">
            <span
              className={`${styles.statsTimeSelectionSpan} ${
                pageSize == 7 ? styles.statsTimeSelectionSpanSelected : ""
              }`}
              onClick={() => setPageSize(7)}>
              7D
            </span>
            <span
              className={`${styles.statsTimeSelectionSpan} ${
                pageSize == 30 ? styles.statsTimeSelectionSpanSelected : ""
              }`}
              onClick={() => setPageSize(30)}>
              1M
            </span>
          </Col>
        </Row>
        <Row className="pt-4 pb-4">
          <Col sm={12} md={{ span: 10, offset: 1 }}>
            <Container className="no-padding">
              <Row>
                <h2 className="mb-0 font-color">Net TDH</h2>
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
                <h2 className="mb-0 font-color">Created TDH</h2>
              </Row>
              <Row className="pt-4">
                <Col>{tdhHistory.length > 0 && <>{printCreatedTDH()}</>}</Col>
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
                <Col>{tdhHistory.length > 0 && <>{printDestroyedTDH()}</>}</Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </>
    );
  } else {
    return <></>;
  }
}
