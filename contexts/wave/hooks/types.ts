import { WaveMessages, WaveMessagesUpdate } from "./useWaveMessagesStore";
import { ApiDrop } from "../../../generated/models/ApiDrop";

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
