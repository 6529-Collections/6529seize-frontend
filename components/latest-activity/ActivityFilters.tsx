"use client";

import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { ContractFilter, TypeFilter } from "@/hooks/useActivityData";
import { useMemo } from "react";
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
  const contractItems = useMemo(
    () =>
      Object.values(ContractFilter).map((contract) => ({
        key: contract,
        label: contract,
        value: contract,
      })),
    []
  );

  const typeItems = useMemo(
    () =>
      Object.values(TypeFilter).map((type) => ({
        key: type,
        label: type,
        value: type,
      })),
    []
  );

  return (
    <Col
      sm={12}
      md={6}
      className={`tailwind-scope tw-py-2 d-flex align-items-center gap-4 ${
        isMobile ? "justify-content-center" : "justify-content-end"
      }`}>
      <CommonDropdown
        items={contractItems}
        activeItem={selectedContract}
        filterLabel="Collection"
        setSelected={onContractFilterChange}
      />
      <CommonDropdown
        items={typeItems}
        activeItem={typeFilter}
        filterLabel="Filter"
        setSelected={onTypeFilterChange}
      />
    </Col>
  );
}
