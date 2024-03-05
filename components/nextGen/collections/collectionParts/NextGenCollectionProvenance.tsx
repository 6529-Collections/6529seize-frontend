import styles from "../NextGen.module.scss";
import { Container, Row, Col, Accordion } from "react-bootstrap";
import {
  areEqualAddresses,
  formatAddress,
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
import { NULL_ADDRESS } from "../../../../constants";
import {
  printGas,
  printRoyalties,
} from "../../../latest-activity/LatestActivityRow";

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
      <Row className="pt-2">
        <Col>
          {logs.map((log, index) => (
            <NextGenCollectionProvenanceRow
              collection={props.collection}
              log={log}
              key={`${log.id}`}
              odd={index % 2 !== 0}
            />
          ))}
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

interface NextGenCollectionProvenanceRowProps {
  collection: NextGenCollection;
  log: NextGenLog;
  disable_link?: boolean;
}

export function NextGenCollectionProvenanceRow(
  props: Readonly<{
    collection: NextGenCollection;
    log: NextGenLog;
    disable_link?: boolean;
    odd?: boolean;
  }>
) {
  const log = props.log;

  const [isTransaction, setIsTransaction] = useState<boolean>(false);

  function printAddress(address: string, display?: string) {
    return <a href={`/${address}`}>{display ?? formatAddress(address)}</a>;
  }

  function printParsedLog() {
    const escapedCollectionName = props.collection.name.replace(
      /[-\/\\^$*+?.()|[\]{}]/g,
      "\\$&"
    );
    const pattern = new RegExp("(" + escapedCollectionName + " #(\\d+))");
    const match = pattern.exec(log.log);

    try {
      if (match?.[1] && match?.[2] && typeof match.index === "number") {
        if (!isTransaction) {
          setIsTransaction(true);
        }
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

        let fromTo: any;
        if (isTransaction) {
          fromTo = (
            <span className="d-flex gap-1">
              <span>
                {areEqualAddresses(log.from_address, NULL_ADDRESS) ? (
                  "Minted"
                ) : (
                  <>
                    from&nbsp;
                    {printAddress(log.from_address, log.from_display)}
                  </>
                )}
              </span>
              <span>
                to&nbsp;
                {printAddress(log.to_address, log.to_display)}
              </span>
            </span>
          );
        }

        const beforeMatchSpan = <span>{beforeMatch}</span>;
        const afterMatchSpan = afterMatch ? (
          <span>{afterMatch}&nbsp;</span>
        ) : (
          <></>
        );
        if (props.disable_link) {
          return (
            <>
              {beforeMatchSpan}
              {content}
              {afterMatchSpan}
              {fromTo}
            </>
          );
        } else {
          return (
            <>
              {beforeMatchSpan}
              &nbsp;
              <a
                href={`/nextgen/token/${tokenId}`}
                onClick={(e) => e.stopPropagation()}>
                {content}
              </a>
              {afterMatchSpan}
              {fromTo}
            </>
          );
        }
      }
    } catch (e) {
      console.error("Error processing log:", e);
    }

    return <>{log.heading}</>;
  }

  function printBody() {
    if (!isTransaction) {
      const logSpan = <span>{log.log}</span>;
      if (log.log.startsWith("Script at index")) {
        return (
          <span className="d-flex flex-column">
            <span className="font-smaller font-color-h pb-2">
              * The script of each collection is split into manageable chunks
              due to Ethereum&apos;s transaction size limits. Each chunk of the
              script is updated individually in a separate transaction.
            </span>
            {logSpan}
          </span>
        );
      }
      return logSpan;
    }
  }

  return (
    <Accordion
      className={
        props.odd
          ? styles.collectionProvenanceAccordionOdd
          : styles.collectionProvenanceAccordion
      }>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button
          className={`d-flex justify-content-between ${
            isTransaction
              ? styles.collectionProvenanceAccordionButtonHideCaret
              : ""
          }`}>
          <Container className={styles.collectionProvenanceAccordionButton}>
            <Row>
              <Col>
                <span className="d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-4">
                    <span className="no-wrap">
                      {getDateDisplay(new Date(log.block_timestamp * 1000))}
                    </span>
                    <span className="d-flex align-items-center">
                      {printParsedLog()}
                    </span>
                  </span>
                  <span className="d-flex align-items-center gap-2">
                    {isTransaction &&
                      printGas(log.gas, log.gas_price, log.gas_price_gwei)}
                    {isTransaction &&
                      printRoyalties(
                        log.value,
                        log.royalties,
                        log.from_address
                      )}
                    <a
                      href={getTransactionLink(
                        NEXTGEN_CHAIN_ID,
                        log.transaction
                      )}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noreferrer">
                      <FontAwesomeIcon
                        style={{
                          height: "25px",
                          cursor: "pointer",
                        }}
                        icon="external-link-square"></FontAwesomeIcon>
                    </a>
                  </span>
                </span>
              </Col>
            </Row>
          </Container>
        </Accordion.Button>
        {!isTransaction && (
          <Accordion.Body
            className={
              props.odd
                ? styles.collectionProvenanceAccordionBodyOdd
                : styles.collectionProvenanceAccordionBody
            }>
            <Container className="no-padding">
              <Row className="pt-2 pb-2">
                <Col>{printBody()}</Col>
              </Row>
            </Container>
          </Accordion.Body>
        )}
      </Accordion.Item>
    </Accordion>
  );
}
