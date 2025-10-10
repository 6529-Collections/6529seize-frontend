import { useMemo } from "react";

import {
  DEFAULT_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY,
} from "../XtdhReceivedCollectionsView.constants";
import type {
  XtdhReceivedCollectionsViewEmptyCopy,
  XtdhReceivedCollectionsViewState,
} from "../XtdhReceivedCollectionsView.types";

export interface XtdhReceivedCollectionsViewDerivedState {
  readonly emptyStateCopy: XtdhReceivedCollectionsViewEmptyCopy;
  readonly clearFiltersLabel: string;
  readonly shouldShowPagination: boolean;
}

/**
 * Normalizes optional state values to ensure the view component can render
 * without needing to sprinkle `??` fallbacks throughout the JSX structure.
 */
export function useXtdhReceivedCollectionsViewDerivedState(
  state: XtdhReceivedCollectionsViewState,
): XtdhReceivedCollectionsViewDerivedState {
  const {
    emptyStateCopy,
    clearFiltersLabel,
    collections,
    totalPages,
  } = state;

  return useMemo(() => {
    const resolvedEmptyStateCopy =
      emptyStateCopy ?? DEFAULT_EMPTY_STATE_COPY;
    const resolvedClearFiltersLabel =
      clearFiltersLabel ?? DEFAULT_CLEAR_FILTERS_LABEL;
    const hasCollections = collections.length > 0;
    const shouldShowPagination = hasCollections && totalPages > 1;

    return {
      emptyStateCopy: resolvedEmptyStateCopy,
      clearFiltersLabel: resolvedClearFiltersLabel,
      shouldShowPagination,
    };
  }, [
    clearFiltersLabel,
    collections,
    emptyStateCopy,
    totalPages,
  ]);
}
