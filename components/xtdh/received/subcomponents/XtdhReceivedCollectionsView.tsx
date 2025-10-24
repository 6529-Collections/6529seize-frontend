'use client';

import type { XtdhReceivedView } from "../utils/constants";
import { XtdhReceivedCollectionsViewContent } from "./XtdhReceivedCollectionsViewContent";
import { XtdhReceivedCollectionsViewFallback } from "./XtdhReceivedCollectionsViewFallback";
import {
  useXtdhReceivedCollectionsViewDerivedState,
} from "../hooks/useXtdhReceivedCollectionsViewDerivedState";
import type { XtdhReceivedCollectionsViewState } from "./XtdhReceivedCollectionsView.types";

export interface XtdhReceivedCollectionsViewProps {
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly state: XtdhReceivedCollectionsViewState;
}

export function XtdhReceivedCollectionsView({
  view,
  onViewChange,
  announcement,
  state,
}: XtdhReceivedCollectionsViewProps) {
  const derivedState = useXtdhReceivedCollectionsViewDerivedState(state);
  const { emptyStateCopy, clearFiltersLabel, shouldShowPagination } =
    derivedState;

  if (state.missingScopeMessage || state.isError) {
    return (
      <XtdhReceivedCollectionsViewFallback
        missingScopeMessage={state.missingScopeMessage}
        isError={state.isError}
        errorMessage={state.errorMessage}
        onRetry={state.handleRetry}
      />
    );
  }

  return (
    <XtdhReceivedCollectionsViewContent
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
