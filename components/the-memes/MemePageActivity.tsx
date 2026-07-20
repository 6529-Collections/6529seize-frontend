"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import Pagination from "@/components/pagination/Pagination";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import type { Transaction } from "@/entities/ITransaction";
import { TypeFilter } from "@/hooks/useActivityData";
import { formatNumber, roundTo } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import { ChartBarSquareIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
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

function formatEthVolume(volume: number, locale: SupportedLocale) {
  if (volume <= 0) {
    return t(locale, "theMemes.detail.activity.volume.unavailable");
  }

  return t(locale, "theMemes.detail.activity.volume.ethValue", {
    value: formatNumber(locale, roundTo(volume, 2), {
      maximumFractionDigits: 2,
    }),
  });
}

function getActivityTypeItems(locale: SupportedLocale) {
  return [
    {
      key: TypeFilter.ALL,
      label: t(locale, "theMemes.detail.activity.filters.allTransactions"),
      value: TypeFilter.ALL,
    },
    {
      key: TypeFilter.AIRDROPS,
      label: t(locale, "theMemes.detail.activity.filters.airdrops"),
      value: TypeFilter.AIRDROPS,
    },
    {
      key: TypeFilter.MINTS,
      label: t(locale, "theMemes.detail.activity.filters.mints"),
      value: TypeFilter.MINTS,
    },
    {
      key: TypeFilter.SALES,
      label: t(locale, "theMemes.detail.activity.filters.sales"),
      value: TypeFilter.SALES,
    },
    {
      key: TypeFilter.TRANSFERS,
      label: t(locale, "theMemes.detail.activity.filters.transfers"),
      value: TypeFilter.TRANSFERS,
    },
    {
      key: TypeFilter.BURNS,
      label: t(locale, "theMemes.detail.activity.filters.burns"),
      value: TypeFilter.BURNS,
    },
  ];
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
    locale?: SupportedLocale;
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
  const locale = props.locale ?? DEFAULT_LOCALE;
  const activityTypeItems = useMemo(
    () => getActivityTypeItems(locale),
    [locale]
  );
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
  const activity = activityLoaded ? activityState.rows : EMPTY_ACTIVITY;
  const activityTotalResults = activityLoaded ? activityState.totalResults : 0;
  const activityLoading = activityRequest !== undefined && !activityLoaded;
  const volumeStats = props.nft
    ? [
        {
          label: t(locale, "theMemes.detail.activity.volume.24Hours"),
          value: formatEthVolume(props.nft.total_volume_last_24_hours, locale),
        },
        {
          label: t(locale, "theMemes.detail.activity.volume.7Days"),
          value: formatEthVolume(props.nft.total_volume_last_7_days, locale),
        },
        {
          label: t(locale, "theMemes.detail.activity.volume.1Month"),
          value: formatEthVolume(props.nft.total_volume_last_1_month, locale),
        },
        {
          label: t(locale, "theMemes.detail.activity.volume.allTime"),
          value: formatEthVolume(props.nft.total_volume, locale),
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
      const tableCaption = t(locale, "theMemes.detail.activity.table.caption", {
        tokenId: props.nft?.id ?? "",
      });

      return (
        <div className="tw-overflow-x-auto">
          <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
            <caption className="tw-sr-only">{tableCaption}</caption>
            <tbody>
              {activity.map((tr) => (
                <LatestActivityRow
                  tr={tr}
                  nft={props.nft}
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
        <output
          aria-label={t(locale, "theMemes.detail.activity.loading")}
          className="tw-flex tw-items-center tw-justify-center tw-py-4"
        >
          <CircleLoader size={CircleLoaderSize.LARGE} />
        </output>
      );
    }

    return (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-py-2">
        <Image
          unoptimized
          loading="eager"
          width="100"
          height="100"
          style={{ height: "auto", width: "100px" }}
          src="/SummerGlasses.svg"
          alt=""
        />{" "}
        <b>{t(locale, "theMemes.detail.activity.empty")}</b>
      </div>
    );
  }, [activity, activityLoading, locale, props.nft]);

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
    <section
      aria-label={t(locale, "theMemes.detail.activity.region")}
      className="tw-space-y-8"
    >
      <section>
        <div className="tw-flex tw-items-center tw-gap-3">
          <ChartBarSquareIcon
            aria-hidden="true"
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500"
          />
          <h3 className={SECTION_HEADER_TITLE_CLASS}>
            {t(locale, "theMemes.detail.activity.volume.heading")}
          </h3>
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
            {t(locale, "theMemes.detail.tabs.cardActivity")}
          </h3>
          <div className="tw-w-full tw-shrink-0 md:tw-w-72">
            <CommonDropdown
              items={activityTypeItems}
              activeItem={activityTypeFilter}
              filterLabel={t(
                locale,
                "theMemes.detail.activity.transactionType"
              )}
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
