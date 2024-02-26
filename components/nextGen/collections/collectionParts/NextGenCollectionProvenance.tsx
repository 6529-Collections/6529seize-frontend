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
import Image from "next/image";
import {
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "../nextgenToken/NextGenTokenImage";

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
    <Container className="no-padding" ref={scrollTarget}>
      <Row className={`pt-2 ${styles.logsScrollContainer}`}>
        <Col>
          <Table bordered={false} className={styles.logsTable}>
            <tbody>
              {logs.map((log) => (
                <NextGenCollectionProvenanceRow
                  collection={props.collection}
                  log={log}
                  key={`${log.block}-${log.transaction}`}
                />
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
  );
}

export function NextGenCollectionProvenanceRow(
  props: Readonly<{
    collection: NextGenCollection;
    log: NextGenLog;
    disable_link?: boolean;
  }>
) {
  const log = props.log;

  function printParsedLog() {
    const escapedCollectionName = props.collection.name.replace(
      /[-\/\\^$*+?.()|[\]{}]/g,
      "\\$&"
    );
    const pattern = new RegExp("(" + escapedCollectionName + " #(\\d+))");
    const match = log.log.match(pattern);

    try {
      if (match && match[1] && match[2] && typeof match.index === "number") {
        const startIndex = match.index;
        const endIndex = startIndex + match[1].length;
        const beforeMatch = log.log.substring(0, startIndex);
        let afterMatch = log.log.substring(endIndex);
        if (afterMatch.startsWith(" ")) {
          afterMatch = afterMatch.substring(1);
        }
        const normalisedTokenId = parseInt(match[2], 10);
        const tokenId = props.collection.id * 10000000000 + normalisedTokenId;

        const content = (
          <>
            {match[1]}
            <Image
              width={0}
              height={0}
              style={{
                height: "40px",
                width: "auto",
                marginLeft: "8px",
                marginRight: "8px",
              }}
              src={getNextGenIconUrl(tokenId)}
              alt={`#${tokenId.toString()}`}
              className={styles.nftImage}
              onError={({ currentTarget }) => {
                if (currentTarget.src === getNextGenIconUrl(tokenId)) {
                  currentTarget.src = getNextGenImageUrl(tokenId);
                }
              }}
            />
          </>
        );

        if (props.disable_link) {
          return (
            <>
              {beforeMatch}
              {content}
              {afterMatch}
            </>
          );
        } else {
          return (
            <>
              {beforeMatch}
              <a href={`/nextgen/token/${tokenId}`}>{content}</a>
              {afterMatch}
            </>
          );
        }
      }
    } catch (e) {
      console.error("Error processing log:", e);
    }

    return <>{log.log}</>;
  }

  return (
    <tr>
      <td className="align-middle text-center">
        {getDateDisplay(new Date(log.block_timestamp * 1000))}
      </td>
      <td className={styles.collectionProvenance}>
        <span className="d-flex">{printParsedLog()}</span>
      </td>
      <td className="text-right">
        <a
          href={getTransactionLink(NEXTGEN_CHAIN_ID, log.transaction)}
          target="_blank"
          rel="noreferrer">
          <FontAwesomeIcon
            className={styles.globeIcon}
            icon="external-link-square"></FontAwesomeIcon>
        </a>
      </td>
    </tr>
  );
}
