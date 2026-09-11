"use client";

import { getActivityTypeItems } from "@/components/latest-activity/ActivityFilters";
import NftMarketActivity from "@/components/nft-market-activity/NftMarketActivity";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { NFT } from "@/entities/INFT";
import { getNftActivityFilter, TypeFilter } from "@/hooks/useActivityData";
import { formatNumber, roundTo } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChartBarSquareIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

const SECTION_HEADER_TITLE_CLASS =
  "tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400";
const METRIC_LABEL_CLASS =
  "tw-mb-1 md:tw-mb-2 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400";
const METRIC_VALUE_CLASS =
  "tw-text-sm md:tw-text-lg tw-font-semibold tw-leading-6 tw-text-white";
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

export function MemePageActivity(
  props: Readonly<{
    show: boolean;
    nft: NFT | undefined;
    pageSize: number;
    locale?: SupportedLocale;
  }>
) {
  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );
  const locale = props.locale ?? DEFAULT_LOCALE;
  const activityTypeItems = useMemo(
    () => getActivityTypeItems(locale),
    [locale]
  );
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

      <section className="tw-scroll-mt-24">
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
                setActivityTypeFilter(filter);
              }}
            />
          </div>
        </div>
        <NftMarketActivity
          contract={MEMES_CONTRACT}
          tokenId={String(props.nft.id)}
          filter={getNftActivityFilter(activityTypeFilter)}
          pageSize={props.pageSize}
          compact
          locale={locale}
        />
      </section>
    </section>
  );
}
