"use client";

import styles from "../NextGen.module.scss";
import { Container, Row, Col, Table } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import Pagination from "@/components/pagination/Pagination";
import { Transaction } from "@/entities/ITransaction";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import { NextGenCollection, NextGenLog } from "@/entities/INextgen";
import { NextGenCollectionProvenanceRow } from "../collectionParts/NextGenCollectionProvenance";

interface Props {
  collection: NextGenCollection;
  token_id: number;
}

const PAGE_SIZE = 25;

export default function NextGenTokenProvenance(props: Readonly<Props>) {
  const scrollTarget = useRef<HTMLImageElement>(null);
  const logsScrollTarget = useRef<HTMLImageElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState<NextGenLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [logsTotalResults, setLogsTotalResults] = useState(0);
  const [logsPage, setLogsPage] = useState(1);

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

  function fetchLogsResults(mypage: number) {
    setLogsLoaded(false);
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenLog[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/logs/${props.token_id}?page_size=${PAGE_SIZE}&page=${mypage}`,
    }).then((response) => {
      setLogsTotalResults(response.count);
      setLogs(response.data);
      setLogsLoaded(true);
    });
  }

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  useEffect(() => {
    fetchLogsResults(logsPage);
  }, [logsPage]);

  return (
    <>
      <Container className="no-padding" ref={scrollTarget}>
        <Row>
          <Col>
            <h3>Token Provenance</h3>
          </Col>
        </Row>
        <Row className={`pt-2 ${styles.logsScrollContainer}`}>
          <Col>
            <Table bordered={false} className={styles.logsTable}>
              <tbody>
                {transactions.map((tr) => (
                  <LatestActivityRow
                    tr={tr}
                    hideNextgenTokenId={true}
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
      <Container className="pt-4 no-padding" ref={logsScrollTarget}>
        <Row>
          <Col>
            <h3>Collection Provenance</h3>
          </Col>
        </Row>
        <Row className="pt-2">
          <Col>
            {logs.map((log, index) => (
              <NextGenCollectionProvenanceRow
                collection={props.collection}
                log={log}
                key={`${log.block}-${log.id}`}
                disable_link={true}
                odd={index % 2 !== 0}
              />
            ))}
          </Col>
        </Row>
        {logsTotalResults > PAGE_SIZE && logsLoaded && (
          <Row className="text-center pt-4 pb-4">
            <Pagination
              page={logsPage}
              pageSize={PAGE_SIZE}
              totalResults={logsTotalResults}
              setPage={function (newPage: number) {
                setLogsPage(newPage);
                if (logsScrollTarget.current) {
                  logsScrollTarget.current.scrollIntoView({
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
