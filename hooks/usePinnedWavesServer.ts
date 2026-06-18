"use client";

import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import {
  type InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryObserverResult,
} from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { pinnedWavesApi } from "@/services/api/pinned-waves-api";
import { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  fetchWavesV2Page,
  getWavesV2OverviewQueryKeyParams,
  type WavesV2OverviewQueryKeyParams,
} from "@/services/api/waves-v2-api";
import type { SidebarWave, SidebarWavesPage } from "@/types/waves.types";
import { useOfficialWaves } from "./useOfficialWaves";

export const MAX_PINNED_WAVES = 100;

// Cache time constants for React Query
const PINNED_WAVES_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const PINNED_WAVES_GC_TIME = 10 * 60 * 1000; // 10 minutes
const PINNED_WAVES_REFETCH_INTERVAL = 2 * 60 * 1000; // 2 minutes
const PINNED_WAVES_QUERY_LIMIT = MAX_PINNED_WAVES;
const PINNED_WAVES_API_PAGE_SIZE = 20;

type PinnedWavesQueryKey = readonly [
  QueryKey.WAVES_V2,
  WavesV2OverviewQueryKeyParams,
];

interface MutationContext {
  previousPinnedWaves: SidebarWave[] | undefined;
}

interface UsePinnedWavesServerReturn {
  pinnedWaves: SidebarWave[];
  pinnedIds: string[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  pinWave: (waveId: string) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
  refetch: () => Promise<QueryObserverResult<SidebarWave[], Error>>;
  isOperationInProgress: (waveId: string) => boolean;
  canPinWave: (waveId: string) => boolean;
}

function createPinnedWavesQueryKey(
  viewerIdentityKey: string | null
): PinnedWavesQueryKey {
  return [
    QueryKey.WAVES_V2,
    getWavesV2OverviewQueryKeyParams({
      overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
      pageSize: PINNED_WAVES_QUERY_LIMIT,
      pinned: ApiWavesPinFilter.Pinned,
      viewerIdentityKey,
    }),
  ] as const;
}

function usePinnedWavesQueryKey(
  viewerIdentityKey: string | null
): PinnedWavesQueryKey {
  return useMemo(
    () => createPinnedWavesQueryKey(viewerIdentityKey),
    [viewerIdentityKey]
  );
}

async function fetchPinnedWavesPages(): Promise<SidebarWave[]> {
  const pinnedWaves: SidebarWave[] = [];
  let pageNumber = 1;

  while (pinnedWaves.length < MAX_PINNED_WAVES) {
    const page = await fetchWavesV2Page({
      page: pageNumber,
      pageSize: PINNED_WAVES_API_PAGE_SIZE,
      overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
      pinned: ApiWavesPinFilter.Pinned,
    });

    pinnedWaves.push(...page.waves);

    if (!page.next || page.waves.length === 0) {
      break;
    }

    pageNumber += 1;
  }

  return pinnedWaves.slice(0, MAX_PINNED_WAVES);
}

function usePinnedWavesQuery(
  queryClient: QueryClient,
  queryKey: PinnedWavesQueryKey,
  isAuthenticated: boolean
) {
  const query = useQuery<SidebarWave[], Error>({
    queryKey,
    queryFn: fetchPinnedWavesPages,
    enabled: isAuthenticated,
    staleTime: PINNED_WAVES_STALE_TIME,
    gcTime: PINNED_WAVES_GC_TIME,
    refetchInterval: PINNED_WAVES_REFETCH_INTERVAL,
    refetchOnWindowFocus: "always",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.setQueryData(queryKey, []);
    }
  }, [isAuthenticated, queryClient, queryKey]);

  return query;
}

function usePinnedWavesBudget(
  pinnedWaves: SidebarWave[],
  ongoingOperations: RefObject<Set<string>>,
  officialWaveIds: ReadonlySet<string>
) {
  const seizeSettings = useSeizeSettingsOptional();
  const pinnedIds = useMemo(
    () => pinnedWaves.map((wave) => wave.id),
    [pinnedWaves]
  );
  const countsTowardPinBudget = useCallback(
    (waveId: string) =>
      !seizeSettings?.isAnnouncementsWave(waveId) &&
      !officialWaveIds.has(waveId),
    [seizeSettings, officialWaveIds]
  );
  const pinnedBudgetCount = useMemo(
    () => pinnedIds.filter(countsTowardPinBudget).length,
    [pinnedIds, countsTowardPinBudget]
  );
  const getOngoingPinCount = useCallback(
    (waveId: string) => {
      let ongoingPinCount = 0;

      ongoingOperations.current.forEach((id) => {
        if (id === waveId || pinnedIds.includes(id)) {
          return;
        }

        if (countsTowardPinBudget(id)) {
          ongoingPinCount++;
        }
      });

      return ongoingPinCount;
    },
    [ongoingOperations, pinnedIds, countsTowardPinBudget]
  );
  const canPinWave = useCallback(
    (waveId: string) => {
      if (pinnedIds.includes(waveId)) {
        return true;
      }

      return pinnedBudgetCount + getOngoingPinCount(waveId) < MAX_PINNED_WAVES;
    },
    [pinnedIds, pinnedBudgetCount, getOngoingPinCount]
  );

  return { pinnedIds, canPinWave };
}

