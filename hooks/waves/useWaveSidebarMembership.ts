"use client";

import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWaveSidebarMembershipQueryKey,
  recordWaveSidebarMembership,
} from "@/helpers/waves/wave-sidebar-membership";
import { useWaveDiscoveryViewer } from "@/hooks/useWaveDiscoveryViewer";

const EMPTY_WAVE_IDS: readonly string[] = [];

export function useWaveSidebarMembership(viewerIdentityKey: string | null) {
  // QueryClientSetup creates an in-memory client per mounted app, with no
  // persister. Server prefetches never write this key. Infinity preserves the
  // override across sidebar remounts; a page reload starts with an empty client.
  const { data } = useQuery<readonly string[]>({
    queryKey: getWaveSidebarMembershipQueryKey(viewerIdentityKey),
    queryFn: skipToken,
    initialData: EMPTY_WAVE_IDS,
    gcTime: Infinity,
  });
  return data ?? EMPTY_WAVE_IDS;
}

export function useRecordWaveSidebarMembership() {
  const queryClient = useQueryClient();
  const { key: viewerIdentityKey } = useWaveDiscoveryViewer();
  return (waveId: string, following: boolean) =>
    recordWaveSidebarMembership({
      queryClient,
      viewerIdentityKey,
      waveId,
      following,
    });
}
