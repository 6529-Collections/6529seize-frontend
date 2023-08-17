import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";

const PAGE_SIZE = 30;

interface GlobalTDHHistory {
  date: Date;
  block: number;
  created_tdh: number;
  destroyed_tdh: number;
  net_tdh: number;
  created_boosted_tdh: number;
  destroyed_boosted_tdh: number;
  net_boosted_tdh: number;
  created_tdh__raw: number;
  destroyed_tdh__raw: number;
  net_tdh__raw: number;
  memes_balance: number;
  gradients_balance: number;
}

export default function CommunityStats() {
  const [page, setPage] = useState(1);

  const [tdhHistory, setTdhHistory] = useState<GlobalTDHHistory[]>([]);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/tdh_global_history?page_size=${PAGE_SIZE}&page=${page}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTdhHistory(response.data);
    });
  }, []);

  return (
    <Container className="no-padding">
      <Row>
        <Col>Hi</Col>
      </Row>
    </Container>
  );
}
