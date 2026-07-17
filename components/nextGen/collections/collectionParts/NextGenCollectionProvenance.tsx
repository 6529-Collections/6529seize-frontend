"use client";

import LatestActivityRow, {
  printGas,
  printRoyalties,
} from "@/components/latest-activity/LatestActivityRow";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import Pagination from "@/components/pagination/Pagination";
import { NULL_ADDRESS } from "@/constants/constants";
import type { NextGenCollection, NextGenLog } from "@/entities/INextgen";
import type { Transaction } from "@/entities/ITransaction";
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
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "../NextGen.module.css";
import {
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "../nextgenToken/NextGenTokenImage";

interface Props {
  collection: NextGenCollection;
}

const PAGE_SIZE = 20;

function getActivityTransaction(log: NextGenLog): Transaction | undefined {
  if (typeof log.token_id !== "number") {
    return undefined;
  }

  return {
    created_at: new Date(log.created_at),
    transaction: log.transaction,
    block: log.block,
    transaction_date: new Date(log.block_timestamp * 1000),
    from_address: log.from_address as `0x${string}`,
    from_display: log.from_display || undefined,
    to_address: log.to_address as `0x${string}`,
    to_display: log.to_display || undefined,
    contract: NEXTGEN_CORE[NEXTGEN_CHAIN_ID],
    token_id: log.token_id,
    token_count: 1,
    value: log.value,
    royalties: log.royalties,
    gas_gwei: log.gas_gwei,
    gas_price: log.gas_price,
    gas_price_gwei: log.gas_price_gwei,
    gas: log.gas,
  };
}

export default function NextGenCollectionProvenance(props: Readonly<Props>) {
  const scrollTarget = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<NextGenLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [logsError, setLogsError] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;
    setLogsLoaded(false);
    setLogsError(false);
    setLogs([]);

    commonApiFetch<{
      count: number;
      page: number;
      next: unknown;
      data: NextGenLog[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/logs?page_size=${PAGE_SIZE}&page=${page}`,
    })
      .then((response) => {
        if (!isCurrentRequest) return;
        setTotalResults(response.count);
        setLogs(response.data);
        setLogsLoaded(true);
      })
      .catch((error) => {
        if (!isCurrentRequest) return;
        console.error("Failed to fetch NextGen collection provenance", error);
        setTotalResults(0);
        setLogsError(true);
        setLogsLoaded(true);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [page, props.collection.id, requestVersion]);

  return (
    <div
      className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]"
      ref={scrollTarget}
    >
      <div className="tw-overflow-x-auto tw-pt-2">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <table className="tw-w-full tw-min-w-[900px] tw-border-collapse">
            <tbody>
              {!logsLoaded && (
                <tr>
                  <td
                    colSpan={4}
                    className="tw-border-0 tw-p-6 tw-text-center tw-text-base tw-text-iron-300"
                  >
                    Loading provenance…
                  </td>
                </tr>
              )}
              {logsError && (
                <tr>
                  <td colSpan={4} className="tw-border-0 tw-p-6">
                    <div
                      role="alert"
                      className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-3 tw-text-base tw-text-error"
                    >
                      <span>Unable to load collection provenance.</span>
                      <button
                        type="button"
                        className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                        onClick={() =>
                          setRequestVersion((version) => version + 1)
                        }
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {logs.map((log, index) => {
                const transaction = getActivityTransaction(log);
                if (transaction) {
                  return (
                    <LatestActivityRow
                      key={`${log.id}`}
                      tr={transaction}
                      nextgen_collection={props.collection}
                      showNftIdentity
                    />
                  );
                }

                return (
                  <tr key={`${log.id}`}>
                    <td colSpan={4} className="tw-border-0 tw-p-0">
                      <NextGenCollectionProvenanceRow
                        collection={props.collection}
                        log={log}
                        odd={index % 2 !== 0}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {totalResults > PAGE_SIZE && logsLoaded && (
        <div className="tw-pb-3 tw-pt-2 tw-text-center">
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
  const escapedCollectionName = props.collection.name.replace(
    /[-\/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );
  const transactionMatch = new RegExp(
    `(${escapedCollectionName} #(\\d+))`
  ).exec(log.log);
  const isTransaction = Boolean(
    transactionMatch?.[1] &&
    transactionMatch[2] &&
    typeof transactionMatch.index === "number"
  );

  function printAddress(address: string, display?: string) {
    return (
      <Link href={`/${address}`}>{display ?? formatAddress(address)}</Link>
    );
  }

  function printParsedLog() {
    const match = transactionMatch;

    try {
      if (match?.[1] && match?.[2] && typeof match.index === "number") {
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

        const fromTo: ReactNode = (
          <span className="tw-flex tw-gap-1">
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
          <span className="tw-flex tw-flex-col">
            <span className="tw-pb-2 tw-text-sm tw-text-[#9a9a9a]">
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

  const rowClassName = props.odd
    ? styles["collectionProvenanceAccordionOdd"]
    : styles["collectionProvenanceAccordion"];
  const rowBackgroundClassName = props.odd
    ? "tw-bg-[rgb(34,34,34)]"
    : "tw-bg-[rgb(30,30,30)]";
  const bodyClassName = props.odd
    ? styles["collectionProvenanceAccordionBodyOdd"]
    : styles["collectionProvenanceAccordionBody"];
  const headerContent = (
    <div
      className={`tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] ${styles["collectionProvenanceAccordionButton"]}`}
    >
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <span className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-flex tw-items-center tw-gap-6">
              <span className="tw-min-w-fit tw-whitespace-nowrap">
                {getDateDisplay(new Date(log.block_timestamp * 1000))}
              </span>
              <span className="tw-flex tw-items-center">
                {printParsedLog()}
              </span>
            </span>
            <span className="tw-flex tw-items-center tw-gap-2">
              {isTransaction &&
                printGas(log.gas, log.gas_price, log.gas_price_gwei)}
              {isTransaction &&
                printRoyalties(log.value, log.royalties, log.from_address)}
              <Link
                href={getTransactionLink(NEXTGEN_CHAIN_ID, log.transaction)}
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
  );

  if (isTransaction) {
    return (
      <div className={`${rowClassName} ${rowBackgroundClassName}`}>
        {headerContent}
      </div>
    );
  }

  return (
    <details className={`${rowClassName} ${rowBackgroundClassName}`}>
      <summary className="tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400">
        {headerContent}
      </summary>
      <div className={bodyClassName}>
        <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
          <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-2">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              {printBody()}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
