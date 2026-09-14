import { useMemo, useState } from "react";
import { isValidEthAddress } from "@/helpers/Helpers";
import {
  useContractOverviewQuery,
  primeContractCache,
} from "@/hooks/useAlchemyNftQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Suggestion, SupportedChain } from "../types";

type UseNftSearchProps = {
  chain: SupportedChain;
  debounceMs: number;
};

export function useNftSearch({ chain, debounceMs }: UseNftSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const trimmedQuery = query.trim();
  const isAddressQuery = isValidEthAddress(trimmedQuery);
  const debouncedQuery = useDebouncedValue(trimmedQuery, debounceMs);
  // Disable stale lookups as soon as the input changes.
  const contractQueryAddress =
    isAddressQuery && trimmedQuery === debouncedQuery
      ? (trimmedQuery.toLowerCase() as `0x${string}`)
      : undefined;
  const addressOverviewQuery = useContractOverviewQuery({
    address: contractQueryAddress,
    chain,
    enabled: Boolean(contractQueryAddress),
  });

  const suggestionList: Suggestion[] = useMemo(() => {
    if (contractQueryAddress && addressOverviewQuery.data) {
      return [addressOverviewQuery.data];
    }
    return [];
  }, [contractQueryAddress, addressOverviewQuery.data]);

  const isLoading =
    isAddressQuery &&
    (trimmedQuery !== debouncedQuery || addressOverviewQuery.isFetching);
  const isError = Boolean(contractQueryAddress) && addressOverviewQuery.isError;
  const isNotFound =
    Boolean(contractQueryAddress) &&
    !isLoading &&
    addressOverviewQuery.isSuccess &&
    !addressOverviewQuery.data;

  const resetSearch = () => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    suggestionList,
    resetSearch,
    primeContractCache,
    isLoading,
    isError,
    isNotFound,
    isInvalidAddress: trimmedQuery.length > 0 && !isAddressQuery,
    retry: addressOverviewQuery.refetch,
  };
}
