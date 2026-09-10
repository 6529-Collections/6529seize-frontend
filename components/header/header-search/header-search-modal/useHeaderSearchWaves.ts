import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import {
  getHasAuthenticatedProfile,
  getViewerIdentityKey,
} from "@/hooks/useWavesList.helpers";
import { searchWavesByName } from "@/services/api/waves-v2-api";
import type { SidebarWave } from "@/types/waves.types";

const EMPTY_WAVES: SidebarWave[] = [];
const noopRefetch = () => Promise.resolve();

// The modal owns the input debounce. Keep this request keyed to that settled
// query and the current viewer, matching the other viewer-scoped Waves lists.
export function useHeaderSearchWaves(name: string, enabled: boolean) {
  const {
    connectedProfile,
    activeProfileProxy,
    fetchingProfile,
    isAuthenticated,
  } = useAuth();
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasAuthenticatedProfile = getHasAuthenticatedProfile({
    hasValidWalletAuthorization,
    isAuthenticated,
    hasConnectedProfile: Boolean(connectedProfile?.handle),
  });
  const viewerIdentityKey = getViewerIdentityKey({
    address,
    proxyId: activeProfileProxy?.id,
    hasValidWalletAuthorization,
    hasAuthenticatedProfile,
  });
  const isPendingAuthSwitch = Boolean(
    address && (!hasValidWalletAuthorization || fetchingProfile)
  );
  const queryEnabled = enabled && !isPendingAuthSwitch;
  const query = useQuery({
    queryKey: [
      QueryKey.WAVES_SEARCH,
      {
        surface: "header",
        name,
        page_size: 20,
        viewer: viewerIdentityKey,
        profile: connectedProfile?.handle?.toLowerCase() ?? null,
      },
    ],
    queryFn: () => searchWavesByName({ name, pageSize: 20 }),
    enabled: queryEnabled,
    ...getDefaultQueryRetry(),
  });

  return {
    waves: queryEnabled ? (query.data ?? EMPTY_WAVES) : EMPTY_WAVES,
    isFetching: queryEnabled && query.isFetching,
    error: queryEnabled ? query.error : null,
    refetch: queryEnabled ? query.refetch : noopRefetch,
  };
}
