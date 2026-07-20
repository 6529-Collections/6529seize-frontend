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
import { useEffect, useRef, useState } from "react";
import {
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "../nextgenToken/NextGenTokenImage";

interface Props {
  collection: NextGenCollection;
}

const PAGE_SIZE = 20;
const CELL_CLASSES =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-align-middle tw-text-sm tw-font-medium tw-leading-5";

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

    void commonApiFetch<{
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
    <div className="tw-w-full" ref={scrollTarget}>
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
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
            {logsLoaded && !logsError && logs.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="tw-border-0 tw-p-6 tw-text-center tw-text-base tw-text-iron-300"
                >
                  No collection provenance entries found.
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const transaction = getActivityTransaction(log);
              return transaction ? (
                <LatestActivityRow
                  key={`${log.id}`}
                  tr={transaction}
                  nextgen_collection={props.collection}
                  showNftIdentity
                />
              ) : (
                <NextGenCollectionProvenanceRow
                  key={`${log.id}`}
                  collection={props.collection}
                  log={log}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      {totalResults > PAGE_SIZE && logsLoaded && !logsError && (
        <div className="tw-pb-3 tw-pt-2 tw-text-center">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={(newPage: number) => {
              setPage(newPage);
              scrollTarget.current?.scrollIntoView({ behavior: "smooth" });
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
    String.raw`(${escapedCollectionName} #(\d+))`
  ).exec(log.log);
  const isTransaction = Boolean(
    transactionMatch?.[1] &&
    transactionMatch[2] &&
    typeof transactionMatch.index === "number"
  );

  const printAddress = (address: string, display?: string) => (
    <Link
      href={`/${address}`}
      className="tw-font-semibold tw-text-white tw-underline tw-underline-offset-2 hover:tw-text-white hover:tw-opacity-80"
    >
      {display ?? formatAddress(address)}
    </Link>
  );

  const printParsedLog = () => {
    const match = transactionMatch;
    if (!match?.[1] || !match[2] || typeof match.index !== "number") {
      return log.heading;
    }

    const beforeMatch = log.log.substring(0, match.index);
    const afterMatch = log.log
      .substring(match.index + match[1].length)
      .trimStart();
    const tokenId = props.collection.id * 10000000000 + Number(match[2]);
    const tokenContent = (
      <span className="tw-inline-flex tw-items-center tw-gap-2">
        <span>{match[1]}</span>
        <Image
          unoptimized
          width={40}
          height={40}
          src={getNextGenIconUrl(tokenId)}
          alt={`${props.collection.name} #${match[2]}`}
          className="tw-h-10 tw-w-12 tw-rounded-sm tw-object-contain"
          onError={({ currentTarget }) => {
            if (currentTarget.src === getNextGenIconUrl(tokenId)) {
              currentTarget.src = getNextGenImageUrl(tokenId);
            }
          }}
        />
      </span>
    );

    return (
      <span className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
        {beforeMatch && <span>{beforeMatch}</span>}
        {props.disable_link ? (
          tokenContent
        ) : (
          <Link
            href={`/nextgen/token/${tokenId}`}
            className="tw-rounded-sm tw-text-white tw-no-underline hover:tw-text-white hover:tw-opacity-80 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            onClick={(event) => event.stopPropagation()}
          >
            {tokenContent}
          </Link>
        )}
        {afterMatch && <span>{afterMatch}</span>}
        <span>
          {areEqualAddresses(log.from_address, NULL_ADDRESS)
            ? "Minted "
            : "from "}
        </span>
        {!areEqualAddresses(log.from_address, NULL_ADDRESS) &&
          printAddress(log.from_address, log.from_display)}
        <span>to </span>
        {printAddress(log.to_address, log.to_display)}
      </span>
    );
  };

  const transactionTools = (
    <span className="tw-flex tw-items-center tw-gap-3 tw-pl-4">
      {isTransaction &&
        printRoyalties(log.value, log.royalties, log.from_address, "22px")}
      {isTransaction &&
        printGas(
          log.gas,
          log.gas_gwei,
          log.gas_price_gwei,
          "tw-h-4 tw-w-4 tw-cursor-pointer tw-text-iron-400 tw-transition-colors hover:tw-text-white"
        )}
      <Link
        href={getTransactionLink(NEXTGEN_CHAIN_ID, log.transaction)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View transaction on Etherscan"
        className="tw-flex tw-rounded-sm tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        onClick={(event) => event.stopPropagation()}
      >
        <FontAwesomeIcon
          className="tw-h-5 tw-w-5"
          icon={faExternalLinkSquare}
        />
      </Link>
    </span>
  );

  const body = log.log.startsWith("Script at index") ? (
    <span className="tw-flex tw-flex-col tw-gap-2">
      <span className="tw-text-xs tw-text-iron-400">
        The script is split into chunks because of Ethereum transaction-size
        limits.
      </span>
      <span>{log.log}</span>
    </span>
  ) : (
    log.log
  );

  return (
    <tr className="tw-h-16 odd:tw-bg-transparent even:tw-bg-iron-900/45 hover:tw-bg-iron-900/70">
      <td
        className={`${CELL_CLASSES} tw-w-px tw-whitespace-nowrap tw-text-iron-400`}
      >
        {getDateDisplay(new Date(log.block_timestamp * 1000))}
      </td>
      <td className={`${CELL_CLASSES} tw-w-14 tw-text-center tw-text-iron-400`}>
        <span aria-hidden="true">•</span>
      </td>
      <td className={`${CELL_CLASSES} tw-text-white`}>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          {isTransaction ? (
            printParsedLog()
          ) : (
            <details className="tw-group tw-min-w-0 tw-flex-1">
              <summary className="tw-cursor-pointer tw-list-none tw-rounded-sm tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
                <span className="tw-flex tw-items-center tw-gap-2 before:tw-text-lg before:tw-text-iron-400 before:tw-transition-transform before:tw-content-['›'] group-open:before:tw-rotate-90">
                  {log.heading}
                </span>
              </summary>
              <div className="tw-pb-1 tw-pl-5 tw-pt-2 tw-text-sm tw-font-normal tw-text-iron-300">
                {body}
              </div>
            </details>
          )}
          {transactionTools}
        </div>
      </td>
    </tr>
  );
}
