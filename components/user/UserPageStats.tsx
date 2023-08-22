import styles from "./UserPage.module.scss";
import Image from "next/image";
import { Col, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import {
  areEqualAddresses,
  formatAddress,
  numberWithCommas,
} from "../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../constants";
import { ConsolidatedTDHMetrics, TDHHistory } from "../../entities/ITDH";
import { fetchUrl } from "../../services/6529api";
import Pagination from "../pagination/Pagination";
import { IDistribution } from "../../entities/IDistribution";
import { VIEW } from "../consolidation-switch/ConsolidationSwitch";
import { Line } from "react-chartjs-2";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  show: boolean;
  ownerAddress: `0x${string}` | undefined;
}

export default function UserPageStats(props: Props) {
  const [tdhHistory, setTdhHistory] = useState<TDHHistory[]>([]);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/tdh_history?wallet=${props.ownerAddress}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTdhHistory(response.data);
    });
  }, [props.ownerAddress]);

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
          label: "Created TDH",
          data: labels.map(
            (l) => tdhHistory.find((t) => t.date === l)?.created_boosted_tdh
          ),
          borderColor: "#3773F2",
          backgroundColor: "#3773F2",
        },
        {
          label: "Destroyed TDH",
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

  if (props.show) {
    return (
      <>
        <Row>
          <Col
            className="d-flex align-items-center"
            xs={{ span: 7 }}
            sm={{ span: 7 }}
            md={{ span: 9 }}
            lg={{ span: 10 }}>
            <h3>Distributions</h3>
          </Col>
        </Row>
        <Row className={`pt-2`}>
          <Col>
            {tdhHistory.length > 0 ? (
              printTDHLines()
            ) : (
              <>
                <Image
                  width="0"
                  height="0"
                  style={{ height: "auto", width: "100px" }}
                  src="/SummerGlasses.svg"
                  alt="SummerGlasses"
                />{" "}
                Nothing here yet
              </>
            )}
          </Col>
        </Row>
      </>
    );
  } else {
    return <></>;
  }
}
