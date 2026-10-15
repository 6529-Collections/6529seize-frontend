"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { refetchQueryIfStale } from "@/components/react-query-wrapper/utils/refetchQueryIfStale";
import { getWaveQueryKey } from "@/services/api/wave-query";
import { getWaveSubwavesQueryKey } from "./useWaveSubwaves";

interface WavesListSource {
  readonly refetch: () => unknown;
  readonly refetchIfStale: () => void;
}

interface UseWavesListRefetchOptions {
  readonly shouldLoadMainWaves: boolean;
  readonly isJoinedMode: boolean;
  readonly highlyRated: WavesListSource;
  readonly allActivity: WavesListSource;
  readonly followedActivity: WavesListSource;
  readonly pinned: WavesListSource;
  readonly refetchSubwaves: () => void;
  readonly loadedSubwaveParentIds: readonly string[];
  readonly viewerIdentityKey: string | null;
  /** Set only while the announcement wave is fetched outside the lists. */
  readonly announcementWaveId: string | null;
  readonly refetchAnnouncementWave: () => unknown;
}

/**
 * Refresh actions for the main sidebar sources. `refetchAllWaves` forces every
 * source. `refreshStaleWaves` is the resync variant for reconnects and tab
 * resumes: only sources past their staleTime refetch, and in-flight requests
 * are reused rather than restarted.
 */
export function useWavesListRefetch({
  shouldLoadMainWaves,
  isJoinedMode,
  highlyRated,
  allActivity,
  followedActivity,
  pinned,
  refetchSubwaves,
  loadedSubwaveParentIds,
  viewerIdentityKey,
  announcementWaveId,
  refetchAnnouncementWave,
}: UseWavesListRefetchOptions) {
  const queryClient = useQueryClient();
  const {
    refetch: refetchHighlyRated,
    refetchIfStale: refetchHighlyRatedIfStale,
  } = highlyRated;
  const {
    refetch: refetchAllActivity,
    refetchIfStale: refetchAllActivityIfStale,
  } = allActivity;
  const {
    refetch: refetchFollowedActivity,
    refetchIfStale: refetchFollowedActivityIfStale,
  } = followedActivity;
  const { refetch: refetchPinned, refetchIfStale: refetchPinnedIfStale } =
    pinned;

  const refetchAllWaves = useCallback(() => {
    if (!shouldLoadMainWaves) {
      return;
    }

    if (isJoinedMode) {
      refetchFollowedActivity();
    } else {
      refetchAllActivity();
    }
    refetchHighlyRated();
    void refetchPinned();
    refetchSubwaves();
    if (announcementWaveId) {
      void refetchAnnouncementWave();
    }
  }, [
    announcementWaveId,
    isJoinedMode,
    refetchAllActivity,
    refetchAnnouncementWave,
    refetchFollowedActivity,
    refetchHighlyRated,
    refetchPinned,
    refetchSubwaves,
    shouldLoadMainWaves,
  ]);

  const refreshStaleWaves = useCallback(() => {
    if (!shouldLoadMainWaves) {
      return;
    }

    if (isJoinedMode) {
      refetchFollowedActivityIfStale();
    } else {
      refetchAllActivityIfStale();
    }
    refetchHighlyRatedIfStale();
    refetchPinnedIfStale();
    loadedSubwaveParentIds.forEach((parentWaveId) => {
      refetchQueryIfStale(
        queryClient,
        getWaveSubwavesQueryKey(parentWaveId, viewerIdentityKey)
      );
    });
    if (announcementWaveId) {
      refetchQueryIfStale(queryClient, getWaveQueryKey(announcementWaveId));
    }
  }, [
    announcementWaveId,
    isJoinedMode,
    loadedSubwaveParentIds,
    queryClient,
    refetchAllActivityIfStale,
    refetchFollowedActivityIfStale,
    refetchHighlyRatedIfStale,
    refetchPinnedIfStale,
    shouldLoadMainWaves,
    viewerIdentityKey,
  ]);

  return { refetchAllWaves, refreshStaleWaves };
}
