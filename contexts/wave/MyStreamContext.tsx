import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useActiveWaveManager } from "./hooks/useActiveWaveManager";
import useEnhancedWavesList, {
  MinimalWave,
} from "./hooks/useEnhancedWavesList";

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

// Define the type for our context using nested structures
interface MyStreamContextType {
  readonly waves: WavesContextData;
  readonly activeWave: ActiveWaveContextData;
  // Future top-level categories can be added here
}

// Create the context
export const MyStreamContext = createContext<MyStreamContextType | null>(null);

// Create a provider component
export const MyStreamProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const { activeWaveId, setActiveWave } = useActiveWaveManager();
  const wavesHookData = useEnhancedWavesList(activeWaveId);

  // Create the context value using the nested structure
  const contextValue = useMemo<MyStreamContextType>(() => {
    // Group wave-related data
    const waves: WavesContextData = {
      list: wavesHookData.waves,
      isFetching: wavesHookData.isFetching,
      isFetchingNextPage: wavesHookData.isFetchingNextPage,
      hasNextPage: wavesHookData.hasNextPage,
      fetchNextPage: wavesHookData.fetchNextPage,
      addPinnedWave: wavesHookData.addPinnedWave,
      removePinnedWave: wavesHookData.removePinnedWave,
    };

    // Group active wave data
    const activeWave: ActiveWaveContextData = {
      id: activeWaveId,
      set: setActiveWave,
    };

    return {
      waves,
      activeWave,
    };
  }, [
    // Dependencies from useEnhancedWavesList
    wavesHookData.waves,
    wavesHookData.isFetching,
    wavesHookData.isFetchingNextPage,
    wavesHookData.hasNextPage,
    wavesHookData.fetchNextPage,
    wavesHookData.addPinnedWave,
    wavesHookData.removePinnedWave,
    // Dependencies from useActiveWaveManager
    activeWaveId,
    setActiveWave,
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
