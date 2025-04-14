import { WaveMessages } from "./useWaveMessagesStore";
import { ApiDrop } from "../../../generated/models/ApiDrop";

// Define the shape of the functions passed from the store
export interface WaveDataStoreUpdater {
  readonly updateData: (key: string, value: WaveMessages | undefined) => void;
  readonly getData: (key: string) => WaveMessages | undefined;
}

// Tracks loading state for each wave
export interface LoadingState {
  isLoading: boolean;
  promise: Promise<ApiDrop[] | null> | null;
}
