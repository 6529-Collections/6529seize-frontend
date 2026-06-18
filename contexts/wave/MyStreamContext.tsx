"use client";

import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropId } from "@/generated/models/ApiDropId";
import type { Drop } from "@/helpers/waves/drop.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import useDmWavesList from "@/hooks/useDmWavesList";
import { useWaveById } from "@/hooks/useWaveById";
import useWavesList from "@/hooks/useWavesList";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { useWebsocketStatus } from "@/services/websocket/useWebSocketMessage";
import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { WaveMessages } from "./hooks/types";
import { useActiveWaveManager } from "./hooks/useActiveWaveManager";
import type { MinimalWave } from "./hooks/useEnhancedWavesListCore";
import useEnhancedWavesListCore from "./hooks/useEnhancedWavesListCore";
import { useWaveDataManager } from "./hooks/useWaveDataManager";
import type { Listener as WaveMessagesListener } from "./hooks/useWaveMessagesStore";
import useWaveMessagesStore from "./hooks/useWaveMessagesStore";
import type { NextPageProps } from "./hooks/useWavePagination";
import type { ProcessIncomingDropType } from "./hooks/useWaveRealtimeUpdater";
import { useWaveRealtimeUpdater } from "./hooks/useWaveRealtimeUpdater";

