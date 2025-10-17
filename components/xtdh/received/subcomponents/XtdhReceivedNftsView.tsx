'use client';

import type { XtdhReceivedView } from "../utils/constants";
import { XtdhReceivedNftsViewContent } from "./XtdhReceivedNftsViewContent";
import { XtdhReceivedNftsViewFallback } from "./XtdhReceivedNftsViewFallback";
import {
  useXtdhReceivedNftsViewDerivedState,
} from "../hooks/useXtdhReceivedNftsViewDerivedState";
import type { XtdhReceivedNftsViewState } from "./XtdhReceivedNftsView.types";

export interface XtdhReceivedNftsViewProps {
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly state: XtdhReceivedNftsViewState;
}

export function XtdhReceivedNftsView({
  view,
  onViewChange,
  announcement,
  state,
}: XtdhReceivedNftsViewProps) {
  const derivedState = useXtdhReceivedNftsViewDerivedState(state);
  const { clearFiltersLabel, emptyStateCopy, shouldShowPagination } = derivedState;

  if (state.missingScopeMessage || state.isError) {
    return (
      <XtdhReceivedNftsViewFallback
        missingScopeMessage={state.missingScopeMessage}
        isError={state.isError}
        errorMessage={state.errorMessage}
        onRetry={state.handleRetry}
      />
    );
  }

  return (
    <XtdhReceivedNftsViewContent
      view={view}
      onViewChange={onViewChange}
      announcement={announcement}
      state={state}
      clearFiltersLabel={clearFiltersLabel}
      emptyStateCopy={emptyStateCopy}
      shouldShowPagination={shouldShowPagination}
    />
  );
}
