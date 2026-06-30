"use client";

import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { ContractFilter, TypeFilter } from "@/hooks/useActivityData";

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

export const ActivityTypeItems = Object.freeze(
  Object.values(TypeFilter).map((type) => ({
    key: type,
    label: type,
    value: type,
  }))
);

export default function ActivityFilters({
  typeFilter,
  selectedContract,
  onTypeFilterChange,
  onContractFilterChange,
  isMobile,
}: ActivityFiltersProps) {
  return (
    <div
      className={`tailwind-scope tw-flex tw-w-full tw-items-center tw-gap-4 tw-py-2 md:tw-w-1/2 ${
        isMobile ? "tw-justify-center" : "tw-justify-end"
      }`}
    >
      <CommonDropdown
        items={ActivityContractItems}
        activeItem={selectedContract}
        filterLabel="Collection"
        setSelected={onContractFilterChange}
      />
      <CommonDropdown
        items={ActivityTypeItems}
        activeItem={typeFilter}
        filterLabel="Transaction Type"
        setSelected={onTypeFilterChange}
      />
    </div>
  );
}
