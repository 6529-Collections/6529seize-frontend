import { STATUS_LABELS, areAllGrantedStatuses } from "./constants";
import type { GrantedFilterStatuses } from "./types";

interface ResultSummaryParams {
  readonly activeStatuses: GrantedFilterStatuses;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly totalCount: number;
}

/**
 * Builds the polite status summary while ensuring loading and error states short-circuit.
 */
export function getUserPageXtdhGrantedListResultSummary({
  activeStatuses,
  isError,
  isLoading,
  isFetching,
  totalCount,
}: ResultSummaryParams): string | null {
  if (isError || isLoading) {
    return null;
  }

  if (isFetching) {
    return "Updating granted xTDH…";
  }

  const countText = totalCount.toLocaleString();
  const statusText = (() => {
    if (!activeStatuses.length || areAllGrantedStatuses(activeStatuses)) {
      return "grants";
    }

    if (activeStatuses.length === 1) {
      const [status] = activeStatuses;
      return `${STATUS_LABELS[status].toLowerCase()} grants`;
    }

    return "grants matching selected statuses";
  })();

  return `Showing ${countText} ${statusText}`;
}
