import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropId } from "@/generated/models/ApiDropId";
import type { Drop } from "@/helpers/waves/drop.helpers";
import type { WaveMessages } from "./hooks/types";
import type { MinimalWave } from "./hooks/useEnhancedWavesListCore";
import type { Listener as WaveMessagesListener } from "./hooks/useWaveMessagesStore";
import type { NextPageProps } from "./hooks/useWavePagination";
import type { ProcessIncomingDropType } from "./hooks/useWaveRealtimeUpdater";
import type { ServerWaveFeedSeedResult } from "./server-wave-feed-seed";

// Define nested structures for context data
export interface WavesContextData {
  readonly recommendationsStatus?: "pending" | "error" | "success";
  readonly retryRecommendations?: (() => void) | undefined;
  readonly isAnnouncementsLoading?: boolean;
  readonly hasLoadingError?: boolean | undefined;
  readonly retryLoading?: (() => void) | undefined;
  readonly isPinnedWavesLoading?: boolean;
  readonly list: MinimalWave[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly addPinnedWave: (id: string) => void;
  readonly removePinnedWave: (id: string) => void;
  readonly loadSubwavesForParent: (parentWaveId: string) => void;
  readonly prefetchSubwavesForParent: (parentWaveId: string) => void;
  readonly loadingSubwaveParentIds: readonly string[];
  readonly markWaveRead: (waveId: string, readThroughSerialNo?: number) => void;
  readonly restoreWaveUnreadCount: (waveId: string, count?: number) => void;
}

export interface ActiveWaveSetOptions {
  readonly isDirectMessage?: boolean | undefined;
  readonly replace?: boolean | undefined;
  readonly serialNo?: number | string | null | undefined;
  readonly divider?: number | null | undefined;
}

export interface ActiveWaveContextData {
  readonly id: string | null;
  readonly parentWaveId: string | null;
  readonly set: (waveId: string | null, options?: ActiveWaveSetOptions) => void;
}

// Define the interface for the wave messages store functions
interface WaveMessagesStoreData {
  readonly getData: (key: string) => WaveMessages | undefined;
  readonly subscribe: (key: string, listener: WaveMessagesListener) => void;
  readonly unsubscribe: (key: string, listener: WaveMessagesListener) => void;
}

// Stream actions keep the same identity while stream data changes (incoming
// drops, unread counts, wave lists), so per-drop rows that only call actions
// do not re-render on every drop. Read them with useMyStreamActions.
export interface MyStreamActionsContextType {
  readonly waveMessagesStore: WaveMessagesStoreData;
  readonly requestMainWavesList: () => () => void;
  readonly requestDirectMessagesList: () => () => void;
  readonly registerWave: (waveId: string, syncNewest?: boolean) => void;
  readonly serverFeedSeed: {
    readonly registerPending: (
      waveId: string,
      promise: Promise<ServerWaveFeedSeedResult>
    ) => void;
    readonly clearPending: (
      waveId: string,
      promise: Promise<ServerWaveFeedSeedResult>
    ) => void;
    readonly replacePending: (
      waveId: string,
      expectedPromise: Promise<ServerWaveFeedSeedResult>,
      promise: Promise<ServerWaveFeedSeedResult>
    ) => boolean;
    readonly expire: (
      waveId: string,
      expectedPromise: Promise<ServerWaveFeedSeedResult>
    ) => void;
    readonly apply: (params: {
      readonly drops: ApiDrop[];
      readonly hasNextPage: boolean;
      readonly onReady: () => void;
      readonly promise: Promise<ServerWaveFeedSeedResult>;
      readonly waveId: string;
    }) => boolean;
    readonly completeInitialRegistration: (waveId: string) => void;
  };
  readonly fetchNextPageForWave: (
    props: NextPageProps
  ) => Promise<(ApiDrop | ApiDropId)[] | null>;
  readonly fetchAroundSerialNo: (waveId: string, serialNo: number) => void;
  readonly processIncomingDrop: (
    drop: ApiDrop,
    type: ProcessIncomingDropType
  ) => Promise<void>;
  readonly processDropRemoved: (waveId: string, dropId: string) => void;
  readonly processDropsRemoved: (
    waveId: string,
    dropIds: readonly string[]
  ) => void;
  readonly refreshWaveMessages: (waveId: string) => void;
  readonly applyOptimisticDropUpdate: ({
    waveId,
    dropId,
    update,
  }: {
    waveId: string;
    dropId: string;
    update: (draft: Drop) => Drop | void;
  }) => { rollback: () => void } | null;
}

// The full context adds stream data to the actions and changes whenever that
// data changes.
export interface MyStreamContextType extends MyStreamActionsContextType {
  readonly waves: WavesContextData;
  readonly directMessages: WavesContextData;
  readonly activeWave: ActiveWaveContextData;
}
