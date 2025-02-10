import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiWaveDropsFeed } from "../generated/models/ApiWaveDropsFeed";
import { commonApiFetch } from "../services/api/common-api";
import { ExtendedDrop } from "../helpers/waves/drop.helpers";
import useCapacitor from "./useCapacitor";

interface PollingState {
  hasNewDrops: boolean;
  lastPolledData?: ApiWaveDropsFeed;
  lastError?: Error;
}

interface UseWavePollingConfig {
  readonly pollingDelay?: number;
  readonly activePollingInterval?: number;
  readonly inactivePollingInterval?: number;
}

const DEFAULT_CONFIG: Required<UseWavePollingConfig> = {
  pollingDelay: 3000,
  activePollingInterval: 5000,
  inactivePollingInterval: 30000,
};

/**
 * Hook to poll for new wave drops
 * @param queryKey - React Query key for caching
 * @param waveId - ID of the wave to poll
 * @param dropId - Optional drop ID to filter
 * @param drops - Current list of drops
 * @param isTabVisible - Whether the browser tab is visible
 * @param onNewDrops - Callback when new drops are found
 * @param config - Optional configuration for polling intervals
 * @returns Object containing polling state
 */
export function useWavePolling(
  queryKey: unknown[],
  waveId: string,
  dropId: string | null,
  drops: ExtendedDrop[],
  isTabVisible: boolean,
  onNewDrops: () => void,
  config: UseWavePollingConfig = {}
) {
  const { isCapacitor } = useCapacitor();

  const { pollingDelay, activePollingInterval, inactivePollingInterval } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const [pollingState, setPollingState] = useState<PollingState>({
    hasNewDrops: false,
  });

  const { data: pollingResult, error } = useQuery({
    queryKey: [...queryKey, "polling"],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {
          limit: "1",
        };
        if (dropId) {
          params.drop_id = dropId;
        }
        return await commonApiFetch<ApiWaveDropsFeed>({
          endpoint: `waves/${waveId}/drops`,
          params,
        });
      } catch (error) {
        setPollingState((prev) => ({
          ...prev,
          lastError:
            error instanceof Error
              ? error
              : new Error("Unknown error occurred"),
        }));
        throw error;
      }
    },
    enabled: !pollingState.hasNewDrops && !!waveId,
    refetchInterval: isTabVisible
      ? activePollingInterval
      : inactivePollingInterval,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    retry: 3,
  });

  useEffect(() => {
    if (!pollingResult) return;

    const timeoutId = setTimeout(() => {
      if (pollingResult.drops.length === 0) {
        setPollingState((prev) => ({ ...prev, hasNewDrops: false }));
        return;
      }

      const latestPolledDrop = pollingResult.drops[0];
      const latestExistingDrop = drops.at(-1);

      if (!latestExistingDrop) {
        setPollingState({
          hasNewDrops: true,
          lastPolledData: pollingResult,
          lastError: undefined,
        });
        return;
      }

      const polledCreatedAt = new Date(latestPolledDrop.created_at).getTime();
      const existingCreatedAt = new Date(
        latestExistingDrop.created_at
      ).getTime();

      setPollingState({
        hasNewDrops: polledCreatedAt > existingCreatedAt,
        lastPolledData: pollingResult,
        lastError: undefined,
      });
    }, pollingDelay);

    return () => clearTimeout(timeoutId);
  }, [pollingResult, drops, pollingDelay]);

  useEffect(() => {
    if (!pollingState.hasNewDrops || !isTabVisible) return;

    const hasTempDrop = drops.some((drop) => drop.id.startsWith("temp-"));
    if (hasTempDrop) return;

    onNewDrops();
    setPollingState((prev) => ({
      ...prev,
      hasNewDrops: false,
      lastError: undefined,
    }));
  }, [pollingState.hasNewDrops, isTabVisible, drops, onNewDrops]);

  return {
    hasNewDrops: pollingState.hasNewDrops,
    isPolling: !error && !pollingState.hasNewDrops,
    error: error || pollingState.lastError,
    lastPolledData: pollingState.lastPolledData,
  };
}
