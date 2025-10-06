import { Drop } from "./../../../helpers/waves/drop.helpers";
import { ApiDrop } from "@/generated/models/ApiDrop";

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
};

export type WaveMessagesUpdate = Partial<WaveMessages> & {
  key: string;
};

export enum WaveDropsSearchStrategy {
  FIND_OLDER = "FIND_OLDER",
  FIND_NEWER = "FIND_NEWER",
  FIND_BOTH = "FIND_BOTH",
}
