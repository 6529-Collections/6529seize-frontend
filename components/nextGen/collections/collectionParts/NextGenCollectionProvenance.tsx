"use client";

import {
  printGas,
  printRoyalties,
} from "@/components/latest-activity/LatestActivityRow";
import { NEXTGEN_CHAIN_ID } from "@/components/nextGen/nextgen_contracts";
import Pagination from "@/components/pagination/Pagination";
import { NULL_ADDRESS } from "@/constants/constants";
import type { NextGenCollection, NextGenLog } from "@/entities/INextgen";
import {
  areEqualAddresses,
  formatAddress,
  getDateDisplay,
  getTransactionLink,
} from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { faExternalLinkSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Accordion } from "react-bootstrap";
import styles from "../NextGen.module.scss";
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
    <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl no-padding" ref={scrollTarget}>
      <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-2">
        <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
          {logs.map((log, index) => (
            <NextGenCollectionProvenanceRow
              collection={props.collection}
              log={log}
              key={`${log.id}`}
              odd={index % 2 !== 0}
            />
          ))}
        </div>
      </div>
      {totalResults > PAGE_SIZE && logsLoaded && (
        <div className="tw-flex tw-flex-wrap -tw-mx-3 text-center pt-4 pb-4">
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
        </div>
      )}
    </div>
  );
}

export function NextGenCollectionProvenanceRow(
  props: Readonly<{
    collection: NextGenCollection;
    log: NextGenLog;
    disable_link?: boolean | undefined;
    odd?: boolean | undefined;
  }>
) {
  const log = props.log;

  const [isTransaction, setIsTransaction] = useState<boolean>(false);

  function printAddress(address: string, display?: string) {
    return (
      <Link href={`/${address}`}>{display ?? formatAddress(address)}</Link>
    );
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
              unoptimized
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
              className={styles["nftImage"]}
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
              <Link
                href={`/nextgen/token/${tokenId}`}
                onClick={(e) => e.stopPropagation()}
              >
                {content}
              </Link>
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
    return;
  }

  return (
    <Accordion
      className={
        props.odd
          ? styles["collectionProvenanceAccordionOdd"]
          : styles["collectionProvenanceAccordion"]
      }
    >
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button
          className={`d-flex justify-content-between ${
            isTransaction
              ? styles["collectionProvenanceAccordionButtonHideCaret"]
              : ""
          }`}
        >
          <div className={`tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl ${styles["collectionProvenanceAccordionButton"]}`}>
            <div className="tw-flex tw-flex-wrap -tw-mx-3">
              <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
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
                    <Link
                      href={getTransactionLink(
                        NEXTGEN_CHAIN_ID,
                        log.transaction
                      )}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon
                        style={{
                          height: "25px",
                          cursor: "pointer",
                        }}
                        icon={faExternalLinkSquare}
                      ></FontAwesomeIcon>
                    </Link>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Accordion.Button>
        {!isTransaction && (
          <Accordion.Body
            className={
              props.odd
                ? styles["collectionProvenanceAccordionBodyOdd"]
                : styles["collectionProvenanceAccordionBody"]
            }
          >
            <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl no-padding">
              <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-2 pb-2">
                <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">{printBody()}</div>
              </div>
            </div>
          </Accordion.Body>
        )}
      </Accordion.Item>
    </Accordion>
  );
}
