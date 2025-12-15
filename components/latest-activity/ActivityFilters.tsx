"use client";

import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { ContractFilter, TypeFilter } from "@/hooks/useActivityData";
import { Col } from "react-bootstrap";

interface ActivityFiltersProps {
  readonly typeFilter: TypeFilter;
  readonly selectedContract: ContractFilter;
  readonly onTypeFilterChange: (filter: TypeFilter) => void;
  readonly onContractFilterChange: (contract: ContractFilter) => void;
  readonly isMobile: boolean;
}

export const ActivityContractItems = Object.freeze(
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
    <Col
      sm={12}
      md={6}
      className={`tailwind-scope tw-py-2 d-flex align-items-center gap-4 ${
        isMobile ? "justify-content-center" : "justify-content-end"
      }`}>
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
    </Col>
  );
}
