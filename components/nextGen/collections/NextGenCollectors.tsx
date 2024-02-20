import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { DBResponse } from "../../../entities/IDBResponse";
import { NextgenTraitSet } from "../../../entities/INextgen";
import { commonApiFetch } from "../../../services/api/common-api";

const PAGE_SIZE = 25;

export default function NextGenCollectors() {
  const [page, setPage] = useState(1);

  const [sets, setSets] = useState<NextgenTraitSet[]>([]);
  const [setsLoaded, setSetsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  function fetchResults(mypage: number) {
    setSetsLoaded(false);
    let statusFilter = "";
    // if (selectedStatus !== StatusFilter.ALL) {
    //   statusFilter = `&status=${selectedStatus}`;
    // }

    let url = `${process.env.API_ENDPOINT}/api/nextgen/collections?page_size=${PAGE_SIZE}&page=${mypage}${statusFilter}`;

    commonApiFetch<DBResponse>({
      endpoint: url,
    }).then((response) => {
      setTotalResults(response.count);
      setSets(response.data);
      setSetsLoaded(true);
    });
  }

  // useEffect(() => {
  //   if (page === 1) {
  //     fetchResults(page);
  //   } else {
  //     setPage(1);
  //   }
  // }, [selectedStatus]);

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  return (
    <Container className="no-padding pt-4">
      <Row className="pb-3">
        <Col>
          <h1>Collectors</h1>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>hi</p>
        </Col>
      </Row>
    </Container>
  );
}
