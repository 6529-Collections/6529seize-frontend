import type { QueryState } from "@tanstack/react-query";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";

function isAccessDenied(error: unknown): boolean {
  const status = getStructuredApiErrorStatus(error);
  return status === 401 || status === 403;
}

export const dropForgeStatusPolling = {
  refetchIntervalInBackground: false,
  retry: (failureCount: number, error: unknown) =>
    failureCount < 2 && !isAccessDenied(error),
};

export function dropForgeStatusInterval(
  state: Pick<QueryState<unknown>, "error" | "fetchFailureCount">,
  interval: number
): number | false {
  if (isAccessDenied(state.error)) return false;
  return Math.min(60_000, interval * 2 ** Math.min(state.fetchFailureCount, 4));
}
