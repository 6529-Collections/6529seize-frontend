import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Refetches one query only when an enabled observer considers its data stale.
 *
 * Unlike an observer `refetch()`, this keeps data that is still within its
 * `staleTime`, skips disabled queries, and joins an in-flight request instead
 * of cancelling it.
 */
export const refetchQueryIfStale = (
  queryClient: QueryClient,
  queryKey: QueryKey
): void => {
  // Resync callers fire and forget. A failed fetch already lands in the
  // query's own error state, so the catch only prevents an unhandled rejection.
  queryClient
    .refetchQueries(
      { queryKey, exact: true, type: "active", stale: true },
      { cancelRefetch: false }
    )
    .catch(() => undefined);
};
