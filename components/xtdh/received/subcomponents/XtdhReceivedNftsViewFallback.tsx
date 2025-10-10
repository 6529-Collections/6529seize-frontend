'use client';

import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import { XtdhReceivedErrorState } from "./XtdhReceivedErrorState";
import type { XtdhReceivedNftsViewState } from "./XtdhReceivedNftsView.types";

interface XtdhReceivedNftsViewFallbackProps {
  readonly missingScopeMessage?: XtdhReceivedNftsViewState["missingScopeMessage"];
  readonly isError: XtdhReceivedNftsViewState["isError"];
  readonly errorMessage?: XtdhReceivedNftsViewState["errorMessage"];
  readonly onRetry: XtdhReceivedNftsViewState["handleRetry"];
}

export function XtdhReceivedNftsViewFallback({
  missingScopeMessage,
  isError,
  errorMessage,
  onRetry,
}: XtdhReceivedNftsViewFallbackProps) {
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
