"use client";

import styles from "../NextGen.module.css";
import { useEffect, useRef, useState } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import Pagination from "@/components/pagination/Pagination";
import type { Transaction } from "@/entities/ITransaction";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import type { NextGenCollection, NextGenLog } from "@/entities/INextgen";
import { NextGenCollectionProvenanceRow } from "../collectionParts/NextGenCollectionProvenance";

interface Props {
  collection: NextGenCollection;
  token_id: number;
}

const PAGE_SIZE = 25;

export default function NextGenTokenProvenance(props: Readonly<Props>) {
  const scrollTarget = useRef<HTMLElement>(null);
  const logsScrollTarget = useRef<HTMLElement>(null);

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
      next: unknown;
      data: Transaction[];
    }>({
      endpoint: `nextgen/tokens/${props.token_id}/transactions?page_size=${PAGE_SIZE}&page=${mypage}`,
    }).then((response) => {
      setTotalResults(response.count);
      setTransactions(response.data);
      setTransactionsLoaded(true);
    }).catch(() => {
      setTransactions([]);
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
      next: unknown;
      data: NextGenLog[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/logs/${props.token_id}?page_size=${PAGE_SIZE}&page=${mypage}`,
    }).then((response) => {
      setLogsTotalResults(response.count);
      setLogs(response.data);
      setLogsLoaded(true);
    }).catch(() => {
      setLogs([]);
      setLogsLoaded(true);
    });
  }

  useEffect(() => {
    fetchLogsResults(logsPage);
  }, [logsPage]);

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
          <p className="tw-mb-0 tw-py-5 tw-text-iron-400">
            Loading token provenance…
          </p>
        )}
        {transactionsLoaded && transactions.length === 0 && (
          <p className="tw-mb-0 tw-py-5 tw-text-iron-400">
            No token provenance entries found.
          </p>
        )}
        {transactionsLoaded && transactions.length > 0 && (
          <div
            className={`tw-overflow-x-auto ${styles["logsScrollContainer"]}`}
          >
          <table
            className={`tw-w-full tw-border-collapse ${styles["logsTable"]}`}
          >
            <tbody>
              {transactions.map((tr) => (
                <LatestActivityRow
                  tr={tr}
                  hideNextgenTokenId={true}
                  key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                />
              ))}
            </tbody>
          </table>
          </div>
        )}
        {totalResults > PAGE_SIZE && transactionsLoaded && (
          <div className="tw-pt-5 tw-text-center">
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
      </section>
      <section
        className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5"
        ref={logsScrollTarget}
      >
        <h3 className="tw-mb-4 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white">
          Collection Provenance
        </h3>
        {!logsLoaded && (
          <p className="tw-mb-0 tw-py-5 tw-text-iron-400">
            Loading collection provenance…
          </p>
        )}
        {logsLoaded && logs.length === 0 && (
          <p className="tw-mb-0 tw-py-5 tw-text-iron-400">
            No collection provenance entries found.
          </p>
        )}
        {logsLoaded && logs.length > 0 && (
          <div>
            {logs.map((log, index) => (
            <NextGenCollectionProvenanceRow
              collection={props.collection}
              log={log}
              key={`${log.block}-${log.id}`}
              disable_link={true}
              odd={index % 2 !== 0}
            />
            ))}
          </div>
        )}
        {logsTotalResults > PAGE_SIZE && logsLoaded && (
          <div className="tw-pt-5 tw-text-center">
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
          </div>
        )}
      </section>
      </div>
    </section>
  );
}
