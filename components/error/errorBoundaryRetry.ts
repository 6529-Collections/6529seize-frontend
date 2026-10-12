// Next.js hands every error boundary a retry function that refetches the
// segment before re-rendering. 16.2 exposes it as `unstable_retry`; 16.3+
// renamed it to the stable `retry` and dropped the old name. `reset` (clear the
// error state without refetching) exists in both and is the last resort.
export type ErrorBoundaryRetryProps = {
  readonly retry?: (() => void) | undefined;
  readonly unstable_retry?: (() => void) | undefined;
  readonly reset: () => void;
};

export function getErrorBoundaryRetry({
  retry,
  unstable_retry,
  reset,
}: ErrorBoundaryRetryProps): () => void {
  return retry ?? unstable_retry ?? reset;
}
