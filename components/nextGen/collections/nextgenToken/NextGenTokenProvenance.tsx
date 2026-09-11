"use client";

import NftMarketActivity from "@/components/nft-market-activity/NftMarketActivity";
import Pagination from "@/components/pagination/Pagination";
import { NEXTGEN_CONTRACT } from "@/constants/constants";
import type { NextGenCollection, NextGenLog } from "@/entities/INextgen";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
  const logsScrollTarget = useRef<HTMLElement>(null);

  const [logs, setLogs] = useState<NextGenLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [logsError, setLogsError] = useState(false);
  const [logsTotalResults, setLogsTotalResults] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsRequestVersion, setLogsRequestVersion] = useState(0);

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
    <section className="tw-min-w-0">
      <h2 className="tw-mb-5 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
        Provenance
      </h2>
      <div className="tw-grid tw-min-w-0 tw-gap-5">
        <section className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5">
          <h3 className="tw-mb-4 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white">
            {t(locale, "nftActivity.cardTitle")}
          </h3>
          <NftMarketActivity
            contract={NEXTGEN_CONTRACT}
            tokenId={String(props.token_id)}
            pageSize={PAGE_SIZE}
            compact
          />
        </section>

        <section
          className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5"
          ref={logsScrollTarget}
        >
          <h3 className="tw-mb-4 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white">
            Collection Provenance
          </h3>
          {!logsLoaded && (
            <output
              aria-label="Loading collection provenance"
              className="tw-block tw-py-5 tw-text-iron-400"
            >
              Loading collection provenance…
            </output>
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
