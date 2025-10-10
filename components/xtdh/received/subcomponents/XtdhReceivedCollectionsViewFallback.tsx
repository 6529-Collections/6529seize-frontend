'use client';

import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import { XtdhReceivedErrorState } from "./XtdhReceivedErrorState";
import type { XtdhReceivedCollectionsViewState } from "./XtdhReceivedCollectionsView.types";

interface XtdhReceivedCollectionsViewFallbackProps {
  readonly missingScopeMessage?: XtdhReceivedCollectionsViewState["missingScopeMessage"];
  readonly isError: XtdhReceivedCollectionsViewState["isError"];
  readonly errorMessage?: XtdhReceivedCollectionsViewState["errorMessage"];
  readonly onRetry: XtdhReceivedCollectionsViewState["handleRetry"];
}

export function XtdhReceivedCollectionsViewFallback({
  missingScopeMessage,
  isError,
  errorMessage,
  onRetry,
}: XtdhReceivedCollectionsViewFallbackProps) {
  if (missingScopeMessage) {
    return <XtdhReceivedEmptyState message={missingScopeMessage} />;
  }

  if (isError) {
    return (
      <XtdhReceivedErrorState
        message={errorMessage ?? ""}
        onRetry={onRetry}
      />
    );
  }

  return null;
}
