import { Col, Container, Row } from "react-bootstrap";
import { NextGenTokenImage } from "./NextGenTokenImage";
import { NextGenCollection, NextGenToken } from "../../../entities/INextgen";
import { useEffect, useState } from "react";
import { DBResponse } from "../../../entities/IDBResponse";
import { fetchUrl } from "../../../services/6529api";
import Pagination from "../../pagination/Pagination";
import { commonApiFetch } from "../../../services/api/common-api";

interface Props {
  collection: NextGenCollection;
  limit?: number;
}

export default function NextGenTokenList(props: Readonly<Props>) {
  const pageSize = props.limit ?? 48;

  const [tokens, setTokens] = useState<NextGenToken[]>([]);
  const [tokensLoaded, setTokensLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    setTokensLoaded(false);
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenToken[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/tokens?page_size=${pageSize}&page=${mypage}`,
    }).then((response) => {
      setTotalResults(response.count);
      setTokens(response.data);
      setTokensLoaded(true);
    });
  }

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  return (
    <Container className="no-padding">
      <Row>
        {tokens.map((t) => (
          <Col
            xs={6}
            sm={4}
            md={4}
            key={`collection-${props.collection.id}-token-list-${t.id}`}
            className="pt-2 pb-2">
            <NextGenTokenImage token={t} />
          </Col>
        ))}
      </Row>
      {totalResults > pageSize && tokensLoaded && !props.limit && (
        <Row className="text-center pt-4 pb-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </Row>
      )}
    </Container>
  );
}
