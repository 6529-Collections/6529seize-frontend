"use client";

import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import Pagination from "@/components/pagination/Pagination";
import type { NextGenCollection, NextGenLog } from "@/entities/INextgen";
import type { Transaction } from "@/entities/ITransaction";
import { commonApiFetch } from "@/services/api/common-api";
import { useEffect, useRef, useState } from "react";
import { NextGenCollectionProvenanceRow } from "../collectionParts/NextGenCollectionProvenance";

interface Props {
  collection: NextGenCollection;
  token_id: number;
}

const PAGE_SIZE = 25;
const ERROR_ACTION_CLASSES =
  "tw-rounded-lg tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

export default function NextGenTokenProvenance(props: Readonly<Props>) {
  const scrollTarget = useRef<HTMLElement>(null);
  const logsScrollTarget = useRef<HTMLElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [transactionsError, setTransactionsError] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [transactionsRequestVersion, setTransactionsRequestVersion] =
    useState(0);

  const [logs, setLogs] = useState<NextGenLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [logsError, setLogsError] = useState(false);
  const [logsTotalResults, setLogsTotalResults] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsRequestVersion, setLogsRequestVersion] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;
    setTransactionsLoaded(false);
    setTransactionsError(false);

    void commonApiFetch<{
      count: number;
      page: number;
      next: unknown;
      data: Transaction[];
    }>({
      endpoint: `nextgen/tokens/${props.token_id}/transactions?page_size=${PAGE_SIZE}&page=${page}`,
    })
      .then((response) => {
        if (!isCurrentRequest) return;
        setTotalResults(response.count);
        setTransactions(response.data);
        setTransactionsLoaded(true);
      })
      .catch((error) => {
        if (!isCurrentRequest) return;
        console.error("Failed to fetch NextGen token transactions", error);
        setTotalResults(0);
        setTransactions([]);
        setTransactionsError(true);
        setTransactionsLoaded(true);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [page, props.token_id, transactionsRequestVersion]);

  useEffect(() => {
    let isCurrentRequest = true;
    setLogsLoaded(false);
    setLogsError(false);

    void commonApiFetch<{
      count: number;
      page: number;
      next: unknown;
      data: NextGenLog[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/logs/${props.token_id}?page_size=${PAGE_SIZE}&page=${logsPage}`,
    })
      .then((response) => {
        if (!isCurrentRequest) return;
        setLogsTotalResults(response.count);
        setLogs(response.data);
        setLogsLoaded(true);
      })
      .catch((error) => {
        if (!isCurrentRequest) return;
        console.error("Failed to fetch NextGen token logs", error);
        setLogsTotalResults(0);
        setLogs([]);
        setLogsError(true);
        setLogsLoaded(true);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [logsPage, logsRequestVersion, props.collection.id, props.token_id]);

  return (
    <section>
      <h2 className="tw-mb-5 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
        Provenance
      </h2>
      <div className="tw-grid tw-gap-5">
        <section
          className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5"
          ref={scrollTarget}
        >
          <h3 className="tw-mb-4 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white">
            Token Provenance
          </h3>
          {!transactionsLoaded && (
            <p role="status" className="tw-mb-0 tw-py-5 tw-text-iron-400">
              Loading token provenance…
            </p>
          )}
          {transactionsError && (
            <div
              role="alert"
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-py-5 tw-text-error"
            >
              <span>Unable to load token provenance.</span>
              <button
                type="button"
                className={ERROR_ACTION_CLASSES}
                onClick={() =>
                  setTransactionsRequestVersion((value) => value + 1)
                }
              >
                Retry
              </button>
            </div>
          )}
          {transactionsLoaded &&
            !transactionsError &&
            transactions.length === 0 && (
              <p className="tw-mb-0 tw-py-5 tw-text-iron-400">
                No token provenance entries found.
              </p>
            )}
          {transactionsLoaded &&
            !transactionsError &&
            transactions.length > 0 && (
              <div className="tw-overflow-x-auto">
                <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
                  <tbody>
                    {transactions.map((transaction) => (
                      <LatestActivityRow
                        tr={transaction}
                        hideNextgenTokenId
                        key={`${transaction.from_address}-${transaction.to_address}-${transaction.transaction}-${transaction.token_id}`}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          {totalResults > PAGE_SIZE &&
            transactionsLoaded &&
            !transactionsError && (
              <div className="tw-pt-5 tw-text-center">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  totalResults={totalResults}
                  setPage={(newPage: number) => {
                    setPage(newPage);
                    scrollTarget.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                />
              </div>
            )}
        </section>

        <section
          className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5"
          ref={logsScrollTarget}
        >
          <h3 className="tw-mb-4 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white">
            Collection Provenance
          </h3>
          {!logsLoaded && (
            <p role="status" className="tw-mb-0 tw-py-5 tw-text-iron-400">
              Loading collection provenance…
            </p>
          )}
          {logsError && (
            <div
              role="alert"
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-py-5 tw-text-error"
            >
              <span>Unable to load collection provenance.</span>
              <button
                type="button"
                className={ERROR_ACTION_CLASSES}
                onClick={() => setLogsRequestVersion((value) => value + 1)}
              >
                Retry
              </button>
            </div>
          )}
          {logsLoaded && !logsError && logs.length === 0 && (
            <p className="tw-mb-0 tw-py-5 tw-text-iron-400">
              No collection provenance entries found.
            </p>
          )}
          {logsLoaded && !logsError && logs.length > 0 && (
            <div className="tw-overflow-x-auto">
              <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
                <tbody>
                  {logs.map((log) => (
                    <NextGenCollectionProvenanceRow
                      collection={props.collection}
                      log={log}
                      key={`${log.block}-${log.id}`}
                      disable_link
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {logsTotalResults > PAGE_SIZE && logsLoaded && !logsError && (
            <div className="tw-pt-5 tw-text-center">
              <Pagination
                page={logsPage}
                pageSize={PAGE_SIZE}
                totalResults={logsTotalResults}
                setPage={(newPage: number) => {
                  setLogsPage(newPage);
                  logsScrollTarget.current?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              />
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
