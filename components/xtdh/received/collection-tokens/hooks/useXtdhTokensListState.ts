import { useMemo } from "react";

import type {
  UseXtdhTokensListStateParams,
  XtdhTokensListState,
} from "../types";

export function useXtdhTokensListState(
  params: Readonly<UseXtdhTokensListStateParams>,
): XtdhTokensListState {
  const { tokens, isEnabled, isLoading, isError } = params;
  const tokenCount = tokens.length;

  return useMemo(() => {
    const hasTokens = tokenCount > 0;
    const showInitialLoading = isLoading && !hasTokens;
    const showInitialError = isError && !hasTokens;
    const showEmptyState = !showInitialLoading && !showInitialError && !hasTokens;

    return {
      isDisabled: !isEnabled,
      showInitialLoading,
      showInitialError,
      showEmptyState,
      hasTokens,
    };
  }, [isEnabled, isError, isLoading, tokenCount]);
}
