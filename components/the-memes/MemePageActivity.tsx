"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { ActivityTypeItems } from "@/components/latest-activity/ActivityFilters";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import Pagination from "@/components/pagination/Pagination";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import type { Transaction } from "@/entities/ITransaction";
import { numberWithCommas } from "@/helpers/Helpers";
import { TypeFilter } from "@/hooks/useActivityData";
import { fetchUrl } from "@/services/6529api";
import { ChartBarSquareIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SECTION_HEADER_TITLE_CLASS =
  "tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400";
const METRIC_LABEL_CLASS =
  "tw-mb-1 md:tw-mb-2 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400";
const METRIC_VALUE_CLASS =
  "tw-text-sm md:tw-text-lg tw-font-semibold tw-leading-6 tw-text-white";
const EMPTY_ACTIVITY: Transaction[] = [];

type ActivityRequest = {
  readonly key: string;
  readonly nftId: number;
  readonly pageSize: number;
  readonly page: number;
  readonly typeFilter: TypeFilter;
};

type ActivityState = {
  readonly key: string;
  readonly totalResults: number;
  readonly rows: Transaction[];
};

function formatEthVolume(volume: number) {
  if (volume <= 0) {
    return "N/A";
  }

  return `${numberWithCommas(Math.round(volume * 100) / 100)} ETH`;
}

function getActivityFilterParam(typeFilter: TypeFilter) {
  switch (typeFilter) {
    case TypeFilter.ALL:
      return undefined;
    case TypeFilter.SALES:
      return "sales";
    case TypeFilter.TRANSFERS:
      return "transfers";
    case TypeFilter.AIRDROPS:
      return "airdrops";
    case TypeFilter.MINTS:
      return "mints";
    case TypeFilter.BURNS:
      return "burns";
  }
}

export function MemePageActivity(
  props: Readonly<{
    show: boolean;
    nft: NFT | undefined;
    pageSize: number;
  }>
) {
  const activitySectionRef = useRef<HTMLElement | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityState, setActivityState] = useState<ActivityState>({
    key: "",
    totalResults: 0,
    rows: EMPTY_ACTIVITY,
  });
  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );
  const nftId = props.nft?.id;
  const activityRequest = useMemo<ActivityRequest | undefined>(() => {
    if (!props.show || nftId === undefined) {
      return undefined;
    }

    return {
      key: `${nftId}:${props.pageSize}:${activityPage}:${activityTypeFilter}`,
      nftId,
      pageSize: props.pageSize,
      page: activityPage,
      typeFilter: activityTypeFilter,
    };
  }, [props.show, nftId, props.pageSize, activityPage, activityTypeFilter]);
  const activityLoaded = activityState.key === activityRequest?.key;
  const activity = useMemo(
    () => (activityLoaded ? activityState.rows : EMPTY_ACTIVITY),
    [activityLoaded, activityState.rows]
  );
  const activityTotalResults = activityLoaded ? activityState.totalResults : 0;
  const activityLoading = activityRequest !== undefined && !activityLoaded;
  const volumeStats = props.nft
    ? [
        {
          label: "24 Hours",
          value: formatEthVolume(props.nft.total_volume_last_24_hours),
        },
        {
          label: "7 Days",
          value: formatEthVolume(props.nft.total_volume_last_7_days),
        },
        {
          label: "1 Month",
          value: formatEthVolume(props.nft.total_volume_last_1_month),
        },
        {
          label: "All Time",
          value: formatEthVolume(props.nft.total_volume),
        },
      ]
    : [];

  useEffect(() => {
    if (activityRequest === undefined) {
      return;
    }

    let cancelled = false;
    const filterParam = getActivityFilterParam(activityRequest.typeFilter);
    let url = `${publicEnv.API_ENDPOINT}/api/transactions?contract=${MEMES_CONTRACT}&id=${activityRequest.nftId}&page_size=${activityRequest.pageSize}&page=${activityRequest.page}`;

    if (filterParam !== undefined) {
      url += `&filter=${filterParam}`;
    }

    fetchUrl(url)
      .then((response: DBResponse<Transaction>) => {
        if (!cancelled) {
          setActivityState({
            key: activityRequest.key,
            totalResults: response.count,
            rows: response.data,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActivityState({
            key: activityRequest.key,
            totalResults: 0,
            rows: EMPTY_ACTIVITY,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activityRequest]);

  const activityContent = useMemo(() => {
    if (activity.length > 0) {
      return (
        <div className="tw-overflow-x-auto">
          <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
            <tbody>
              {activity.map((tr) => (
                <LatestActivityRow
                  tr={tr}
                  nft={props.nft}
                  variant="tailwind"
                  rowStyle="striped"
                  key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                />
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activityLoading) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
          <CircleLoader size={CircleLoaderSize.LARGE} />
        </div>
      );
    }

    return (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-py-2">
        <NothingHereYetSummer />
      </div>
    );
  }, [activity, activityLoading, props.nft]);

  const handleActivityPageChange = useCallback((newPage: number) => {
    setActivityPage(newPage);
    activitySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  if (!props.show || props.nft === undefined) {
    return <></>;
  }

  return (
    <section className="tw-space-y-8">
      <section>
        <div className="tw-flex tw-items-center tw-gap-3">
          <ChartBarSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500" />
          <h3 className={SECTION_HEADER_TITLE_CLASS}>Card volumes</h3>
          <div className="tw-h-px tw-min-w-10 tw-flex-grow tw-bg-gradient-to-r tw-from-iron-700 tw-to-transparent" />
        </div>
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-start tw-gap-x-6 tw-gap-y-6 sm:tw-gap-x-16">
          {volumeStats.map((stat) => (
            <div key={stat.label}>
              <div className={METRIC_LABEL_CLASS}>{stat.label}</div>
              <div className={METRIC_VALUE_CLASS}>{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section ref={activitySectionRef} className="tw-scroll-mt-24">
        <div className="tw-mb-4 tw-flex tw-flex-col tw-items-stretch tw-justify-between tw-gap-3 md:tw-flex-row md:tw-items-center">
          <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-200">
            Card Activity
          </h3>
          <div className="tw-w-full tw-shrink-0 md:tw-w-72">
            <CommonDropdown
              items={ActivityTypeItems}
              activeItem={activityTypeFilter}
              filterLabel="Transaction Type"
              setSelected={(filter) => {
                setActivityPage(1);
                setActivityTypeFilter(filter);
              }}
            />
          </div>
        </div>
        {activityContent}
      </section>
      {activity.length > 0 && !activityLoading && (
        <div className="tw-flex tw-justify-center tw-pb-3 tw-pt-4">
          <Pagination
            page={activityPage}
            pageSize={props.pageSize}
            totalResults={activityTotalResults}
            setPage={handleActivityPageChange}
          />
        </div>
      )}
    </section>
  );
}