function isMainWavesQueryForViewer(
  queryKey: readonly unknown[],
  viewerIdentityKey: string | null
): boolean {
  const [key, params] = queryKey;
  if (
    key !== QueryKey.WAVES_V2 ||
    typeof params !== "object" ||
    params === null
  ) {
    return false;
  }

  const queryParams = params as {
    readonly pinned?: unknown;
    readonly viewer_identity?: unknown;
  };

  if (Boolean(queryParams.pinned)) {
    return false;
  }

  const viewerIdentityParam = queryParams.viewer_identity;
  const queryViewerIdentity =
    typeof viewerIdentityParam === "string" ? viewerIdentityParam : null;
  return queryViewerIdentity === viewerIdentityKey;
}

function useInvalidateWavesQueries(
  queryClient: QueryClient,
  pinnedWavesQueryKey: PinnedWavesQueryKey,
  viewerIdentityKey: string | null
) {
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: pinnedWavesQueryKey,
    });
    void queryClient.invalidateQueries({
      queryKey: [QueryKey.OFFICIAL_WAVES],
    });
    void queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES_V2],
      predicate: (query) =>
        isMainWavesQueryForViewer(query.queryKey, viewerIdentityKey),
    });
    void queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES_OVERVIEW],
    });
  }, [queryClient, pinnedWavesQueryKey, viewerIdentityKey]);
}

function findWaveInQueryData(
  data: SidebarWave[] | InfiniteData<SidebarWavesPage> | undefined,
  waveId: string
): SidebarWave | undefined {
  if (!data) {
    return undefined;
  }

  if (Array.isArray(data)) {
    return data.find((wave): wave is SidebarWave => wave.id === waveId);
  }

  for (const page of data.pages) {
    const wave = page.waves.find(
      (item): item is SidebarWave => item.id === waveId
    );
    if (wave) {
      return wave;
    }
  }

  return undefined;
}

function findWaveForOptimisticPin(
  queryClient: QueryClient,
  waveId: string
): SidebarWave | undefined {
  const wavesQueries = queryClient.getQueriesData<
    SidebarWave[] | InfiniteData<SidebarWavesPage>
  >({
    queryKey: [QueryKey.WAVES_V2],
  });

  for (const [, data] of wavesQueries) {
    const wave = findWaveInQueryData(data, waveId);
    if (wave) {
      return wave;
    }
  }

  return undefined;
}

function createOptimisticPinnedWaves(
  previousPinnedWaves: SidebarWave[] | undefined,
  waveToPin: SidebarWave | undefined,
  waveId: string
): SidebarWave[] | undefined {
  if (!waveToPin || !previousPinnedWaves) {
    return undefined;
  }

  const isAlreadyPinned = previousPinnedWaves.some(
    (wave) => wave.id === waveId
  );
  if (isAlreadyPinned) {
    return undefined;
  }

  return [{ ...waveToPin, pinned: true }, ...previousPinnedWaves];
}

async function optimisticallyPinWave(
  queryClient: QueryClient,
  queryKey: PinnedWavesQueryKey,
  waveId: string
): Promise<MutationContext> {
  await queryClient.cancelQueries({ queryKey });

  const previousPinnedWaves = queryClient.getQueryData<SidebarWave[]>(queryKey);
  const waveToPin = findWaveForOptimisticPin(queryClient, waveId);
  const optimisticPinnedWaves = createOptimisticPinnedWaves(
    previousPinnedWaves,
    waveToPin,
    waveId
  );

  if (optimisticPinnedWaves) {
    queryClient.setQueryData(queryKey, optimisticPinnedWaves);
  }

  return { previousPinnedWaves };
}

async function optimisticallyUnpinWave(
  queryClient: QueryClient,
  queryKey: PinnedWavesQueryKey,
  waveId: string
): Promise<MutationContext> {
  await queryClient.cancelQueries({ queryKey });

  const previousPinnedWaves = queryClient.getQueryData<SidebarWave[]>(queryKey);

  if (previousPinnedWaves) {
    queryClient.setQueryData(
      queryKey,
      previousPinnedWaves.filter((wave) => wave.id !== waveId)
    );
  }

  return { previousPinnedWaves };
}

