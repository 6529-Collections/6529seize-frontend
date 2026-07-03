"use client";

import styles from "../NextGen.module.scss";
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
      <div
        className="tw-mx-auto tw-w-full !tw-p-0 tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]"
        ref={scrollTarget}
      >
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <h3>Token Provenance</h3>
          </div>
        </div>
        <div
          className={`-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2 ${styles["logsScrollContainer"]}`}
        >
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
        </div>
        {totalResults > PAGE_SIZE && transactionsLoaded && (
          <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-6 tw-pt-6 tw-text-center">
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
      <div
        className="tw-mx-auto tw-w-full !tw-p-0 tw-px-3 tw-pt-6 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]"
        ref={logsScrollTarget}
      >
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <h3>Collection Provenance</h3>
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
        </div>
        {logsTotalResults > PAGE_SIZE && logsLoaded && (
          <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-6 tw-pt-6 tw-text-center">
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
      </div>
    </>
  );
}
