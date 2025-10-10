import { useMemo } from "react";

import {
  DEFAULT_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY,
} from "../subcomponents/XtdhReceivedNftsView.constants";
import type {
  XtdhReceivedNftsViewEmptyCopy,
  XtdhReceivedNftsViewState,
} from "../subcomponents/XtdhReceivedNftsView.types";

export interface XtdhReceivedNftsViewDerivedState {
  readonly clearFiltersLabel: string;
  readonly emptyStateCopy: XtdhReceivedNftsViewEmptyCopy;
  readonly shouldShowPagination: boolean;
}

/**
 * Normalizes optional state fields so the view component can stay focused on
 * markup rather than handling fallback logic inline.
 */
export function useXtdhReceivedNftsViewDerivedState(
  state: XtdhReceivedNftsViewState,
): XtdhReceivedNftsViewDerivedState {
  const { clearFiltersLabel, emptyStateCopy, nfts, totalPages } = state;

  return useMemo(() => {
    const resolvedClearFiltersLabel =
      clearFiltersLabel ?? DEFAULT_CLEAR_FILTERS_LABEL;
    const resolvedEmptyStateCopy =
      emptyStateCopy ?? DEFAULT_EMPTY_STATE_COPY;
    const hasNfts = nfts.length > 0;
    const shouldShowPagination = hasNfts && totalPages > 1;

    return {
      clearFiltersLabel: resolvedClearFiltersLabel,
      emptyStateCopy: resolvedEmptyStateCopy,
      shouldShowPagination,
    };
  }, [clearFiltersLabel, emptyStateCopy, nfts, totalPages]);
}

