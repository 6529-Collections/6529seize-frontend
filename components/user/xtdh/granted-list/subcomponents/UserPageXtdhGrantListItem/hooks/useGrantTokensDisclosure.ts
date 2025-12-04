"use client";

import { useCallback, useId, useMemo, useState } from "react";

import { useTdhGrantTokensQuery } from "@/hooks/useTdhGrantTokensQuery";

import type { GrantTokensDisclosureState } from "../types";
import { getGrantTokensErrorMessage, mapTokensToRanges } from "../utils/grantTokens";

const TOKEN_PAGE_SIZE = 500;

type GrantTokensDisclosureParams = Pick<
  GrantTokensDisclosureState,
  "chain" | "contractAddress" | "grantId"
>;

export interface UseGrantTokensDisclosureResult {
  readonly isOpen: boolean;
  readonly panelId: string;
  readonly toggleOpen: () => void;
  readonly disclosureState: GrantTokensDisclosureState;
}

export function useGrantTokensDisclosure({
  chain,
  contractAddress,
  grantId,
}: GrantTokensDisclosureParams): UseGrantTokensDisclosureResult {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const {
    tokens,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTdhGrantTokensQuery({
    grantId,
    pageSize: TOKEN_PAGE_SIZE,
    enabled: isOpen,
  });

  const tokenRanges = useMemo(() => mapTokensToRanges(tokens), [tokens]);
  const showInitialLoading = isOpen && tokenRanges.length === 0 && isLoading;
  const showInitialError = isOpen && tokenRanges.length === 0 && isError;
  const errorMessage = getGrantTokensErrorMessage(error);

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    fetchNextPage().catch((err) => {
      // Errors are surfaced through the query state rendered below.
      console.error("Failed to fetch next page of grant tokens:", err);
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const onEndReached = hasNextPage ? handleEndReached : undefined;

  const handleRetry = useCallback(() => {
    refetch().catch((err) => {
      // Errors will re-render the existing error state.
      console.error("Failed to retry fetching grant tokens:", err);
    });
  }, [refetch]);

  const toggleOpen = useCallback(() => {
    setIsOpen((previous) => !previous);
  }, []);

  return {
    isOpen,
    panelId,
    toggleOpen,
    disclosureState: {
      showInitialLoading,
      showInitialError,
      tokenRanges,
      tokens,
      errorMessage,
      onRetry: handleRetry,
      contractAddress,
      chain,
      grantId,
      onEndReached,
      isFetchingNextPage,
    },
  };
}
