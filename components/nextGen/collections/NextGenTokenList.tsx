import { Col, Container, Row } from "react-bootstrap";
import { NextGenTokenImage } from "./nextgenToken/NextGenTokenImage";
import {
  NextGenCollection,
  NextGenToken,
  TraitValuePair,
} from "../../../entities/INextgen";
import { useEffect, useState } from "react";
import Pagination from "../../pagination/Pagination";
import { commonApiFetch } from "../../../services/api/common-api";
import DotLoader from "../../dotLoader/DotLoader";

interface Props {
  collection: NextGenCollection;
  limit?: number;
  selected_traits?: TraitValuePair[];
  setTotalResults?: (totalResults: number) => void;
}

export default function NextGenTokenList(props: Readonly<Props>) {
  const pageSize = props.limit ?? 48;

  const [tokens, setTokens] = useState<NextGenToken[]>([]);
  const [tokensLoaded, setTokensLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    setTokensLoaded(false);
    let endpoint = `nextgen/collections/${props.collection.id}/tokens?page_size=${pageSize}&page=${mypage}`;
    if (props.selected_traits) {
      const traitsQ = props.selected_traits
        .map((t) => `${t.trait}:${t.value}`)
        .join(",");
      endpoint += `&traits=${traitsQ}`;
    }
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenToken[];
    }>({
      endpoint: endpoint,
    }).then((response) => {
      setTotalResults(response.count);
      if (props.setTotalResults) {
        props.setTotalResults(response.count);
      }
      setTokens(response.data);
      setTokensLoaded(true);
    });
  }

  useEffect(() => {
    if (page === 1) {
      fetchResults(page);
    } else {
      setPage(1);
    }
  }, [props.selected_traits]);

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  return (
    <Container className="no-padding">
      <Row>
        {tokensLoaded ? (
          tokens.length > 0 ? (
            tokens.map((t) => (
              <Col
                xs={6}
                sm={4}
                md={4}
                key={`collection-${props.collection.id}-token-list-${t.id}`}
                className="pt-2 pb-2">
                <NextGenTokenImage token={t} />
              </Col>
            ))
          ) : (
            <Col className="pt-2 pb-2">No results found</Col>
          )
        ) : (
          <Col className="pt-2 pb-2">
            <DotLoader />
          </Col>
        )}
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