function restorePinnedWaves(
  queryClient: QueryClient,
  queryKey: PinnedWavesQueryKey,
  context: MutationContext | undefined
) {
  if (context?.previousPinnedWaves) {
    queryClient.setQueryData(queryKey, context.previousPinnedWaves);
  }
}

function usePinnedWaveMutations(
  queryClient: QueryClient,
  pinnedWavesQueryKey: PinnedWavesQueryKey,
  viewerIdentityKey: string | null
) {
  const invalidateWavesQueries = useInvalidateWavesQueries(
    queryClient,
    pinnedWavesQueryKey,
    viewerIdentityKey
  );

  const pinMutation = useMutation<void, Error, string, MutationContext>({
    mutationFn: pinnedWavesApi.pinWave,
    onMutate: (waveId: string) =>
      optimisticallyPinWave(queryClient, pinnedWavesQueryKey, waveId),
    onError: (err, _, context) => {
      restorePinnedWaves(queryClient, pinnedWavesQueryKey, context);
      console.error("Error pinning wave:", err);
    },
    onSuccess: invalidateWavesQueries,
  });

  const unpinMutation = useMutation<void, Error, string, MutationContext>({
    mutationFn: pinnedWavesApi.unpinWave,
    onMutate: (waveId: string) =>
      optimisticallyUnpinWave(queryClient, pinnedWavesQueryKey, waveId),
    onError: (err, _, context) => {
      restorePinnedWaves(queryClient, pinnedWavesQueryKey, context);
      console.error("Error unpinning wave:", err);
    },
    onSuccess: invalidateWavesQueries,
  });

  return { pinMutation, unpinMutation };
}

export function usePinnedWavesServer(): UsePinnedWavesServerReturn {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  const queryClient = useQueryClient();
  const ongoingOperations = useRef<Set<string>>(new Set());
  const isAuthenticated = !!connectedProfile?.handle && !activeProfileProxy;
  const activeProfileProxyId = activeProfileProxy?.id ?? null;
  const viewerIdentityKey = useMemo(() => {
    if (!address) {
      return null;
    }

    const normalizedAddress = address.toLowerCase();
    if (activeProfileProxyId !== null) {
      return `${normalizedAddress}:proxy:${activeProfileProxyId}`;
    }

    return `${normalizedAddress}:primary`;
  }, [address, activeProfileProxyId]);
  const pinnedWavesQueryKey = usePinnedWavesQueryKey(viewerIdentityKey);
  const { waves: officialWaves } = useOfficialWaves({ viewerIdentityKey });
  const officialWaveIds = useMemo(
    () => new Set(officialWaves.map((wave) => wave.id)),
    [officialWaves]
  );
  const { data, isLoading, isError, error, refetch } = usePinnedWavesQuery(
    queryClient,
    pinnedWavesQueryKey,
    isAuthenticated
  );
  const pinnedWaves = data ?? [];
  const { pinnedIds, canPinWave } = usePinnedWavesBudget(
    pinnedWaves,
    ongoingOperations,
    officialWaveIds
  );
  const { pinMutation, unpinMutation } = usePinnedWaveMutations(
    queryClient,
    pinnedWavesQueryKey,
    viewerIdentityKey
  );

  const pinWave = useCallback(
    async (waveId: string) => {
      if (ongoingOperations.current.has(waveId)) {
        throw new Error("Operation already in progress for this wave");
      }

      if (!canPinWave(waveId)) {
        throw new Error(`Maximum ${MAX_PINNED_WAVES} pinned waves allowed`);
      }

      ongoingOperations.current.add(waveId);

      try {
        await pinMutation.mutateAsync(waveId);
      } finally {
        ongoingOperations.current.delete(waveId);
      }
    },
    [canPinWave, pinMutation]
  );

  const unpinWave = useCallback(
    async (waveId: string) => {
      if (ongoingOperations.current.has(waveId)) {
        throw new Error("Operation already in progress for this wave");
      }

      ongoingOperations.current.add(waveId);

      try {
        await unpinMutation.mutateAsync(waveId);
      } finally {
        ongoingOperations.current.delete(waveId);
      }
    },
    [unpinMutation]
  );

  return {
    pinnedWaves,
    pinnedIds,
    isLoading,
    isError,
    error: error ?? pinMutation.error ?? unpinMutation.error,
    pinWave,
    unpinWave,
    refetch,
    isOperationInProgress: (waveId: string) =>
      ongoingOperations.current.has(waveId),
    canPinWave,
  };
}
