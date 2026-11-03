"use client";

import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import useCapacitor from "@/hooks/useCapacitor";
import useDmWavesList from "@/hooks/useDmWavesList";
import { useWaveById } from "@/hooks/useWaveById";
import useWavesList from "@/hooks/useWavesList";
import { usePathname } from "next/navigation";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { useWebsocketStatus } from "@/services/websocket/useWebSocketMessage";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";
import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { WaveMessages } from "./hooks/types";
import { useActiveWaveManager } from "./hooks/useActiveWaveManager";
import useEnhancedWavesListCore from "./hooks/useEnhancedWavesListCore";
import { useRecentDirectMessagePrefetch } from "./hooks/useRecentDirectMessagePrefetch";
import { useWaveDataManager } from "./hooks/useWaveDataManager";
import type { Listener as WaveMessagesListener } from "./hooks/useWaveMessagesStore";
import useWaveMessagesStore from "./hooks/useWaveMessagesStore";
import { useWaveRealtimeUpdater } from "./hooks/useWaveRealtimeUpdater";
import { useDmUnreadConversations } from "@/services/dm-unread/DmUnreadStateProvider";
import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";

import type {
  ActiveWaveContextData,
  ActiveWaveSetOptions,
  MyStreamActionsContextType,
  MyStreamContextType,
  WavesContextData,
} from "./MyStreamContext.types";

interface MyStreamProviderProps {
  readonly children: ReactNode;
}

const BROWSER_RESUME_SYNC_COOLDOWN_MS = 1000;
const MAIN_WAVES_LIST_IDLE_DELAY_MS = 1000;
const MAIN_WAVES_LIST_IDLE_TIMEOUT_MS = 2500;

type BrowserIdleScheduler = {
  readonly requestIdleCallback?: (
    runTask: () => void,
    options?: { readonly timeout: number }
  ) => number;
  readonly cancelIdleCallback?: (handle: number) => void;
};

type WaveMuteState = {
  readonly metrics?: {
    readonly muted?: boolean;
  } | null;
};

const getWaveMuted = (wave: WaveMuteState | null | undefined): boolean =>
  wave?.metrics?.muted ?? false;

const hasSerialNoTarget = (
  serialNo: ActiveWaveSetOptions["serialNo"]
): boolean =>
  serialNo !== undefined && serialNo !== null && String(serialNo).trim() !== "";

const scheduleAfterRouteIdle = (runTask: () => void): (() => void) => {
  let idleHandle: number | null = null;
  const timeoutHandle = globalThis.setTimeout(() => {
    const idleWindow = globalThis as unknown as BrowserIdleScheduler;
    if (typeof idleWindow.requestIdleCallback === "function") {
      idleHandle = idleWindow.requestIdleCallback(runTask, {
        timeout: MAIN_WAVES_LIST_IDLE_TIMEOUT_MS,
      });
      return;
    }

    runTask();
  }, MAIN_WAVES_LIST_IDLE_DELAY_MS);

  return () => {
    globalThis.clearTimeout(timeoutHandle);

    if (idleHandle !== null) {
      const idleWindow = globalThis as unknown as BrowserIdleScheduler;
      idleWindow.cancelIdleCallback?.(idleHandle);
    }
  };
};

// Create the contexts
const MyStreamContext = createContext<MyStreamContextType | null>(null);
const MyStreamActionsContext = createContext<MyStreamActionsContextType | null>(
  null
);

