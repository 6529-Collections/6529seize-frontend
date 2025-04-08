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
import { useWebSocketMessage } from "../../services/websocket/useWebSocketMessage";
import { ApiWave } from "../../generated/models/ApiWave";
import { WsDropUpdateMessage, WsMessageType } from "../../helpers/Types";
import { AuthContext } from "../../components/auth/Auth";
import { ApiWaveType } from "../../generated/models/ApiWaveType";

interface MinimalWaveNewDropsCount {
  readonly count: number;
  readonly latestDropTimestamp: number | null;
}

export interface MinimalWave {
  id: string;
  name: string;
  type: ApiWaveType;
  newDropsCount: MinimalWaveNewDropsCount;
  picture: string | null;
  contributors: {
    pfp: string;
  }[];
}

// Define the type for our context
interface MyStreamContextType {
  // Wave data
  waves: MinimalWave[];

  // Loading states
  isFetching: boolean;
  isFetchingNextPage: boolean;

  // Pagination
  hasNextPage: boolean;
  fetchNextPage: () => void;

  // Active wave management
  activeWaveId: string | null;
  setActiveWave: (waveId: string | null) => void;

  // Pinned waves management
  addPinnedWave: (id: string) => void;
  removePinnedWave: (id: string) => void;
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

  // Get waves data from the optimized hook
  const wavesData = useWavesList();

  // Keep track of new drop counts separately
  const [newDropsCounts, setNewDropsCounts] = useState<
    Record<string, MinimalWaveNewDropsCount>
  >({});

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
  const resetWaveNewDropsCount = useCallback(
    (waveId: string) => {
      setNewDropsCounts((prev) => ({
        ...prev,
        [waveId]: {
          count: 0,
          latestDropTimestamp:
            prev[waveId]?.latestDropTimestamp ??
            wavesData.waves.find((wave) => wave.id === waveId)?.metrics
              .latest_drop_timestamp ??
            null,
        },
      }));
    },
    [wavesData.waves]
  );

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
        if (!message?.wave.id) return;

        const waveId = message.wave.id;
        const wave = wavesData.waves.find((w) => w.id === waveId);

        if (!wave) {
          wavesData.mainWavesRefetch();
        }

        if (
          connectedProfile?.profile?.handle?.toLowerCase() ===
          message.author.handle?.toLowerCase()
        )
          return setNewDropsCounts((prev) => {
            const currentCount = prev[waveId]?.count ?? 0;
            const currentLatestDropTimestamp =
              prev[waveId]?.latestDropTimestamp ?? null;
            return {
              ...prev,
              [waveId]: {
                count: currentCount,
                latestDropTimestamp: Math.max(
                  message.created_at,
                  currentLatestDropTimestamp ?? 0
                ),
              },
            };
          });

        // Skip incrementing if this is the active wave AND the document is visible
        if (waveId === activeWaveId && document.visibilityState === "visible") {
          return setNewDropsCounts((prev) => {
            const currentCount = prev[waveId]?.count ?? 0;
            const currentLatestDropTimestamp =
              prev[waveId]?.latestDropTimestamp ?? null;
            return {
              ...prev,
              [waveId]: {
                count: currentCount,
                latestDropTimestamp: Math.max(
                  message.created_at,
                  currentLatestDropTimestamp ?? 0
                ),
              },
            };
          });
        }

        // Update the count for this wave
        setNewDropsCounts((prev) => {
          const currentCount = prev[waveId]?.count ?? 0;
          const currentLatestDropTimestamp =
            prev[waveId]?.latestDropTimestamp ?? null;
          // Optional: Cap the maximum count at 99
          const MAX_COUNT = 99;
          return {
            ...prev,
            [waveId]: {
              count: Math.min(currentCount + 1, MAX_COUNT),
              latestDropTimestamp: Math.max(
                message.created_at,
                currentLatestDropTimestamp ?? 0
              ),
            },
          };
        });
      },
      [activeWaveId, connectedProfile]
    ) // Make sure to include activeWaveId as a dependency
  );

  // Helper function to map API wave data to MinimalWave format
  const mapWaveToMinimalWave = useCallback(
    (wave: ApiWave): MinimalWave => {
      const newDropsData = {
        count: newDropsCounts[wave.id]?.count ?? 0,
        latestDropTimestamp:
          newDropsCounts[wave.id]?.latestDropTimestamp ??
          wave.metrics.latest_drop_timestamp ??
          null,
      };
      return {
        id: wave.id, // Add the missing id property
        name: wave.name,
        type: wave.wave.type,
        picture: wave.picture,
        contributors: wave.contributors_overview.map((c) => ({
          pfp: c.contributor_pfp,
        })),
        newDropsCount: newDropsData,
      };
    },
    [newDropsCounts]
  );

  // Combine wave data with counts for consumers
  const enhancedWaves = useMemo(() => {
    return wavesData.waves.map(mapWaveToMinimalWave);
  }, [wavesData.waves, mapWaveToMinimalWave]);

  // Create the context value
  const contextValue = useMemo<MyStreamContextType>(
    () => ({
      // Enhanced waves with new drop counts
      waves: enhancedWaves.sort(
        (a, b) =>
          (b.newDropsCount.latestDropTimestamp ?? 0) -
          (a.newDropsCount.latestDropTimestamp ?? 0)
      ),

      // Pass through loading states
      isFetching: wavesData.isFetching,
      isFetchingNextPage: wavesData.isFetchingNextPage,

      // Pass through pagination
      hasNextPage: wavesData.hasNextPage,
      fetchNextPage: wavesData.fetchNextPage,

      // Active wave management
      activeWaveId,
      setActiveWave,

      // Pinned waves management
      addPinnedWave: wavesData.addPinnedWave,
      removePinnedWave: wavesData.removePinnedWave,
    }),
    [
      enhancedWaves,
      wavesData.isFetching,
      wavesData.isFetchingNextPage,
      wavesData.hasNextPage,
      wavesData.fetchNextPage,
      wavesData.addPinnedWave,
      wavesData.removePinnedWave,
      activeWaveId,
      setActiveWave,
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
