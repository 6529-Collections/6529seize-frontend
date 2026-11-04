import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";

export const getWaveSidebarMembershipQueryKey = (
  viewerIdentityKey: string | null
) => [QueryKey.WAVE_SIDEBAR_MEMBERSHIP, viewerIdentityKey] as const;

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
    getWaveSidebarMembershipQueryKey(viewerIdentityKey),
    (previous = []) => {
      const remaining = previous.filter((id) => id !== waveId);
      return following ? remaining : [...remaining, waveId];
    }
  );
}