// Define nested structures for context data
interface WavesContextData {
  readonly list: MinimalWave[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly addPinnedWave: (id: string) => void;
  readonly removePinnedWave: (id: string) => void;
  readonly loadSubwavesForParent: (parentWaveId: string) => void;
  readonly prefetchSubwavesForParent: (parentWaveId: string) => void;
  readonly restoreWaveUnreadCount: (waveId: string, count?: number) => void;
}

interface ActiveWaveSetOptions {
  readonly isDirectMessage?: boolean | undefined;
  readonly replace?: boolean | undefined;
  readonly serialNo?: number | string | null | undefined;
  readonly divider?: number | null | undefined;
}

interface ActiveWaveContextData {
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

// Define the type for our context using nested structures
interface MyStreamContextType {
  readonly waves: WavesContextData;
  readonly directMessages: WavesContextData;
  readonly activeWave: ActiveWaveContextData;
  readonly waveMessagesStore: WaveMessagesStoreData;
  readonly registerWave: (waveId: string, syncNewest?: boolean) => void;
  readonly fetchNextPageForWave: (
    props: NextPageProps
  ) => Promise<(ApiDrop | ApiDropId)[] | null>;
  readonly fetchAroundSerialNo: (waveId: string, serialNo: number) => void;
  readonly processIncomingDrop: (
    drop: ApiDrop,
    type: ProcessIncomingDropType
  ) => void;
  readonly processDropRemoved: (waveId: string, dropId: string) => void;
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

interface MyStreamProviderProps {
  readonly children: ReactNode;
}

const BROWSER_RESUME_SYNC_COOLDOWN_MS = 1000;

// Create the context
const MyStreamContext = createContext<MyStreamContextType | null>(null);

// Create a provider component
export const MyStreamProvider: React.FC<MyStreamProviderProps> = ({
  children,
}) => {
  const { isCapacitor, isActive } = useCapacitor();
  const { activeWaveId, setActiveWave } = useActiveWaveManager();
  const { wave: activeWaveData } = useWaveById(activeWaveId, {
    enabled: Boolean(activeWaveId),
  });
  const mainWavesData = useWavesList();
  const dmWavesData = useDmWavesList();
  const mainWaveIds = useMemo<ReadonlySet<string>>(
    () => new Set(mainWavesData.waves.map((wave) => wave.id)),
    [mainWavesData.waves]
  );
  const dmWaveIds = useMemo<ReadonlySet<string>>(
    () => new Set(dmWavesData.waves.map((wave) => wave.id)),
    [dmWavesData.waves]
  );
  const wavesHookData = useEnhancedWavesListCore(activeWaveId, mainWavesData, {
    supportsPinning: true,
    otherListWaveIds: dmWaveIds,
    preserveBackendWaveOrder: true,
  });
  const dmWavesHookData = useEnhancedWavesListCore(activeWaveId, dmWavesData, {
    supportsPinning: false,
    otherListWaveIds: mainWaveIds,
  });
  const waveMessagesStore = useWaveMessagesStore();
  const websocketStatus = useWebsocketStatus();
  const prevIsActiveRef = useRef(isActive);
  const lastBrowserResumeSyncAtRef = useRef(0);
  const { removeWaveDeliveredNotifications } = useNotificationsContext();

  // Instantiate the data manager, passing the updater function from the store
  const waveDataManager = useWaveDataManager({
    updateData: waveMessagesStore.updateData,
    getData: waveMessagesStore.getData,
    removeDrop: waveMessagesStore.removeDrop,
  });
  const {
    registerWave,
    syncNewestMessages,
    fetchNextPage,
    fetchAroundSerialNo,
  } = waveDataManager;
  const refetchAllMainWaves = wavesHookData.refetchAllWaves;
  const refetchAllDmWaves = dmWavesHookData.refetchAllWaves;
  const resetAllMainWavesNewDropsCount =
    wavesHookData.resetAllWavesNewDropsCount;
  const resetAllDmWavesNewDropsCount =
    dmWavesHookData.resetAllWavesNewDropsCount;

  const wavesRef = useRef(wavesHookData.waves);
  const dmWavesRef = useRef(dmWavesHookData.waves);

  useLayoutEffect(() => {
    wavesRef.current = wavesHookData.waves;
    dmWavesRef.current = dmWavesHookData.waves;
  }, [wavesHookData.waves, dmWavesHookData.waves]);

  const isWaveMuted = useCallback((waveId: string): boolean => {
    const wave = wavesRef.current.find((w) => w.id === waveId);
    if (wave) return wave.isMuted;
    const dmWave = dmWavesRef.current.find((w) => w.id === waveId);
    if (dmWave) return dmWave.isMuted;
    return false;
  }, []);

  // Instantiate the real-time updater hook
  const { processIncomingDrop, processDropRemoved } = useWaveRealtimeUpdater({
    activeWaveId,
    getData: waveMessagesStore.getData,
    updateData: waveMessagesStore.updateData,
    registerWave,
    syncNewestMessages,
    removeDrop: waveMessagesStore.removeDrop,
    removeWaveDeliveredNotifications,
    isWaveMuted,
  });

  const setActiveWaveAndRegister = useCallback<ActiveWaveContextData["set"]>(
    (waveId, options) => {
      if (waveId) {
        registerWave(waveId, true);
      }
      setActiveWave(waveId, options);
    },
    [registerWave, setActiveWave]
  );

  const syncActiveWaveAndRefetch = useEffectEvent(() => {
    if (activeWaveId) {
      registerWave(activeWaveId, true);
    }
    refetchAllMainWaves();
    refetchAllDmWaves();
  });

  const runBrowserResumeSync = useEffectEvent(() => {
    if (document.visibilityState !== "visible") {
      return;
    }

    const now = Date.now();
    const sinceLastBrowserResumeSyncMs =
      now - lastBrowserResumeSyncAtRef.current;
    if (sinceLastBrowserResumeSyncMs < BROWSER_RESUME_SYNC_COOLDOWN_MS) {
      return;
    }

    lastBrowserResumeSyncAtRef.current = now;
    syncActiveWaveAndRefetch();
  });

  const handleConnectedWebSocket = useEffectEvent(() => {
    syncActiveWaveAndRefetch();

    if (isCapacitor) {
      resetAllMainWavesNewDropsCount();
      resetAllDmWavesNewDropsCount();
    }
  });

  const handleCapacitorResume = useEffectEvent(() => {
    syncActiveWaveAndRefetch();
    resetAllMainWavesNewDropsCount();
    resetAllDmWavesNewDropsCount();
  });

  useEffect(() => {
    if (websocketStatus !== WebSocketStatus.CONNECTED) {
      return;
    }
    handleConnectedWebSocket();
  }, [websocketStatus]);

  useEffect(() => {
    if (activeWaveId) {
      registerWave(activeWaveId, true);
    }
  }, [activeWaveId, registerWave]);

  // Detect when app comes to foreground on mobile
  useEffect(() => {
    if (!isCapacitor) {
      return;
    }

    // Check if app transitioned from background to foreground
    if (!prevIsActiveRef.current && isActive) {
      handleCapacitorResume();
    }

    // Update the ref for next comparison
    prevIsActiveRef.current = isActive;
  }, [isActive, isCapacitor]);

  useEffect(() => {
    if (isCapacitor) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      runBrowserResumeSync();
    };

    const handleFocus = () => {
      runBrowserResumeSync();
    };

    const handleOnline = () => {
      runBrowserResumeSync();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [isCapacitor]);

  // Create the context value using the nested structure
  const contextValue = useMemo<MyStreamContextType>(() => {
    const activeWaveParentId =
      activeWaveData?.id === activeWaveId
        ? (activeWaveData.parent_wave?.id ?? null)
        : null;

    const waves: WavesContextData = {
      list: wavesHookData.waves,
      isFetching: wavesHookData.isFetching,
      isFetchingNextPage: wavesHookData.isFetchingNextPage,
      hasNextPage: wavesHookData.hasNextPage,
      fetchNextPage: wavesHookData.fetchNextPage,
      addPinnedWave: wavesHookData.addPinnedWave,
      removePinnedWave: wavesHookData.removePinnedWave,
      loadSubwavesForParent: wavesHookData.loadSubwavesForParent,
      prefetchSubwavesForParent: wavesHookData.prefetchSubwavesForParent,
      restoreWaveUnreadCount: wavesHookData.restoreWaveUnreadCount,
    };

    const directMessages: WavesContextData = {
      list: dmWavesHookData.waves,
      isFetching: dmWavesHookData.isFetching,
      isFetchingNextPage: dmWavesHookData.isFetchingNextPage,
      hasNextPage: dmWavesHookData.hasNextPage,
      fetchNextPage: dmWavesHookData.fetchNextPage,
      addPinnedWave: dmWavesHookData.addPinnedWave,
      removePinnedWave: dmWavesHookData.removePinnedWave,
      loadSubwavesForParent: dmWavesHookData.loadSubwavesForParent,
      prefetchSubwavesForParent: dmWavesHookData.prefetchSubwavesForParent,
      restoreWaveUnreadCount: dmWavesHookData.restoreWaveUnreadCount,
    };

    const activeWave: ActiveWaveContextData = {
      id: activeWaveId,
      parentWaveId: activeWaveParentId,
      set: setActiveWaveAndRegister,
    };

    // Prepare the store data for the context (only read/subscribe parts)
    const waveMessagesStoreData: WaveMessagesStoreData = {
      getData: waveMessagesStore.getData,
      subscribe: waveMessagesStore.subscribe,
      unsubscribe: waveMessagesStore.unsubscribe,
    };

    return {
      waves,
      directMessages,
      activeWave,
      waveMessagesStore: waveMessagesStoreData,
      registerWave,
      fetchNextPageForWave: fetchNextPage,
      fetchAroundSerialNo,
      processIncomingDrop,
      processDropRemoved,
      applyOptimisticDropUpdate: waveMessagesStore.optimisticUpdateDrop,
    };
  }, [
    wavesHookData.waves,
    wavesHookData.isFetching,
    wavesHookData.isFetchingNextPage,
    wavesHookData.hasNextPage,
    wavesHookData.fetchNextPage,
    wavesHookData.addPinnedWave,
    wavesHookData.removePinnedWave,
    wavesHookData.loadSubwavesForParent,
    wavesHookData.prefetchSubwavesForParent,
    wavesHookData.restoreWaveUnreadCount,
    dmWavesHookData.waves,
    dmWavesHookData.isFetching,
    dmWavesHookData.isFetchingNextPage,
    dmWavesHookData.hasNextPage,
    dmWavesHookData.fetchNextPage,
    dmWavesHookData.addPinnedWave,
    dmWavesHookData.removePinnedWave,
    dmWavesHookData.loadSubwavesForParent,
    dmWavesHookData.prefetchSubwavesForParent,
    dmWavesHookData.restoreWaveUnreadCount,
    activeWaveId,
    activeWaveData,
    setActiveWaveAndRegister,
    waveMessagesStore.getData,
    waveMessagesStore.subscribe,
    waveMessagesStore.unsubscribe,
    registerWave,
    fetchNextPage,
    fetchAroundSerialNo,
    processIncomingDrop,
    processDropRemoved,
    waveMessagesStore.optimisticUpdateDrop,
  ]);

  return (
    <MyStreamContext.Provider value={contextValue}>
      {children}
    </MyStreamContext.Provider>
  );
};

// Create a custom hook for using this context
export const useMyStream = () => {
  const context = useContext(MyStreamContext);
  if (!context) {
    throw new Error("useMyStream must be used within a MyStreamProvider");
  }
  return context;
};

export const useMyStreamOptional = (): MyStreamContextType | null => {
  return useContext(MyStreamContext);
};

// Create the selector hook for wave messages
export function useMyStreamWaveMessages(
  waveId: string | null | undefined
): WaveMessages | undefined {
  const { waveMessagesStore } = useMyStream();
  const { getData, subscribe, unsubscribe } = waveMessagesStore;

  // Use useState to hold the data for the specific waveId
  // Initialize with the current data for that waveId
  const [data, setData] = useState<WaveMessages | undefined>(() =>
    waveId ? getData(waveId) : undefined
  );

  useEffect(() => {
    // If waveId is null or undefined, don't subscribe
    if (!waveId) {
      setData(undefined); // Clear data if waveId becomes null/undefined
      return;
    }

    // Define the listener callback
    const listener: WaveMessagesListener = (
      newData: WaveMessages | undefined
    ) => {
      // Update local state only if data actually differs
      // Use a proper comparison if needed (e.g., deep compare for complex objects)
      setData((currentData: WaveMessages | undefined) => {
        if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
          return newData;
        }
        return currentData;
      });
    };

    // Subscribe to changes for the specific waveId
    subscribe(waveId, listener);

    // Cleanup function: Unsubscribe when component unmounts or waveId changes
    return () => {
      unsubscribe(waveId, listener);
    };
    // Re-run effect if waveId changes or if the stable subscribe/unsubscribe functions change (unlikely but safe)
  }, [waveId, subscribe, unsubscribe]);

  // Re-initialize state if the key changes and getData is available
  // This handles cases where the component using the hook changes the key it's interested in.
  useEffect(() => {
    setData(waveId ? getData(waveId) : undefined);
  }, [waveId, getData]);

  return data;
}
