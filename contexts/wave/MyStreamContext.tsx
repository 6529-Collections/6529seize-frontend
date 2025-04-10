import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useActiveWaveManager } from "./hooks/useActiveWaveManager";
import useEnhancedWavesList, {
  MinimalWave,
} from "./hooks/useEnhancedWavesList";
import useWaveMessagesStore, {
  WaveMessages,
  Listener as WaveMessagesListener,
} from "./hooks/useWaveMessagesStore";

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

// Define the interface for the wave messages store functions
interface WaveMessagesStoreData {
  readonly getData: (key: string) => WaveMessages | undefined;
  readonly subscribe: (key: string, listener: WaveMessagesListener) => void;
  readonly unsubscribe: (key: string, listener: WaveMessagesListener) => void;
  // Expose updateData only if components outside the provider need to update messages directly
  readonly updateData: (key: string, value: WaveMessages | undefined) => void;
}

// Define the type for our context using nested structures
interface MyStreamContextType {
  readonly waves: WavesContextData;
  readonly activeWave: ActiveWaveContextData;
  readonly waveMessagesStore: WaveMessagesStoreData;
}

interface MyStreamProviderProps {
  readonly children: ReactNode;
}

// Create the context
export const MyStreamContext = createContext<MyStreamContextType | null>(null);

// Create a provider component
export const MyStreamProvider: React.FC<MyStreamProviderProps> = ({
  children,
}) => {
  const { activeWaveId, setActiveWave } = useActiveWaveManager();
  const wavesHookData = useEnhancedWavesList(activeWaveId);
  const waveMessagesStore = useWaveMessagesStore();

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

    // Prepare the store data for the context
    const waveMessagesStoreData: WaveMessagesStoreData = {
      getData: waveMessagesStore.getData,
      subscribe: waveMessagesStore.subscribe,
      unsubscribe: waveMessagesStore.unsubscribe,
      updateData: waveMessagesStore.updateData,
    };

    return {
      waves,
      activeWave,
      waveMessagesStore: waveMessagesStoreData,
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
    waveMessagesStore.getData,
    waveMessagesStore.subscribe,
    waveMessagesStore.unsubscribe,
    waveMessagesStore.updateData,
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
    const listener: WaveMessagesListener = (newData: WaveMessages | undefined) => {
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
