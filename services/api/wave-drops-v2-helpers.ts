import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";

type DropApprovalTiming = {
  readonly over_threshold_since_ms?: number | null;
};

export const getDropEndpointId = (dropId: string): string =>
  encodeURIComponent(dropId);

const isAbortFetchError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const maybeAbortError = error as
    | { readonly code?: unknown; readonly name?: unknown }
    | null
    | undefined;

  return (
    maybeAbortError?.name === "AbortError" ||
    maybeAbortError?.code === "ERR_CANCELED"
  );
};

export const rethrowAbortFetchError = (error: unknown) => {
  if (isAbortFetchError(error)) {
    throw error;
  }
};

export const getDropType = (drop: ApiDropV2): ApiDropType => {
  if (drop.drop_type === ApiDropMainType.Chat) {
    return ApiDropType.Chat;
  }

  if (drop.submission_context?.status === ApiSubmissionDropStatus.Winner) {
    return ApiDropType.Winner;
  }

  return ApiDropType.Participatory;
};

export const getWinningContext = (drop: ApiDropV2) => {
  const voting = drop.submission_context?.voting;
  if (drop.submission_context?.status !== ApiSubmissionDropStatus.Winner) {
    return undefined;
  }

  const memeCardId = drop.submission_context.meme_card_id;

  return {
    place: voting?.place ?? 0,
    awards: [],
    decision_time: 0,
    sale_time: null,
    sale_price: null,
    sale_price_currency: null,
    ...(memeCardId !== undefined ? { meme_card_id: memeCardId } : {}),
  };
};

export const getDropApprovalTiming = (drop: ApiDropV2): DropApprovalTiming => {
  const overThresholdSinceMs = drop.submission_context?.over_threshold_since_ms;

  return typeof overThresholdSinceMs === "number"
    ? { over_threshold_since_ms: overThresholdSinceMs }
    : {};
};
