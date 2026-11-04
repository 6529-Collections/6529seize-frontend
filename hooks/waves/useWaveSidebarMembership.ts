"use client";

import {
  skipToken,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useWaveDiscoveryViewer } from "@/hooks/useWaveDiscoveryViewer";

const EMPTY_WAVE_IDS: readonly string[] = [];

const membershipKey = (viewerIdentityKey: string | null) =>
  [QueryKey.WAVE_SIDEBAR_MEMBERSHIP, viewerIdentityKey] as const;

/** Successful leaves override the active-route fallback until the viewer rejoins. */
export function recordWaveSidebarMembership({
  queryClient,
  viewerIdentityKey,
  waveId,
  following,
}: {
  readonly queryClient: QueryClient;
  readonly viewerIdentityKey: string | null;
  readonly waveId: string;
  readonly following: boolean;
}) {
  if (!viewerIdentityKey) return;
  queryClient.setQueryData<readonly string[]>(
    membershipKey(viewerIdentityKey),
    (previous = EMPTY_WAVE_IDS) => {
      const remaining = previous.filter((id) => id !== waveId);
      return following ? remaining : [...remaining, waveId];
    }
  );
}

export function useWaveSidebarMembership(viewerIdentityKey: string | null) {
  const { data } = useQuery<readonly string[]>({
    queryKey: membershipKey(viewerIdentityKey),
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
