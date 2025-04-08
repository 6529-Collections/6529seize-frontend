import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

export enum WaveChatStatus {
  Idle = "IDLE",
  LoadingLatest = "LOADING_LATEST",
  LoadingOlder = "LOADING_OLDER",
  LoadingSync = "LOADING_SYNC",
  Error = "ERROR",
}

export interface WaveChatState {
  readonly drops: ExtendedDrop[];
  readonly status: WaveChatStatus;
  readonly hasReachedOldest: boolean;
  readonly newestSerialNo: number | null;
  readonly oldestSerialNo: number | null;
  readonly lastSyncTime: number | null;
  readonly error: Error | null;
}

export enum ActivationPriority {
  Immediate = 0,
  High = 1,
  Medium = 2,
  Low = 3,
}

export interface WaveChatOptions {
  readonly prefetchLimit?: number;
  readonly historyFetchLimit?: number;
  readonly staleTimeMs?: number;
  readonly syncIntervalMs?: number;
  readonly concurrencyLimit?: number;
  readonly recentThresholdMs?: number;
}

export interface ChatManagerInternals {
  readonly processing: Map<
    string,
    {
      priority: ActivationPriority;
      abortController: AbortController;
    }
  >;
  readonly pending: Map<string, ActivationPriority>;
  readonly cache: Map<string, WaveChatState>;
}
