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
 * Releases drops a wave no longer keeps resident (the windowed chat's cap on
 * held drops). Released drops load again like any history: older ones by
 * paging, newer ones through the history gap that marks them.
 */
export interface WaveDropsTrim {
  readonly dropIds: readonly string[];
  /** Released drops older than every kept one: paging loads them again. */
  readonly releasesOlderHistory: boolean;
  /** Released drops between kept ones, newest side of the reader. */
  readonly historyGap: WaveHistoryGap | null;
}

export type WaveMessagesUpdate = Partial<WaveMessages> & {
  key: string;
};
