import type { QueryClient } from "@tanstack/react-query";

import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "./query-utils";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { SidebarWave, SidebarWavesPage } from "@/types/waves.types";
import { QueryKey } from "../ReactQueryWrapper";

type SidebarWaveQueryKey =
  | QueryKey.WAVES_V2
  | QueryKey.WAVE_SUBWAVES
  | QueryKey.OFFICIAL_WAVES;

type SidebarWavesCacheData =
  | SidebarWave[]
  | {
      readonly pages?: readonly SidebarWavesPage[] | undefined;
    };

interface SidebarWavesQueryParams {
  readonly only_waves_followed_by_authenticated_user?: unknown;
  readonly exclude_followed?: unknown;
}

const getSidebarWavesQueryParams = (
  queryKey: readonly unknown[]
): SidebarWavesQueryParams => {
  const params = queryKey[1];
  return typeof params === "object" && params !== null ? params : {};
};

const shouldRemoveWaveFromSidebarQuery = ({
  following,
  queryParams,
}: {
  readonly following: boolean;
  readonly queryParams: SidebarWavesQueryParams;
}): boolean => {
  if (!following) {
    return queryParams.only_waves_followed_by_authenticated_user === true;
  }

  return queryParams.exclude_followed === true;
};

const updateSidebarWaveFollowing = (
  wave: SidebarWave,
  following: boolean
): SidebarWave => ({
  ...wave,
  subscribed: following,
});

const updateSidebarWaves = ({
  waves,
  waveId,
  following,
  removeWave,
}: {
  readonly waves: readonly SidebarWave[];
  readonly waveId: string;
  readonly following: boolean;
  readonly removeWave: boolean;
}): { readonly waves: SidebarWave[]; readonly didUpdate: boolean } => {
  let didUpdate = false;
  const updatedWaves: SidebarWave[] = [];

  for (const wave of waves) {
    if (wave.id !== waveId) {
      updatedWaves.push(wave);
      continue;
    }

    didUpdate = true;
    if (!removeWave) {
      updatedWaves.push(updateSidebarWaveFollowing(wave, following));
    }
  }

  return {
    waves: didUpdate ? updatedWaves : [...waves],
    didUpdate,
  };
};

const updateSidebarWavesCacheData = ({
  oldData,
  waveId,
  following,
  queryParams,
}: {
  readonly oldData: SidebarWavesCacheData | undefined;
  readonly waveId: string;
  readonly following: boolean;
  readonly queryParams: SidebarWavesQueryParams;
}): SidebarWavesCacheData | undefined => {
  if (!oldData) {
    return oldData;
  }

  const removeWave = shouldRemoveWaveFromSidebarQuery({
    following,
    queryParams,
  });

  if (Array.isArray(oldData)) {
    const update = updateSidebarWaves({
      waves: oldData,
      waveId,
      following,
      removeWave,
    });
    return update.didUpdate ? update.waves : oldData;
  }

  if (!oldData.pages || oldData.pages.length === 0) {
    return oldData;
  }

  const pageUpdates = oldData.pages.map((page) => {
    const update = updateSidebarWaves({
      waves: page.waves,
      waveId,
      following,
      removeWave,
    });
    return {
      page,
      ...update,
    };
  });

  if (!pageUpdates.some(({ didUpdate }) => didUpdate)) {
    return oldData;
  }

  return {
    ...oldData,
    pages: pageUpdates.map(({ page, waves }) => ({
      ...page,
      waves,
    })),
  };
};

const updateSidebarWaveQueries = ({
  queryClient,
  queryKey,
  waveId,
  following,
}: {
  readonly queryClient: QueryClient;
  readonly queryKey: SidebarWaveQueryKey;
  readonly waveId: string;
  readonly following: boolean;
}) => {
  const queries = queryClient.getQueriesData<SidebarWavesCacheData>({
    queryKey: [queryKey],
  });

  for (const [cacheQueryKey] of queries) {
    queryClient.setQueryData<SidebarWavesCacheData | undefined>(
      cacheQueryKey,
      (oldData) =>
        updateSidebarWavesCacheData({
          oldData,
          waveId,
          following,
          queryParams: getSidebarWavesQueryParams(cacheQueryKey),
        })
    );
  }
};

export const toggleWaveFollowing = ({
  waveId,
  following,
  queryClient,
}: {
  readonly waveId: string;
  readonly following: boolean;
  readonly queryClient: QueryClient;
}) => {
  const queryKey = [QueryKey.WAVE, { wave_id: waveId }];
  queryClient.setQueryData<ApiWave | undefined>(
    queryKey,
    (oldData: ApiWave | undefined): ApiWave | undefined => {
      if (!oldData) {
        return oldData;
      }
      return {
        ...oldData,
        subscribed_actions: following ? WAVE_DEFAULT_SUBSCRIPTION_ACTIONS : [],
      };
    }
  );

  updateSidebarWaveQueries({
    queryClient,
    queryKey: QueryKey.WAVES_V2,
    waveId,
    following,
  });
  updateSidebarWaveQueries({
    queryClient,
    queryKey: QueryKey.WAVE_SUBWAVES,
    waveId,
    following,
  });
  updateSidebarWaveQueries({
    queryClient,
    queryKey: QueryKey.OFFICIAL_WAVES,
    waveId,
    following,
  });
  queryClient
    .invalidateQueries({
      queryKey: [QueryKey.WAVES_V2],
    })
    .catch(() => undefined);
  queryClient
    .invalidateQueries({
      queryKey: [QueryKey.WAVE_SUBWAVES],
    })
    .catch(() => undefined);
  queryClient
    .invalidateQueries({
      queryKey: [QueryKey.OFFICIAL_WAVES],
    })
    .catch(() => undefined);
};
