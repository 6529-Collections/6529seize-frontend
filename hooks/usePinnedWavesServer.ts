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
import { refetchQueryIfStale } from "@/components/react-query-wrapper/utils/refetchQueryIfStale";
import {
  mapApiWaveOverviewToSidebarWave,
  getWavesV2OverviewQueryKeyParams,
  type WavesV2OverviewQueryKeyParams,
} from "@/services/api/waves-v2-api";
import type { SidebarWave, SidebarWavesPage } from "@/types/waves.types";
import { useOfficialWaves } from "./useOfficialWaves";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import { getRole } from "@/services/auth/jwt-validation.utils";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const MAX_PINNED_WAVES = 100;

// Cache time constants for React Query
const PINNED_WAVES_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const PINNED_WAVES_GC_TIME = 10 * 60 * 1000; // 10 minutes
const PINNED_WAVES_REFETCH_INTERVAL = 2 * 60 * 1000; // 2 minutes
const PINNED_WAVES_QUERY_LIMIT = MAX_PINNED_WAVES;

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
  reorderPinnedWaves: (
    previousIds: readonly string[],
    nextIds: readonly string[]
  ) => Promise<void>;
  isSavingPinnedWaveOrder: boolean;
  refetch: () => Promise<QueryObserverResult<SidebarWave[], Error>>;
  refetchIfStale: () => void;
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

function usePinnedWavesQuery(
  queryClient: QueryClient,
  queryKey: PinnedWavesQueryKey,
  enabled: boolean,
  shouldClearCache: boolean
) {
  const query = useQuery<SidebarWave[], Error>({
    queryKey,
    queryFn: async ({ signal }) =>
      (await pinnedWavesApi.getPinnedWaves(signal)).map((wave) => ({
        ...mapApiWaveOverviewToSidebarWave(wave),
        pinned: true,
      })),
    enabled,
    staleTime: PINNED_WAVES_STALE_TIME,
    gcTime: PINNED_WAVES_GC_TIME,
    refetchInterval: PINNED_WAVES_REFETCH_INTERVAL,
    refetchOnWindowFocus: "always",
  });

  useEffect(() => {
    if (shouldClearCache) {
      queryClient.setQueryData(queryKey, []);
    }
  }, [queryClient, queryKey, shouldClearCache]);

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

  return [...previousPinnedWaves, { ...waveToPin, pinned: true }];
}

