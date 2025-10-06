"use client";

import { Col, Dropdown } from "react-bootstrap";
import styles from "./LatestActivity.module.scss";
import { TypeFilter, ContractFilter } from "@/hooks/useActivityData";

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
      className={`d-flex align-items-center gap-4 ${
        isMobile ? "justify-content-center" : "justify-content-end"
      }`}
    >
      <Dropdown className={styles.filterDropdown} drop={"down-centered"}>
        <Dropdown.Toggle>Collection: {selectedContract}</Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.values(ContractFilter).map((contract) => (
            <Dropdown.Item
              key={contract}
              onClick={() => onContractFilterChange(contract)}
            >
              {contract}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown className={styles.filterDropdown} drop={"down-centered"}>
        <Dropdown.Toggle>Filter: {typeFilter}</Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.values(TypeFilter).map((filter) => (
            <Dropdown.Item
              key={filter}
              onClick={() => onTypeFilterChange(filter)}
            >
              {filter}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </Col>
  );
}
