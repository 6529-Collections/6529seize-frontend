import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import useWavesList from "../../hooks/useWavesList";
import { EnhancedWave } from "../../hooks/useWavesList";
import { useWebSocketMessage } from "../../services/websocket/useWebSocketMessage";
import { ApiWave } from "../../generated/models/ApiWave";
import { WsDropUpdateMessage, WsMessageType } from "../../helpers/Types";
import { AuthContext } from "../../components/auth/Auth";

// Define the type for our context
interface MyStreamContextType {
  // Wave data
  waves: EnhancedWave[];
  pinnedWaves: EnhancedWave[];

  // Loading states
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isPinnedWavesLoading: boolean;
  hasPinnedWavesError: boolean;

  // Pagination
  hasNextPage: boolean;
  fetchNextPage: () => void;
  status: "error" | "success" | "pending";

  // Active wave management
  activeWaveId: string | null;
  setActiveWave: (waveId: string | null) => void;

  // Pinned waves management
  addPinnedWave: (id: string) => void;
  removePinnedWave: (id: string) => void;

  // New drops count management
  resetWaveNewDropsCount: (waveId: string) => void;

  // Additional data
  newDropsCounts: Record<string, number>;
  mainWaves: ApiWave[];
  missingPinnedIds: string[];
}

// Create the context
export const MyStreamContext = createContext<MyStreamContextType | null>(null);

// Create a provider component
export const MyStreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);

  // Track active wave ID for filtering new messages
  const [activeWaveId, setActiveWaveId] = useState<string | null>(null);

  // Keep track of new drop counts separately
  const [newDropsCounts, setNewDropsCounts] = useState<Record<string, number>>(
    {}
  );

  // Get waves data from the optimized hook
  const wavesData = useWavesList();

  // Sync activeWaveId with URL
  useEffect(() => {
    const { wave: waveId } = router.query;
    if (typeof waveId === "string") {
      
      setActiveWaveId(waveId);
      // Reset count for the active wave
      resetWaveNewDropsCount(waveId);

    } else if (waveId === undefined && activeWaveId) {
      // URL no longer has wave parameter
      setActiveWaveId(null);
    }
  }, [router.query]);

  // Function to programmatically change active wave (and update URL)
  const setActiveWave = useCallback(
    (waveId: string | null) => {
      setActiveWaveId(waveId);

      // Update URL
      if (waveId) {
        router.push(`/my-stream?wave=${waveId}`, undefined, { shallow: true });
      } else {
        router.push("/my-stream", undefined, { shallow: true });
      }
    },
    [router]
  );

  // Reset counts for a specific wave
  const resetWaveNewDropsCount = useCallback((waveId: string) => {
    setNewDropsCounts((prev) => ({
      ...prev,
      [waveId]: 0,
    }));
  }, []);

  // Handle visibility changes for active wave
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If user returns to the tab and there's an active wave, reset its count
      if (document.visibilityState === "visible" && activeWaveId) {
        resetWaveNewDropsCount(activeWaveId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeWaveId, resetWaveNewDropsCount]);

  // WebSocket subscription for new drops using callback pattern
  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        // Skip if no waveId
        if (!message || !message.wave.id) return;

        if (
          connectedProfile?.profile?.handle?.toLowerCase() ===
          message.author.handle?.toLowerCase()
        )
          return;

        const waveId = message.wave.id;

        // Skip incrementing if this is the active wave AND the document is visible
        if (waveId === activeWaveId && document.visibilityState === "visible") {
          return;
        }

        // Update the count for this wave
        setNewDropsCounts((prev) => {
          const currentCount = prev[waveId] || 0;
          // Optional: Cap the maximum count at 99
          const MAX_COUNT = 99;
          return {
            ...prev,
            [waveId]: Math.min(currentCount + 1, MAX_COUNT),
          };
        });
      },
      [activeWaveId]
    ) // Make sure to include activeWaveId as a dependency
  );

  // Combine wave data with counts for consumers
  const enhancedWaves = useMemo(() => {
    return wavesData.waves.map((wave) => ({
      ...wave,
      newDropsCount: newDropsCounts[wave.id] || 0,
    }));
  }, [wavesData.waves, newDropsCounts]);

  // Enhanced pinned waves with counts
  const enhancedPinnedWaves = useMemo(() => {
    return wavesData.pinnedWaves.map((wave) => ({
      ...wave,
      newDropsCount: newDropsCounts[wave.id] || 0,
    }));
  }, [wavesData.pinnedWaves, newDropsCounts]);

  // Create the context value
  const contextValue = useMemo<MyStreamContextType>(
    () => ({
      // Enhanced waves with new drop counts
      waves: enhancedWaves,
      pinnedWaves: enhancedPinnedWaves,

      // Pass through loading states
      isFetching: wavesData.isFetching,
      isFetchingNextPage: wavesData.isFetchingNextPage,
      isPinnedWavesLoading: wavesData.isPinnedWavesLoading,
      hasPinnedWavesError: wavesData.hasPinnedWavesError,

      // Pass through pagination
      hasNextPage: wavesData.hasNextPage,
      fetchNextPage: wavesData.fetchNextPage,
      status: wavesData.status,

      // Active wave management
      activeWaveId,
      setActiveWave,

      // Pinned waves management
      addPinnedWave: wavesData.addPinnedWave,
      removePinnedWave: wavesData.removePinnedWave,

      // New drops count management
      resetWaveNewDropsCount,

      // Additional data
      newDropsCounts,
      mainWaves: wavesData.mainWaves,
      missingPinnedIds: wavesData.missingPinnedIds,
    }),
    [
      enhancedWaves,
      enhancedPinnedWaves,
      wavesData.isFetching,
      wavesData.isFetchingNextPage,
      wavesData.isPinnedWavesLoading,
      wavesData.hasPinnedWavesError,
      wavesData.hasNextPage,
      wavesData.fetchNextPage,
      wavesData.status,
      wavesData.addPinnedWave,
      wavesData.removePinnedWave,
      wavesData.mainWaves,
      wavesData.missingPinnedIds,
      activeWaveId,
      setActiveWave,
      resetWaveNewDropsCount,
      newDropsCounts,
    ]
  );

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
