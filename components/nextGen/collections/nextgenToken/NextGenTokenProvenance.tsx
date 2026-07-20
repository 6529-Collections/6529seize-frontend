"use client";

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
  const scrollTarget = useRef<HTMLDivElement>(null);
  const logsScrollTarget = useRef<HTMLDivElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState<NextGenLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [logsTotalResults, setLogsTotalResults] = useState(0);
  const [logsPage, setLogsPage] = useState(1);

  useEffect(() => {
    let isCurrentRequest = true;
    setTransactionsLoaded(false);

    commonApiFetch<{
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
        setTransactionsLoaded(true);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [page, props.token_id]);

  useEffect(() => {
    let isCurrentRequest = true;
    setLogsLoaded(false);

    commonApiFetch<{
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
        setLogsLoaded(true);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [logsPage, props.collection.id, props.token_id]);

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
        <div className="tw-overflow-x-auto tw-pt-2">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
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
