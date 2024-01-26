import styles from "../NextGen.module.scss";
import { Container, Row, Col, Table } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import Pagination from "../../../pagination/Pagination";
import { Transaction } from "../../../../entities/ITransaction";
import LatestActivityRow from "../../../latest-activity/LatestActivityRow";

interface Props {
  token_id: number;
}

const PAGE_SIZE = 20;

export default function NextGenTokenProvenance(props: Readonly<Props>) {
  const scrollTarget = useRef<HTMLImageElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    setTransactionsLoaded(false);
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: Transaction[];
    }>({
      endpoint: `nextgen/tokens/${props.token_id}/transactions?page_size=${PAGE_SIZE}&page=${mypage}`,
    }).then((response) => {
      setTotalResults(response.count);
      setTransactions(response.data);
      setTransactionsLoaded(true);
    });
  }

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  return (
    <>
      <Container className="no-padding" ref={scrollTarget}>
        <Row
          className={`pt-2 ${styles.logsScrollContainer} ${styles.tokenLogsScrollContainer}`}>
          <Col>
            <Table bordered={false} className={styles.logsTable}>
              <tbody>
                {transactions.map((tr) => (
                  <LatestActivityRow
                    tr={tr}
                    key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                  />
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
        {totalResults > PAGE_SIZE && transactionsLoaded && (
          <Row className="text-center pt-4 pb-4">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalResults={totalResults}
              setPage={function (newPage: number) {
                setPage(newPage);
                if (scrollTarget.current) {
                  scrollTarget.current.scrollIntoView({
                    behavior: "smooth",
                  });
                }
              }}
            />
          </Row>
        )}
      </Container>
    </>
  );
}