// Create a provider component
export const MyStreamProvider: React.FC<MyStreamProviderProps> = ({
  children,
}) => {
  const { isCapacitor, isActive } = useCapacitor();
  const pathname = usePathname() as string | null;
  const { activeWaveId, hasActiveWaveDropTarget, setActiveWave } =
    useActiveWaveManager();
  const [
    directMessagesListActivationCount,
    setDirectMessagesListActivationCount,
  ] = useState(0);
  const isDirectMessagesRoute = pathname?.startsWith("/messages") ?? false;
  const isWaveDetailRoute = pathname?.startsWith("/waves/") ?? false;
  const isDirectMessageDetailRoute =
    pathname?.startsWith("/messages/") ?? false;
  const hasMountedActiveWaveRegistrationRef = useRef(false);
  // Native wave detail defers the main list until it is requested or the
  // route goes idle. Web (and the server render) waits for a surface that
  // shows the list, so other routes never fetch or poll it. Once requested,
  // the list stays enabled for the session.
  const shouldDeferNativeMainWavesList =
    isCapacitor && isWaveDetailRoute && !isDirectMessagesRoute;
  const shouldDeferMainWavesList =
    !isCapacitor || shouldDeferNativeMainWavesList;
  const [hasMainWavesListBeenRequested, setHasMainWavesListBeenRequested] =
    useState(false);
  const hasMainWavesListBeenRequestedRef = useRef(false);
  const isMainWavesListEnabled =
    !shouldDeferMainWavesList || hasMainWavesListBeenRequested;
  const isDirectMessagesListEnabled =
    isDirectMessagesRoute || directMessagesListActivationCount > 0;
  const { wave: activeWaveData } = useWaveById(activeWaveId, {
    enabled: Boolean(activeWaveId),
  });
  const resolvedActiveWaveData =
    activeWaveData?.id === activeWaveId ? activeWaveData : null;
  const mainWavesData = useWavesList({
    enabled: isMainWavesListEnabled,
    ...(resolvedActiveWaveData ? { activeWave: resolvedActiveWaveData } : {}),
  });
  const dmWavesData = useDmWavesList({
    enabled: isDirectMessagesListEnabled,
  });
  const dmUnreadByWaveId = useDmUnreadConversations();
  const markWaveNotificationsRead = useMarkWaveNotificationsRead();
  const mainWaveIds = useMemo<ReadonlySet<string>>(
    () => new Set(mainWavesData.waves.map((wave) => wave.id)),
    [mainWavesData.waves]
  );
  const dmWaveIds = useMemo<ReadonlySet<string>>(
    () => new Set(dmWavesData.waves.map((wave) => wave.id)),
    [dmWavesData.waves]
  );
  const wavesHookData = useEnhancedWavesListCore(activeWaveId, mainWavesData, {
    enabled: isMainWavesListEnabled,
    supportsPinning: true,
    otherListWaveIds: dmWaveIds,
    preserveBackendWaveOrder: true,
  });
  const dmWavesHookData = useEnhancedWavesListCore(activeWaveId, dmWavesData, {
    enabled: isDirectMessagesListEnabled,
    supportsPinning: false,
    otherListWaveIds: mainWaveIds,
    sortMutedLast: false,
    canonicalUnreadByWaveId: dmUnreadByWaveId,
  });
  const waveMessagesStore = useWaveMessagesStore();
  const websocketStatus = useWebsocketStatus();
  const prevIsActiveRef = useRef(isActive);
  const lastBrowserResumeSyncAtRef = useRef(0);
  const { removeWaveDeliveredNotifications } = useNotificationsContext();
  const markDirectMessageRead = useCallback(
    (waveId: string, readThroughSerialNo?: number) => {
      void markWaveNotificationsRead(waveId, {
        readThroughSerialNo,
        requestDmUnreadState: true,
      }).catch(() => undefined);
    },
    [markWaveNotificationsRead]
  );

  // Instantiate the data manager, passing the updater function from the store
  const waveDataManager = useWaveDataManager({
    updateData: waveMessagesStore.updateData,
    getData: waveMessagesStore.getData,
    hasServerFeedSeed: waveMessagesStore.hasServerFeedSeed,
    removeDrop: waveMessagesStore.removeDrop,
    isCapacitor,
  });
  const {
    registerWave,
    prefetchWave,
    syncNewestMessages,
    fetchNextPage,
    fetchAroundSerialNo,
    cancelWaveDataFetch,
    cancelPaginationFetch,
  } = waveDataManager;
  useRecentDirectMessagePrefetch({
    enabled:
      isCapacitor && isActive && pathname === "/messages" && !activeWaveId,
    waves: dmWavesHookData.waves,
    viewerIdentityKey: dmWavesData.viewerIdentityKey,
    prefetchWave,
  });
  const { clearWave } = waveMessagesStore;
  const refreshWaveMessages = useCallback(
    (waveId: string) => {
      if (!clearWave(waveId)) return;
      cancelWaveDataFetch(waveId);
      cancelPaginationFetch(waveId);
      registerWave(waveId);
    },
    [cancelWaveDataFetch, cancelPaginationFetch, clearWave, registerWave]
  );
  const refetchAllMainWaves = wavesHookData.refetchAllWaves;
  const refetchAllDmWaves = dmWavesHookData.refetchAllWaves;
  const refreshStaleMainWaves = mainWavesData.refreshStaleWaves;
  const refreshStaleDmWaves = dmWavesData.refreshStaleWaves;
  const resetAllMainWavesNewDropsCount =
    wavesHookData.resetAllWavesNewDropsCount;
  const resetAllDmWavesNewDropsCount =
    dmWavesHookData.resetAllWavesNewDropsCount;

  const enableMainWavesList = useCallback(() => {
    if (hasMainWavesListBeenRequestedRef.current) {
      return;
    }

    hasMainWavesListBeenRequestedRef.current = true;
    markMobileLaunchStep("main_waves_list_enabled");
    setHasMainWavesListBeenRequested(true);
  }, []);

  const requestMainWavesList = useCallback(() => {
    enableMainWavesList();
    return () => {};
  }, [enableMainWavesList]);

  const requestDirectMessagesList = useCallback(() => {
    let didRelease = false;
    setDirectMessagesListActivationCount((count) => count + 1);

    return () => {
      if (didRelease) {
        return;
      }

      didRelease = true;
      setDirectMessagesListActivationCount((count) => Math.max(0, count - 1));
    };
  }, []);

  useEffect(() => {
    if (!shouldDeferNativeMainWavesList || isMainWavesListEnabled) {
      return;
    }

    markMobileLaunchStep("main_waves_list_deferred");
    return scheduleAfterRouteIdle(enableMainWavesList);
  }, [
    enableMainWavesList,
    isMainWavesListEnabled,
    shouldDeferNativeMainWavesList,
  ]);

  const wavesRef = useRef(wavesHookData.waves);
  const dmWavesRef = useRef(dmWavesHookData.waves);

  useLayoutEffect(() => {
    wavesRef.current = wavesHookData.waves;
    dmWavesRef.current = dmWavesHookData.waves;
  }, [wavesHookData.waves, dmWavesHookData.waves]);

  const activeWaveDataId = resolvedActiveWaveData?.id ?? null;
  const activeWaveMuted = getWaveMuted(resolvedActiveWaveData);
  const isWaveMuted = useCallback(
    (waveId: string): boolean => {
      const wave = wavesRef.current.find((w) => w.id === waveId);
      if (wave) return wave.isMuted;
      const dmWave = dmWavesRef.current.find((w) => w.id === waveId);
      if (dmWave) return dmWave.isMuted;
      if (activeWaveDataId === waveId) return activeWaveMuted;
      return false;
    },
    [activeWaveDataId, activeWaveMuted]
  );

  // Instantiate the real-time updater hook
  const { processIncomingDrop, processDropRemoved } = useWaveRealtimeUpdater({
    activeWaveId,
    getData: waveMessagesStore.getData,
    hasServerFeedSeed: waveMessagesStore.hasServerFeedSeed,
    isWaveInUse: waveMessagesStore.isWaveInUse,
    updateData: waveMessagesStore.updateData,
    registerWave,
    syncNewestMessages,
    removeDrop: waveMessagesStore.removeDrop,
    removeDrops: waveMessagesStore.removeDrops,
    removeWaveDeliveredNotifications,
    isWaveMuted,
  });

  // processIncomingDrop is rebuilt when the active wave, its mute state or
  // wave eligibility changes. Expose a stable wrapper that always calls the
  // latest implementation, so callers holding it never use a stale closure.
  const processIncomingDropRef = useRef(processIncomingDrop);
  useInsertionEffect(() => {
    processIncomingDropRef.current = processIncomingDrop;
  }, [processIncomingDrop]);
  const stableProcessIncomingDrop = useCallback<
    MyStreamActionsContextType["processIncomingDrop"]
  >((drop, type) => processIncomingDropRef.current(drop, type), []);

  const setActiveWaveAndRegister = useCallback<ActiveWaveContextData["set"]>(
    (waveId, options) => {
      if (waveId) {
        registerWave(waveId, true, {
          skipInitialBackfill: hasSerialNoTarget(options?.serialNo),
        });
      }
      setActiveWave(waveId, options);
    },
    [registerWave, setActiveWave]
  );

  const syncActiveWave = useEffectEvent(() => {
    if (activeWaveId) {
      registerWave(activeWaveId, true, {
        skipInitialBackfill: hasActiveWaveDropTarget,
      });
    }
  });

  // Native resume and reconnect reset the live new-drop counters, so they
  // keep a full refetch of the lists that replace those counts.
  const syncActiveWaveAndRefetch = useEffectEvent(() => {
    syncActiveWave();
    refetchAllMainWaves();
    if (isDirectMessagesListEnabled) {
      refetchAllDmWaves();
    }
  });

  // Web reconnect and tab resume skip lists no surface has requested and
  // refresh only data past its staleTime, reusing in-flight requests. These
  // flags only pre-filter: each hook's own load guard (auth and profile
  // readiness) stays the source of truth and no-ops while it is not ready.
  const syncActiveWaveAndRefreshStaleLists = useEffectEvent(() => {
    syncActiveWave();
    if (isMainWavesListEnabled) {
      refreshStaleMainWaves();
    }
    if (isDirectMessagesListEnabled) {
      refreshStaleDmWaves();
    }
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
    syncActiveWaveAndRefreshStaleLists();
  });

  const handleConnectedWebSocket = useEffectEvent(() => {
    if (!isCapacitor) {
      syncActiveWaveAndRefreshStaleLists();
      return;
    }

    syncActiveWaveAndRefetch();
    resetAllMainWavesNewDropsCount();
    if (isDirectMessagesListEnabled) {
      resetAllDmWavesNewDropsCount();
    }
  });

  const handleCapacitorResume = useEffectEvent(() => {
    syncActiveWaveAndRefetch();
    resetAllMainWavesNewDropsCount();
    if (isDirectMessagesListEnabled) {
      resetAllDmWavesNewDropsCount();
    }
  });

  useEffect(() => {
    if (websocketStatus !== WebSocketStatus.CONNECTED) {
      return;
    }
    handleConnectedWebSocket();
  }, [websocketStatus]);

  // The message store never evicts the active wave and counts it as used.
  const { trackActiveWave, subscribeToEvictions } = waveMessagesStore;
  useLayoutEffect(() => {
    trackActiveWave(activeWaveId);
  }, [activeWaveId, trackActiveWave]);

  // An evicted wave gives up its requests, timers and per-wave state, so it
  // loads from scratch when it is opened again.
  useEffect(
    () =>
      subscribeToEvictions((waveId) => {
        cancelWaveDataFetch(waveId);
        cancelPaginationFetch(waveId);
      }),
    [cancelPaginationFetch, cancelWaveDataFetch, subscribeToEvictions]
  );

  useEffect(() => {
    if (!hasMountedActiveWaveRegistrationRef.current) {
      hasMountedActiveWaveRegistrationRef.current = true;
      if (isWaveDetailRoute || isDirectMessageDetailRoute) {
        return;
      }
    }
    if (activeWaveId) {
      registerWave(activeWaveId, true, {
        skipInitialBackfill: hasActiveWaveDropTarget,
      });
    }
  }, [
    activeWaveId,
    hasActiveWaveDropTarget,
    isDirectMessageDetailRoute,
    isWaveDetailRoute,
    registerWave,
  ]);

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

  // Actions depend only on stable store and data-manager callbacks, so this
  // value keeps its identity when drops arrive or wave lists change. The
  // destructive store callbacks still rebind on a profile switch, so a caller
  // holding an old one cannot change the new profile's cache.
  const actionsValue = useMemo<MyStreamActionsContextType>(
    () => ({
      // Prepare the store data for the context (only read/subscribe parts)
      waveMessagesStore: {
        getData: waveMessagesStore.getData,
        subscribe: waveMessagesStore.subscribe,
        unsubscribe: waveMessagesStore.unsubscribe,
      },
      requestMainWavesList,
      requestDirectMessagesList,
      registerWave,
      serverFeedSeed: {
        registerPending: waveMessagesStore.registerPendingServerFeedSeed,
        clearPending: waveMessagesStore.clearPendingServerFeedSeed,
        replacePending: waveMessagesStore.replacePendingServerFeedSeed,
        expire: waveMessagesStore.expireServerFeedSeed,
        apply: waveMessagesStore.applyServerFeedSeed,
        completeInitialRegistration:
          waveMessagesStore.completeInitialServerFeedRegistration,
      },
      fetchNextPageForWave: fetchNextPage,
      fetchAroundSerialNo,
      processIncomingDrop: stableProcessIncomingDrop,
      processDropRemoved,
      processDropsRemoved: waveMessagesStore.removeDrops,
      refreshWaveMessages,
      applyOptimisticDropUpdate: waveMessagesStore.optimisticUpdateDrop,
    }),
    [
      waveMessagesStore.getData,
      waveMessagesStore.subscribe,
      waveMessagesStore.unsubscribe,
      requestMainWavesList,
      requestDirectMessagesList,
      registerWave,
      waveMessagesStore.registerPendingServerFeedSeed,
      waveMessagesStore.clearPendingServerFeedSeed,
      waveMessagesStore.replacePendingServerFeedSeed,
      waveMessagesStore.expireServerFeedSeed,
      waveMessagesStore.applyServerFeedSeed,
      waveMessagesStore.completeInitialServerFeedRegistration,
      fetchNextPage,
      fetchAroundSerialNo,
      stableProcessIncomingDrop,
      processDropRemoved,
      waveMessagesStore.removeDrops,
      refreshWaveMessages,
      waveMessagesStore.optimisticUpdateDrop,
    ]
  );

  // Create the context value using the nested structure
  const contextValue = useMemo<MyStreamContextType>(() => {
    const activeWaveParentId =
      resolvedActiveWaveData?.id === activeWaveId
        ? (resolvedActiveWaveData.parent_wave?.id ?? null)
        : null;

    const waves: WavesContextData = {
      recommendationsStatus: mainWavesData.recommendationsStatus,
      retryRecommendations: mainWavesData.retryRecommendations,
      isAnnouncementsLoading: mainWavesData.isAnnouncementsLoading,
      hasLoadingError: mainWavesData.hasLoadingError,
      retryLoading: mainWavesData.retryLoading,
      isPinnedWavesLoading: mainWavesData.isPinnedWavesLoading,
      list: wavesHookData.waves,
      // A list still waiting for its first request reads as loading, so the
      // server render and first client frame show the loader, not "empty".
      isFetching: isMainWavesListEnabled ? wavesHookData.isFetching : true,
      isFetchingNextPage: wavesHookData.isFetchingNextPage,
      hasNextPage: wavesHookData.hasNextPage,
      fetchNextPage: wavesHookData.fetchNextPage,
      addPinnedWave: wavesHookData.addPinnedWave,
      removePinnedWave: wavesHookData.removePinnedWave,
      loadSubwavesForParent: wavesHookData.loadSubwavesForParent,
      prefetchSubwavesForParent: wavesHookData.prefetchSubwavesForParent,
      loadingSubwaveParentIds: wavesHookData.loadingSubwaveParentIds,
      markWaveRead: wavesHookData.markWaveRead,
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
      loadingSubwaveParentIds: dmWavesHookData.loadingSubwaveParentIds,
      markWaveRead: markDirectMessageRead,
      restoreWaveUnreadCount: dmWavesHookData.restoreWaveUnreadCount,
    };

    const activeWave: ActiveWaveContextData = {
      id: activeWaveId,
      parentWaveId: activeWaveParentId,
      set: setActiveWaveAndRegister,
    };

    return {
      ...actionsValue,
      waves,
      directMessages,
      activeWave,
    };
  }, [
    actionsValue,
    wavesHookData.waves,
    mainWavesData.isPinnedWavesLoading,
    mainWavesData.recommendationsStatus,
    mainWavesData.retryRecommendations,
    mainWavesData.isAnnouncementsLoading,
    mainWavesData.hasLoadingError,
    mainWavesData.retryLoading,
    isMainWavesListEnabled,
    wavesHookData.isFetching,
    wavesHookData.isFetchingNextPage,
    wavesHookData.hasNextPage,
    wavesHookData.fetchNextPage,
    wavesHookData.addPinnedWave,
    wavesHookData.removePinnedWave,
    wavesHookData.loadSubwavesForParent,
    wavesHookData.prefetchSubwavesForParent,
    wavesHookData.loadingSubwaveParentIds,
    wavesHookData.markWaveRead,
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
    dmWavesHookData.loadingSubwaveParentIds,
    dmWavesHookData.restoreWaveUnreadCount,
    markDirectMessageRead,
    activeWaveId,
    resolvedActiveWaveData,
    setActiveWaveAndRegister,
  ]);

  return (
    <MyStreamActionsContext.Provider value={actionsValue}>
      <MyStreamContext.Provider value={contextValue}>
        {children}
      </MyStreamContext.Provider>
    </MyStreamActionsContext.Provider>
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

// Prefer these over useMyStream when a component only calls stream actions:
// the actions value does not change when drops arrive, so callers skip the
// re-render that every stream data change causes for useMyStream consumers.
export const useMyStreamActions = (): MyStreamActionsContextType => {
  const context = useContext(MyStreamActionsContext);
  if (!context) {
    throw new Error(
      "useMyStreamActions must be used within a MyStreamProvider"
    );
  }
  return context;
};

export const useMyStreamActionsOptional =
  (): MyStreamActionsContextType | null => {
    return useContext(MyStreamActionsContext);
  };

// Create the selector hook for wave messages
export function useMyStreamWaveMessages(
  waveId: string | null | undefined
): WaveMessages | undefined {
  const { waveMessagesStore } = useMyStreamActions();
  const { getData, subscribe, unsubscribe } = waveMessagesStore;

  const getSnapshot = useCallback(
    () => (waveId ? getData(waveId) : undefined),
    [getData, waveId]
  );

  const subscribeToWave = useCallback(
    (onStoreChange: () => void) => {
      if (!waveId) {
        return () => {};
      }

      const listener: WaveMessagesListener = () => onStoreChange();
      subscribe(waveId, listener);

      return () => {
        unsubscribe(waveId, listener);
      };
    },
    [subscribe, unsubscribe, waveId]
  );

  return useSyncExternalStore(subscribeToWave, getSnapshot, getSnapshot);
}
