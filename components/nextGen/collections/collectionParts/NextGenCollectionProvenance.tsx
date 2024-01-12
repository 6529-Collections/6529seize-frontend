import styles from "../NextGen.module.scss";
import { Container, Row, Col, Table } from "react-bootstrap";
import {
  getDateDisplay,
  getTransactionLink,
} from "../../../../helpers/Helpers";
import { useEffect, useRef, useState } from "react";
import { NextGenCollection, NextGenLog } from "../../../../entities/INextgen";
import { commonApiFetch } from "../../../../services/api/common-api";
import { NEXTGEN_CHAIN_ID } from "../../nextgen_contracts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Pagination from "../../../pagination/Pagination";

interface Props {
  collection: NextGenCollection;
}

const PAGE_SIZE = 20;

export default function NextGenCollectionProvenance(props: Readonly<Props>) {
  const scrollTarget = useRef<HTMLImageElement>(null);

  const [logs, setLogs] = useState<NextGenLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    setLogsLoaded(false);
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenLog[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/logs?page_size=${PAGE_SIZE}&page=${mypage}`,
    }).then((response) => {
      setTotalResults(response.count);
      setLogs(response.data);
      setLogsLoaded(true);
    });
  }

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  return (
    <>
      <Container className="no-padding" ref={scrollTarget}>
        <Row>
          <Col>
            <h3 className="mb-0">Provenance</h3>
          </Col>
        </Row>
        <hr />
        <Row className={`pt-2 ${styles.logsScrollContainer}`}>
          <Col>
            <Table bordered={false} className={styles.logsTable}>
              <tbody>
                {logs.map((log) => (
                  <tr key={`${log.block}-${log.transaction}`}>
                    <td className="align-middle text-center">
                      {getDateDisplay(new Date(log.block_timestamp * 1000))}
                    </td>
                    <td className={styles.collectionProvenance}>
                      <span className="d-fl">{log.log}</span>
                    </td>
                    <td className="align-middle">
                      <a
                        href={getTransactionLink(
                          NEXTGEN_CHAIN_ID,
                          log.transaction
                        )}
                        target="_blank"
                        rel="noreferrer">
                        <FontAwesomeIcon
                          className={styles.globeIcon}
                          icon="external-link-square"></FontAwesomeIcon>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
        {totalResults > PAGE_SIZE && logsLoaded && (
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
