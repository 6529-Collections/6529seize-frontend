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
        items={Object.values(ContractFilter).map((contract) => ({
          key: contract,
          label: contract,
          value: contract,
        }))}
        activeItem={selectedContract}
        filterLabel="Collection"
        setSelected={onContractFilterChange}
      />
      <CommonDropdown
        items={Object.values(TypeFilter).map((type) => ({
          key: type,
          label: type,
          value: type,
        }))}
        activeItem={typeFilter}
        filterLabel="Filter"
        setSelected={onTypeFilterChange}
      />
    </Col>
  );
}
