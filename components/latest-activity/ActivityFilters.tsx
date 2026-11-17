"use client";

import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { ContractFilter, TypeFilter } from "@/hooks/useActivityData";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface ActivityFiltersProps {
  readonly typeFilter: TypeFilter;
  readonly selectedContract: ContractFilter;
  readonly onTypeFilterChange: (filter: TypeFilter) => void;
  readonly onContractFilterChange: (contract: ContractFilter) => void;
  readonly isMobile: boolean;
}

const ActivityContractItems = Object.freeze(
  Object.values(ContractFilter).map((contract) => ({
    key: contract,
    label: contract,
    value: contract,
  }))
);

const TYPE_FILTER_MESSAGE = {
  [TypeFilter.ALL]: "nftActivity.filters.all",
  [TypeFilter.AIRDROPS]: "nftActivity.filters.airdrops",
  [TypeFilter.MINTS]: "nftActivity.filters.mints",
  [TypeFilter.SALES]: "nftActivity.filters.sales",
  [TypeFilter.PURCHASES]: "nftActivity.filters.purchases",
  [TypeFilter.TRANSFERS]: "nftActivity.filters.transfers",
  [TypeFilter.BURNS]: "nftActivity.filters.burns",
  [TypeFilter.LISTINGS]: "nftActivity.filters.listings",
  [TypeFilter.OFFERS]: "nftActivity.filters.offers",
  [TypeFilter.CANCELLATIONS]: "nftActivity.filters.cancellations",
  [TypeFilter.EXPIRATIONS]: "nftActivity.filters.expirations",
  [TypeFilter.INVALIDATIONS]: "nftActivity.filters.invalidations",
  [TypeFilter.REVALIDATIONS]: "nftActivity.filters.revalidations",
} as const;

const MARKET_ACTIVITY_TYPES = new Set([
  TypeFilter.LISTINGS,
  TypeFilter.OFFERS,
  TypeFilter.CANCELLATIONS,
  TypeFilter.EXPIRATIONS,
  TypeFilter.INVALIDATIONS,
  TypeFilter.REVALIDATIONS,
]);

export function getActivityTypeItems(
  locale: SupportedLocale,
  hideNftPurchasing = false
) {
  return Object.values(TypeFilter)
    .filter((type) => !hideNftPurchasing || !MARKET_ACTIVITY_TYPES.has(type))
    .map((type) => ({
      key: type,
      label: t(locale, TYPE_FILTER_MESSAGE[type]),
      value: type,
    }));
}

export default function ActivityFilters({
  typeFilter,
  selectedContract,
  onTypeFilterChange,
  onContractFilterChange,
  isMobile,
}: ActivityFiltersProps) {
  const locale = useBrowserLocale();
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const activityTypeItems = getActivityTypeItems(locale, hideNftPurchasing);
  return (
    <div
      className={`tailwind-scope tw-ml-auto tw-flex tw-w-auto tw-items-center tw-gap-4 tw-py-2 ${
        isMobile ? "tw-justify-center" : "tw-justify-end"
      }`}
    >
      <CommonDropdown
        variant="filter"
        items={ActivityContractItems}
        activeItem={selectedContract}
        filterLabel={t(locale, "nftActivity.filters.collection")}
        setSelected={onContractFilterChange}
      />
      <CommonDropdown
        variant="filter"
        items={activityTypeItems}
        activeItem={typeFilter}
        filterLabel={t(locale, "nftActivity.filters.type")}
        setSelected={onTypeFilterChange}
      />
    </div>
  );
}
