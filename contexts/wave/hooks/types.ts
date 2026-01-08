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
};

export type WaveMessagesUpdate = Partial<WaveMessages> & {
  key: string;
};

export { ApiDropSearchStrategy as WaveDropsSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
