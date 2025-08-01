"use client";

import { useCallback, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../components/auth/Auth";
import { pinnedWavesApi } from "../services/api/pinned-waves-api";
import { ApiWave } from "../generated/models/ApiWave";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

export const MAX_PINNED_WAVES = 10;

export interface UsePinnedWavesServerReturn {
  pinnedWaves: ApiWave[];
  pinnedIds: string[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  pinWave: (waveId: string) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
  refetch: () => void;
}

export function usePinnedWavesServer(): UsePinnedWavesServerReturn {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const queryClient = useQueryClient();
  
  // Only fetch if user is authenticated
  const isAuthenticated = !!connectedProfile?.handle && !activeProfileProxy;
  
  // Fetch pinned waves
  const {
    data: pinnedWaves = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW, { pinned: 'PINNED' }],
    queryFn: pinnedWavesApi.fetchPinnedWaves,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Derive pinned IDs from pinned waves
  const pinnedIds = pinnedWaves.map(wave => wave.id);

  // Pin wave mutation
  const pinMutation = useMutation({
    mutationFn: pinnedWavesApi.pinWave,
    onMutate: async (waveId: string) => {
      // Optimistic update - we'll refetch after success instead of complex optimistic updates
      await queryClient.cancelQueries({ 
        queryKey: [QueryKey.WAVES_OVERVIEW] 
      });
    },
    onSuccess: () => {
      // Invalidate and refetch both pinned waves and main waves list
      queryClient.invalidateQueries({ 
        queryKey: [QueryKey.WAVES_OVERVIEW] 
      });
    },
    onError: (error) => {
      console.error('Error pinning wave:', error);
    },
  });

  // Unpin wave mutation
  const unpinMutation = useMutation({
    mutationFn: pinnedWavesApi.unpinWave,
    onMutate: async (waveId: string) => {
      // Optimistic update - remove from pinned waves immediately
      await queryClient.cancelQueries({ 
        queryKey: [QueryKey.WAVES_OVERVIEW, { pinned: 'PINNED' }] 
      });
      
      const previousPinnedWaves = queryClient.getQueryData<ApiWave[]>([
        QueryKey.WAVES_OVERVIEW, 
        { pinned: 'PINNED' }
      ]);

      if (previousPinnedWaves) {
        queryClient.setQueryData(
          [QueryKey.WAVES_OVERVIEW, { pinned: 'PINNED' }],
          previousPinnedWaves.filter(wave => wave.id !== waveId)
        );
      }

      return { previousPinnedWaves };
    },
    onError: (err, waveId, context) => {
      // Revert optimistic update
      if (context?.previousPinnedWaves) {
        queryClient.setQueryData(
          [QueryKey.WAVES_OVERVIEW, { pinned: 'PINNED' }],
          context.previousPinnedWaves
        );
      }
      console.error('Error unpinning wave:', err);
    },
    onSuccess: () => {
      // Invalidate and refetch main waves list to update isPinned status
      queryClient.invalidateQueries({ 
        queryKey: [QueryKey.WAVES_OVERVIEW] 
      });
    },
  });

  const pinWave = useCallback(async (waveId: string) => {
    if (pinnedIds.length >= MAX_PINNED_WAVES && !pinnedIds.includes(waveId)) {
      throw new Error(`Maximum ${MAX_PINNED_WAVES} pinned waves allowed`);
    }
    await pinMutation.mutateAsync(waveId);
  }, [pinnedIds, pinMutation]);

  const unpinWave = useCallback(async (waveId: string) => {
    await unpinMutation.mutateAsync(waveId);
  }, [unpinMutation]);

  return {
    pinnedWaves,
    pinnedIds,
    isLoading,
    isError: isError || pinMutation.isError || unpinMutation.isError,
    error: error || pinMutation.error || unpinMutation.error,
    pinWave,
    unpinWave,
    refetch,
  };
}