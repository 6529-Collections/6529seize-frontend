import { getQueryErrorStatus } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import type { ApiDmUnreadSnapshot } from "@/generated/models/ApiDmUnreadSnapshot";
import { applyDelayJitter } from "@/helpers/jitter.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { isRecord } from "./dm-unread-drop-recovery";
import type { DmUnreadStore } from "./dm-unread-store";

export const SNAPSHOT_RECONCILIATION_INTERVAL_MS = 5 * 60 * 1_000;
const SNAPSHOT_RETRY_BASE_DELAYS_MS = [
  5_000,
  30_000,
  SNAPSHOT_RECONCILIATION_INTERVAL_MS,
] as const;
const SNAPSHOT_RETRY_JITTER_RATIO = 0.2;

export type SnapshotSynchronizationResult =
  | "synchronized"
  | "retryable-failure"
  | "terminal-failure"
  | "stale";

export const isDmUnreadConversationState = (
  value: unknown
): value is ApiDmUnreadConversationState => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value["profile_id"] === "string" &&
    typeof value["wave_id"] === "string" &&
    typeof value["unread_count"] === "number" &&
    (value["first_unread_drop_serial_no"] === null ||
      typeof value["first_unread_drop_serial_no"] === "number") &&
    typeof value["latest_drop_serial_no"] === "number" &&
    typeof value["latest_read_serial_no"] === "number" &&
    typeof value["version"] === "number"
  );
};

const isDmUnreadSnapshot = (value: unknown): value is ApiDmUnreadSnapshot => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value["profile_id"] === "string" &&
    typeof value["count"] === "number" &&
    Array.isArray(value["conversations"]) &&
    value["conversations"].every(isDmUnreadConversationState)
  );
};

interface SnapshotSynchronizationRequest {
  readonly expectedProfileId: string;
  readonly isCurrentRequest: () => boolean;
  readonly jwt: string;
  readonly startedAtSequence: number;
  readonly store: DmUnreadStore;
}

export const getSnapshotRetryDelay = (attempt: number): number => {
  const baseDelay =
    SNAPSHOT_RETRY_BASE_DELAYS_MS[
      Math.min(attempt, SNAPSHOT_RETRY_BASE_DELAYS_MS.length - 1)
    ] ?? SNAPSHOT_RECONCILIATION_INTERVAL_MS;
  return applyDelayJitter(baseDelay, SNAPSHOT_RETRY_JITTER_RATIO);
};

export const synchronizeDmUnreadSnapshot = async (
  request: SnapshotSynchronizationRequest
): Promise<SnapshotSynchronizationResult> => {
  try {
    const response = await commonApiFetch<unknown>({
      endpoint: "dm-drops/unread/snapshot",
      headers: { Authorization: `Bearer ${request.jwt}` },
      errorMode: "structured",
    });
    if (!request.isCurrentRequest()) {
      return "stale";
    }
    if (
      !isDmUnreadSnapshot(response) ||
      response.profile_id !== request.expectedProfileId
    ) {
      throw new Error("Invalid DM unread snapshot response");
    }
    request.store.applySnapshot(response, request.startedAtSequence);
    return "synchronized";
  } catch (error) {
    if (!request.isCurrentRequest()) {
      return "stale";
    }
    const status = getQueryErrorStatus(error);
    if (status !== null && status >= 400 && status < 500 && status !== 429) {
      console.error("Failed to synchronize DM unread state", error);
      return "terminal-failure";
    }
    return "retryable-failure";
  }
};
