import { useState } from "react";
import { TypeFilter, ContractFilter } from "./useActivityData";

interface UseActivityFiltersReturn {
  // Filter states
  typeFilter: TypeFilter;
  selectedContract: ContractFilter;
  
  // Filter actions
  setTypeFilter: (filter: TypeFilter, resetPage?: () => void) => void;
  setSelectedContract: (contract: ContractFilter, resetPage?: () => void) => void;
  
  // Reset functionality
  resetFilters: () => void;
}

export function useActivityFilters(): UseActivityFiltersReturn {
  const [typeFilter, setTypeFilterState] = useState<TypeFilter>(TypeFilter.ALL);
  const [selectedContract, setSelectedContractState] = useState<ContractFilter>(ContractFilter.ALL);

  const setTypeFilter = (filter: TypeFilter, resetPage?: () => void) => {
    resetPage?.();
    setTypeFilterState(filter);
  };

  const setSelectedContract = (contract: ContractFilter, resetPage?: () => void) => {
    resetPage?.();
    setSelectedContractState(contract);
  };

  const resetFilters = () => {
    setTypeFilterState(TypeFilter.ALL);
    setSelectedContractState(ContractFilter.ALL);
  };

  return {
    typeFilter,
    selectedContract,
    setTypeFilter,
    setSelectedContract,
    resetFilters,
  };
}