async function optimisticallyPinWave(
  queryClient: QueryClient,
  queryKey: PinnedWavesQueryKey,
  waveId: string,
  viewerIdentityKey: string | null,
  primaryProfileId: string | null
): Promise<MutationContext> {
  await queryClient.cancelQueries({ queryKey });
  assertCurrentPinViewer(viewerIdentityKey, primaryProfileId);

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
  waveId: string,
  viewerIdentityKey: string | null,
  primaryProfileId: string | null
): Promise<MutationContext> {
  await queryClient.cancelQueries({ queryKey });
  assertCurrentPinViewer(viewerIdentityKey, primaryProfileId);

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

function isCurrentPinViewer(
  viewerIdentityKey: string | null,
  primaryProfileId: string | null
): boolean {
  const address = getWalletAddress();
  const jwt = getAuthJwt();
  if (
    !address ||
    !jwt ||
    viewerIdentityKey !== `${address.toLowerCase()}:primary`
  ) {
    return false;
  }
  try {
    // Normal logins carry the owner's profile ID as role; other IDs are proxies.
    // Older tokens may omit role. Saved role metadata can be stale.
    const role = getRole(jwt);
    return !role || role === primaryProfileId;
  } catch {
    return false;
  }
}

function assertCurrentPinViewer(
  viewerIdentityKey: string | null,
  primaryProfileId: string | null
): void {
  if (!isCurrentPinViewer(viewerIdentityKey, primaryProfileId)) {
    throw new Error(
      t(DEFAULT_LOCALE, "waves.sidebar.pinControl.viewerChanged")
    );
  }
}

function usePinnedWaveMutations(
  queryClient: QueryClient,
  pinnedWavesQueryKey: PinnedWavesQueryKey,
  viewerIdentityKey: string | null,
  primaryProfileId: string | null
) {
  const invalidateWavesQueries = useInvalidateWavesQueries(
    queryClient,
    pinnedWavesQueryKey,
    viewerIdentityKey
  );

  const pinMutation = useMutation<void, Error, string, MutationContext>({
    mutationFn: (waveId) => {
      assertCurrentPinViewer(viewerIdentityKey, primaryProfileId);
      return pinnedWavesApi.pinWave(waveId);
    },
    onMutate: (waveId: string) =>
      optimisticallyPinWave(
        queryClient,
        pinnedWavesQueryKey,
        waveId,
        viewerIdentityKey,
        primaryProfileId
      ),
    onError: (err, _, context) => {
      restorePinnedWaves(queryClient, pinnedWavesQueryKey, context);
      console.error("Error pinning wave:", err);
    },
    onSuccess: invalidateWavesQueries,
  });

  const unpinMutation = useMutation<void, Error, string, MutationContext>({
    mutationFn: (waveId) => {
      assertCurrentPinViewer(viewerIdentityKey, primaryProfileId);
      return pinnedWavesApi.unpinWave(waveId);
    },
    onMutate: (waveId: string) =>
      optimisticallyUnpinWave(
        queryClient,
        pinnedWavesQueryKey,
        waveId,
        viewerIdentityKey,
        primaryProfileId
      ),
    onError: (err, _, context) => {
      restorePinnedWaves(queryClient, pinnedWavesQueryKey, context);
      console.error("Error unpinning wave:", err);
    },
    onSuccess: invalidateWavesQueries,
  });

  return { pinMutation, unpinMutation };
}

function reorderCachedPins(
  waves: SidebarWave[],
  { from, to }: { from: readonly string[]; to: readonly string[] }
): SidebarWave[] {
  const byId = new Map(waves.map((wave) => [wave.id, wave]));
  const affected = new Set(from);
  const replacements = to.flatMap((id) => {
    const wave = byId.get(id);
    return wave ? [wave] : [];
  });
  let index = 0;
  return waves.map((wave) =>
    affected.has(wave.id) ? (replacements[index++] ?? wave) : wave
  );
}

interface UsePinnedWavesServerOptions {
  readonly enabled?: boolean | undefined;
}

export function usePinnedWavesServer(
  options: UsePinnedWavesServerOptions = {}
): UsePinnedWavesServerReturn {
  const {
    connectedProfile,
    activeProfileProxy,
    fetchingProfile,
    isAuthenticated,
    requestAuth,
  } = useAuth();
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const queryClient = useQueryClient();
  const ongoingOperations = useRef<Set<string>>(new Set());
  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasAuthContextProfile =
    isAuthenticated ??
    (!!connectedProfile?.handle && hasValidWalletAuthorization);
  const hasAuthenticatedProfile =
    !!connectedProfile?.handle && !activeProfileProxy && hasAuthContextProfile;
  const activeProfileProxyId = activeProfileProxy?.id ?? null;
  const primaryProfileId = connectedProfile?.id ?? null;
  const isPendingAuthSwitch = Boolean(
    address && (!hasValidWalletAuthorization || fetchingProfile)
  );
  const isEnabled = options.enabled !== false;
  const viewerIdentityKey = useMemo(() => {
    if (!address || !hasValidWalletAuthorization || isPendingAuthSwitch) {
      return null;
    }

    const normalizedAddress = address.toLowerCase();
    if (activeProfileProxyId !== null) {
      return `${normalizedAddress}:proxy:${activeProfileProxyId}`;
    }

    return `${normalizedAddress}:primary`;
  }, [
    address,
    activeProfileProxyId,
    hasValidWalletAuthorization,
    isPendingAuthSwitch,
  ]);
  const pinnedWavesQueryKey = usePinnedWavesQueryKey(viewerIdentityKey);
  const { waves: officialWaves } = useOfficialWaves({
    viewerIdentityKey,
    enabled: isEnabled && !isPendingAuthSwitch,
  });
  const officialWaveIds = useMemo(
    () => new Set(officialWaves.map((wave) => wave.id)),
    [officialWaves]
  );
  const { data, isLoading, isError, error, refetch } = usePinnedWavesQuery(
    queryClient,
    pinnedWavesQueryKey,
    isEnabled && hasAuthenticatedProfile && !isPendingAuthSwitch,
    !hasAuthenticatedProfile || isPendingAuthSwitch
  );
  const pinnedWaves = useMemo(
    () => data?.filter((wave) => wave.pinned === true) ?? [],
    [data]
  );
  const refetchIfStale = useCallback(() => {
    refetchQueryIfStale(queryClient, pinnedWavesQueryKey);
  }, [queryClient, pinnedWavesQueryKey]);
  const { pinnedIds, canPinWave } = usePinnedWavesBudget(
    pinnedWaves,
    ongoingOperations,
    officialWaveIds
  );
  const { pinMutation, unpinMutation } = usePinnedWaveMutations(
    queryClient,
    pinnedWavesQueryKey,
    viewerIdentityKey,
    primaryProfileId
  );

  const { mutateAsync: saveOrder, isPending: isSavingPinnedWaveOrder } =
    useMutation({
      mutationFn: async ({
        previousIds,
        nextIds,
      }: {
        previousIds: readonly string[];
        nextIds: readonly string[];
      }) => {
        const { success } = await requestAuth();
        if (!success) throw new Error("Could not authenticate");
        assertCurrentPinViewer(viewerIdentityKey, primaryProfileId);
        await queryClient.cancelQueries({ queryKey: pinnedWavesQueryKey });
        assertCurrentPinViewer(viewerIdentityKey, primaryProfileId);
        const cached =
          queryClient.getQueryData<SidebarWave[]>(pinnedWavesQueryKey) ?? [];
        const previous = new Set(previousIds);
        const currentVisible = cached.filter((wave) => previous.has(wave.id));
        if (
          currentVisible.length !== previousIds.length ||
          currentVisible.some((wave, index) => wave.id !== previousIds[index])
        ) {
          throw new Error("Pinned wave order changed");
        }
        if (
          nextIds.length !== previous.size ||
          new Set(nextIds).size !== previous.size ||
          nextIds.some((id) => !previous.has(id))
        ) {
          throw new Error("Invalid pinned wave order");
        }
        const reordered = reorderCachedPins(cached, {
          from: previousIds,
          to: nextIds,
        });
        queryClient.setQueryData(pinnedWavesQueryKey, reordered);
        try {
          await pinnedWavesApi.updateOrder({
            previous_wave_ids: cached.map((wave) => wave.id),
            wave_ids: reordered.map((wave) => wave.id),
          });
        } catch (saveError) {
          queryClient.setQueryData<SidebarWave[]>(
            pinnedWavesQueryKey,
            (current) => {
              if (!current) return current;
              const currentIds = new Set(current.map((wave) => wave.id));
              const expected = nextIds.filter((id) => currentIds.has(id));
              const currentOrder = current.filter((wave) =>
                previous.has(wave.id)
              );
              if (
                currentOrder.some((wave, index) => wave.id !== expected[index])
              ) {
                return current;
              }
              return reorderCachedPins(current, {
                from: nextIds,
                to: previousIds,
              });
            }
          );
          throw saveError;
        }
      },
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: pinnedWavesQueryKey }),
    });

  const reorderPinnedWaves = useCallback(
    async (previousIds: readonly string[], nextIds: readonly string[]) => {
      await saveOrder({ previousIds, nextIds });
    },
    [saveOrder]
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
        const { success } = await requestAuth();
        if (!success) {
          return;
        }
        assertCurrentPinViewer(viewerIdentityKey, primaryProfileId);
        await pinMutation.mutateAsync(waveId);
      } finally {
        ongoingOperations.current.delete(waveId);
      }
    },
    [canPinWave, pinMutation, requestAuth, viewerIdentityKey, primaryProfileId]
  );

  const unpinWave = useCallback(
    async (waveId: string) => {
      if (ongoingOperations.current.has(waveId)) {
        throw new Error("Operation already in progress for this wave");
      }

      ongoingOperations.current.add(waveId);

      try {
        const { success } = await requestAuth();
        if (!success) {
          return;
        }
        assertCurrentPinViewer(viewerIdentityKey, primaryProfileId);
        await unpinMutation.mutateAsync(waveId);
      } finally {
        ongoingOperations.current.delete(waveId);
      }
    },
    [unpinMutation, requestAuth, viewerIdentityKey, primaryProfileId]
  );

  return {
    pinnedWaves,
    pinnedIds,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? isError : false,
    error: isEnabled
      ? (error ?? pinMutation.error ?? unpinMutation.error)
      : null,
    pinWave,
    unpinWave,
    reorderPinnedWaves,
    isSavingPinnedWaveOrder,
    refetch,
    refetchIfStale,
    isOperationInProgress: (waveId: string) =>
      ongoingOperations.current.has(waveId),
    canPinWave,
  };
}
