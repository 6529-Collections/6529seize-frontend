import React, { createContext, useContext, useMemo, ReactNode, useEffect } from "react";
import { useActiveWaveManager } from "./hooks/useActiveWaveManager";
import useEnhancedWavesList, {
  MinimalWave,
} from "./hooks/useEnhancedWavesList";
import { 
    useWaveChatManager 
} from "./chat/useWaveChatManager";
import { 
    WaveChatOptions,
    WaveChatState,
    ActivationPriority
} from "./chat/types";
import { DEFAULT_RECENT_THRESHOLD_MS } from "./chat/config";

// Define nested structures for context data
interface WavesContextData {
  readonly list: MinimalWave[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly addPinnedWave: (id: string) => void;
  readonly removePinnedWave: (id: string) => void;
}

interface ActiveWaveContextData {
  readonly id: string | null;
  readonly set: (waveId: string | null) => void;
}

interface ChatContextData {
  readonly cache: ReadonlyMap<string, WaveChatState>;
  readonly fetchOlderDrops: (waveId: string) => Promise<void>;
  readonly queueActivation: (waveId: string, priority: ActivationPriority) => void;
  readonly loadActiveWave: (waveId: string) => void;
  readonly syncWave: (waveId: string) => Promise<void>;
}

// Define the type for our context using nested structures
interface MyStreamContextType {
  readonly waves: WavesContextData;
  readonly activeWave: ActiveWaveContextData;
  readonly chat: ChatContextData;
}

interface MyStreamProviderProps {
  readonly children: ReactNode;
  readonly chatOptions?: WaveChatOptions;
}

// Create the context
export const MyStreamContext = createContext<MyStreamContextType | null>(null);

// Create a provider component
export const MyStreamProvider: React.FC<MyStreamProviderProps> = ({
  children,
  chatOptions,
}) => {
  const { activeWaveId, setActiveWave } = useActiveWaveManager();
  const wavesHookData = useEnhancedWavesList(activeWaveId);
  
  const chatManager = useWaveChatManager(chatOptions);

  // 1. Trigger load for the active wave
  useEffect(() => {
    if (activeWaveId) {
      console.log(`[ProviderTrigger] Loading active wave: ${activeWaveId}`);
      chatManager.loadActiveWave(activeWaveId);
    }
    // Dependency: Run when the active wave ID changes or the load function reference changes (stable)
  }, [activeWaveId, chatManager.loadActiveWave]);

  // 2. Trigger prefetch queueing for recent waves
  useEffect(() => {
    // Determine the threshold (user option or default)
    const thresholdMs = chatOptions?.recentThresholdMs ?? DEFAULT_RECENT_THRESHOLD_MS;
    const cutoffTimestamp = Date.now() - thresholdMs;

    console.log(`[ProviderTrigger] Checking for recent waves (cutoff: ${new Date(cutoffTimestamp).toISOString()})`);

    wavesHookData.waves.forEach(wave => {
      const lastDropTimestamp = wave.newDropsCount.latestDropTimestamp;
      // Queue if the last drop is within the threshold
      if (lastDropTimestamp && lastDropTimestamp >= cutoffTimestamp) {
        console.log(`[ProviderTrigger] Queueing recent wave ${wave.id} (last drop: ${new Date(lastDropTimestamp).toISOString()})`);
        chatManager.queueActivation(wave.id, ActivationPriority.Low);
      }
    });
     // Dependency: Run when the list of waves changes or the queue function reference changes (stable)
  }, [wavesHookData.waves, chatManager.queueActivation, chatOptions?.recentThresholdMs]);

  // Create the context value using the nested structure
  const contextValue = useMemo<MyStreamContextType>(() => {
    const waves: WavesContextData = {
      list: wavesHookData.waves,
      isFetching: wavesHookData.isFetching,
      isFetchingNextPage: wavesHookData.isFetchingNextPage,
      hasNextPage: wavesHookData.hasNextPage,
      fetchNextPage: wavesHookData.fetchNextPage,
      addPinnedWave: wavesHookData.addPinnedWave,
      removePinnedWave: wavesHookData.removePinnedWave,
    };

    const activeWave: ActiveWaveContextData = {
      id: activeWaveId,
      set: setActiveWave,
    };
    
    const chat: ChatContextData = {
      cache: chatManager.cache,
      fetchOlderDrops: chatManager.fetchOlderDrops,
      queueActivation: chatManager.queueActivation,
      loadActiveWave: chatManager.loadActiveWave,
      syncWave: chatManager.syncWave,
    };

    return {
      waves,
      activeWave,
      chat,
    };
  }, [
    wavesHookData.waves,
    wavesHookData.isFetching,
    wavesHookData.isFetchingNextPage,
    wavesHookData.hasNextPage,
    wavesHookData.fetchNextPage,
    wavesHookData.addPinnedWave,
    wavesHookData.removePinnedWave,
    activeWaveId,
    setActiveWave,
    chatManager.cache,
    chatManager.fetchOlderDrops,
    chatManager.queueActivation,
    chatManager.loadActiveWave,
    chatManager.syncWave,
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
