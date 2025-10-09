import { STATUS_LABELS } from "./constants";
import type { GrantedFilterStatus } from "./types";

interface ResultSummaryParams {
  readonly activeStatus: GrantedFilterStatus;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly totalCount: number;
}

/**
 * Builds the polite status summary while ensuring loading and error states short-circuit.
 */
export function getUserPageXtdhGrantedListResultSummary({
  activeStatus,
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
  const statusText =
    activeStatus === "ALL"
      ? "grants"
      : `${STATUS_LABELS[activeStatus].toLowerCase()} grants`;

  return `Showing ${countText} ${statusText}`;
}

