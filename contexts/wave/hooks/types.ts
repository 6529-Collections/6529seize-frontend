import type { Drop } from "./../../../helpers/waves/drop.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";

// Define the shape of the functions passed from the store
export interface WaveDataStoreUpdater {
  readonly updateData: (value: WaveMessagesUpdate) => void;
  readonly getData: (key: string) => WaveMessages | undefined;
  readonly removeDrop: (waveId: string, dropId: string) => void;
}

// Tracks loading state for each wave
export interface LoadingState {
  isLoading: boolean;
  promise: Promise<ApiDrop[] | null> | null;
}

export type WaveMessages = {
  readonly id: string;
  readonly isLoading: boolean;
  readonly isLoadingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly drops: Drop[];
  readonly latestFetchedSerialNo: number | null;
  readonly historyGaps?: readonly WaveHistoryGap[] | undefined;
};

export interface WaveHistoryGap {
  readonly newerThan: number;
  readonly olderThan: number;
}

/**
 * Which edge a history gap fills from: "older" pages back from the gap's
 * newest edge (a reader arriving from newer drops); "newer" pages forward from
 * its oldest edge (a reader arriving from older drops, e.g. after a jump).
 */
export type WaveHistoryGapDirection = "older" | "newer";

export type WaveMessagesUpdate = Partial<WaveMessages> & {
  key: string;
  /** Atomically settle this pending send with the single full drop in drops. */
  readonly pendingDropId?: string | undefined;
};
