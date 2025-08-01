"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../components/auth/Auth";
import { pinnedWavesApi } from "../services/api/pinned-waves-api";
import { ApiWave } from "../generated/models/ApiWave";
import { ApiWavesPinFilter } from "../generated/models/ApiWavesPinFilter";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

export const MAX_PINNED_WAVES = 10;

// Cache time constants for React Query
const PINNED_WAVES_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const PINNED_WAVES_GC_TIME = 10 * 60 * 1000; // 10 minutes

export interface UsePinnedWavesServerReturn {
  pinnedWaves: ApiWave[];
  pinnedIds: string[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  pinWave: (waveId: string) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
  refetch: () => void;
  isOperationInProgress: (waveId: string) => boolean;
}

export function usePinnedWavesServer(): UsePinnedWavesServerReturn {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const queryClient = useQueryClient();
  
  // Track ongoing operations to prevent concurrent pins
  const [ongoingOperations, setOngoingOperations] = useState<Set<string>>(new Set());
  
  // Only fetch if user is authenticated
  const isAuthenticated = !!connectedProfile?.handle && !activeProfileProxy;
  
  // Define the specific query key as a constant
  const PINNED_WAVES_QUERY_KEY = [QueryKey.WAVES_OVERVIEW, { pinned: ApiWavesPinFilter.Pinned }];
  
  // Fetch pinned waves
  const {
    data: pinnedWaves = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: PINNED_WAVES_QUERY_KEY,
    queryFn: pinnedWavesApi.fetchPinnedWaves,
    enabled: isAuthenticated,
    staleTime: PINNED_WAVES_STALE_TIME,
    gcTime: PINNED_WAVES_GC_TIME,
  });

  // Clear pinned waves data when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear pinned waves data immediately when user logs out
      queryClient.setQueryData(PINNED_WAVES_QUERY_KEY, []);
    }
  }, [isAuthenticated, queryClient, PINNED_WAVES_QUERY_KEY]);

  // Derive pinned IDs from pinned waves
  const pinnedIds = pinnedWaves.map(wave => wave.id);

  // Pin wave mutation
  const pinMutation = useMutation({
    mutationFn: pinnedWavesApi.pinWave,
    onMutate: async (waveId: string) => {
      // Cancel only the specific pinned waves query
      await queryClient.cancelQueries({ 
        queryKey: PINNED_WAVES_QUERY_KEY 
      });
      
      const previousPinnedWaves = queryClient.getQueryData<ApiWave[]>(PINNED_WAVES_QUERY_KEY);
      
      // We don't have the full wave object for optimistic update
      // So we'll rely on fast server response + invalidation
      return { previousPinnedWaves };
    },
    onError: (err, waveId, context) => {
      // Revert on error if we had previous data
      if (context?.previousPinnedWaves) {
        queryClient.setQueryData(PINNED_WAVES_QUERY_KEY, context.previousPinnedWaves);
      }
      console.error('Error pinning wave:', err);
    },
    onSuccess: () => {
      // Invalidate specific queries only
      queryClient.invalidateQueries({ 
        queryKey: PINNED_WAVES_QUERY_KEY 
      });
      // Also invalidate main waves to update isPinned status
      queryClient.invalidateQueries({ 
        queryKey: [QueryKey.WAVES_OVERVIEW],
        predicate: (query) => {
          // Only invalidate main waves queries, not pinned waves
          const [key, params] = query.queryKey;
          return key === QueryKey.WAVES_OVERVIEW && (!params || !(params as any)?.pinned);
        }
      });
    },
  });

  // Unpin wave mutation
  const unpinMutation = useMutation({
    mutationFn: pinnedWavesApi.unpinWave,
    onMutate: async (waveId: string) => {
      // Cancel only the specific pinned waves query
      await queryClient.cancelQueries({ 
        queryKey: PINNED_WAVES_QUERY_KEY 
      });
      
      const previousPinnedWaves = queryClient.getQueryData<ApiWave[]>(PINNED_WAVES_QUERY_KEY);

      // Optimistic update - remove from pinned waves immediately
      if (previousPinnedWaves) {
        queryClient.setQueryData(
          PINNED_WAVES_QUERY_KEY,
          previousPinnedWaves.filter(wave => wave.id !== waveId)
        );
      }

      return { previousPinnedWaves };
    },
    onError: (err, waveId, context) => {
      // Revert optimistic update
      if (context?.previousPinnedWaves) {
        queryClient.setQueryData(PINNED_WAVES_QUERY_KEY, context.previousPinnedWaves);
      }
      console.error('Error unpinning wave:', err);
    },
    onSuccess: () => {
      // Invalidate specific queries only
      queryClient.invalidateQueries({ 
        queryKey: PINNED_WAVES_QUERY_KEY 
      });
      // Also invalidate main waves to update isPinned status
      queryClient.invalidateQueries({ 
        queryKey: [QueryKey.WAVES_OVERVIEW],
        predicate: (query) => {
          // Only invalidate main waves queries, not pinned waves
          const [key, params] = query.queryKey;
          return key === QueryKey.WAVES_OVERVIEW && (!params || !(params as any)?.pinned);
        }
      });
    },
  });

  const pinWave = useCallback(async (waveId: string) => {
    // Prevent concurrent operations on same wave
    if (ongoingOperations.has(waveId)) {
      throw new Error('Operation already in progress for this wave');
    }
    
    // Check limit including ongoing pin operations
    let ongoingPinCount = 0;
    ongoingOperations.forEach(id => {
      if (!pinnedIds.includes(id)) {
        ongoingPinCount++;
      }
    });
    const totalPinnedCount = pinnedIds.length + ongoingPinCount;
    
    if (totalPinnedCount >= MAX_PINNED_WAVES) {
      throw new Error(`Maximum ${MAX_PINNED_WAVES} pinned waves allowed`);
    }
    
    // Mark operation as ongoing
    setOngoingOperations(prev => {
      const next = new Set(prev);
      next.add(waveId);
      return next;
    });
    
    try {
      await pinMutation.mutateAsync(waveId);
    } finally {
      // Always clean up the operation tracking
      setOngoingOperations(prev => {
        const next = new Set(prev);
        next.delete(waveId);
        return next;
      });
    }
  }, [pinnedIds, ongoingOperations, pinMutation]);

  const unpinWave = useCallback(async (waveId: string) => {
    // Prevent concurrent operations on same wave
    if (ongoingOperations.has(waveId)) {
      throw new Error('Operation already in progress for this wave');
    }
    
    setOngoingOperations(prev => {
      const next = new Set(prev);
      next.add(waveId);
      return next;
    });
    
    try {
      await unpinMutation.mutateAsync(waveId);
    } finally {
      setOngoingOperations(prev => {
        const next = new Set(prev);
        next.delete(waveId);
        return next;
      });
    }
  }, [ongoingOperations, unpinMutation]);

  return {
    pinnedWaves,
    pinnedIds,
    isLoading,
    isError: isError || pinMutation.isError || unpinMutation.isError,
    error: error || pinMutation.error || unpinMutation.error,
    pinWave,
    unpinWave,
    refetch,
    isOperationInProgress: (waveId: string) => ongoingOperations.has(waveId),
  };
}