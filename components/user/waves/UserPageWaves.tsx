"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import WaveItem from "@/components/waves/list/WaveItem";
import UserPageWavesSearch from "./UserPageWavesSearch";
interface SearchWavesParams {
  readonly author?: string;
  readonly name?: string;
  readonly limit: number;
  readonly serial_no_less_than?: number;
  readonly group_id?: string;
}

export default function UserPageWaves({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const haveProfile = !!profile.handle;
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getShowCreateNewWaveButton = () => {
    return (
      !!connectedProfile?.handle &&
      !activeProfileProxy &&
      connectedProfile.handle === profile.handle
    );
  };
  const [showCreateNewWaveButton, setShowCreateNewWaveButton] = useState(
    getShowCreateNewWaveButton()
  );

  useEffect(() => {
    setShowCreateNewWaveButton(getShowCreateNewWaveButton());
  }, [connectedProfile, profile, activeProfileProxy]);

  const getUsePublicWaves = () =>
    !connectedProfile?.handle || !!activeProfileProxy;
  const [usePublicWaves, setUsePublicWaves] = useState(getUsePublicWaves());
  useEffect(
    () => setUsePublicWaves(getUsePublicWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const getParams = (): SearchWavesParams => {
    return {
      author: profile.handle ?? undefined,
      name: undefined,
      limit: 20,
    };
  };

  const [params, setParams] = useState<SearchWavesParams>(getParams());

  const setWaveName = (value: string | null) => {
    setParams((p) => ({ ...p, name: value ?? undefined }));
  };

  const [debouncedParams, setDebouncedParams] =
    useState<SearchWavesParams>(params);

  useDebounce(() => setDebouncedParams(params), 200, [params]);

  const {
    data: wavesAuth,
    fetchNextPage: fetchNextPageAuth,
    hasNextPage: hasNextPageAuth,
    isFetching: isFetchingAuth,
    isFetchingNextPage: isFetchingNextPageAuth,
    status: statusAuth,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {};
      if (pageParam) {
        queryParams.serial_no_less_than = `${pageParam}`;
      }

      if (debouncedParams.author) {
        queryParams.author = debouncedParams.author;
      }

      if (debouncedParams.name) {
        queryParams.name = debouncedParams.name;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves`,
        params: queryParams,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: !usePublicWaves && !!haveProfile,
  });

  const {
    data: wavesPublic,
    fetchNextPage: fetchNextPagePublic,
    hasNextPage: hasNextPagePublic,
    isFetching: isFetchingPublic,
    isFetchingNextPage: isFetchingNextPagePublic,
    status: statusPublic,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_PUBLIC, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {};
      if (pageParam) {
        queryParams.serial_no_less_than = `${pageParam}`;
      }

      if (debouncedParams.author) {
        queryParams.author = debouncedParams.author;
      }

      if (debouncedParams.name) {
        queryParams.name = debouncedParams.name;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves-public`,
        params: queryParams,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: usePublicWaves && !!haveProfile,
  });

  const getWaves = (): ApiWave[] => {
    if (usePublicWaves) {
      return wavesPublic?.pages.flat() ?? [];
    }
    return wavesAuth?.pages.flat() ?? [];
  };

  const [waves, setWaves] = useState<ApiWave[]>(getWaves());
  useEffect(
    () => setWaves(getWaves()),
    [wavesAuth, wavesPublic, usePublicWaves]
  );

  const onBottomIntersection = (state: boolean) => {
    if (!state) {
      return;
    }
    if (usePublicWaves) {
      if (statusPublic === "pending") {
        return;
      }
      if (isFetchingPublic) {
        return;
      }
      if (isFetchingNextPagePublic) {
        return;
      }
      if (!hasNextPagePublic) {
        return;
      }
      fetchNextPagePublic();
      return;
    }
    if (statusAuth === "pending") {
      return;
    }
    if (isFetchingAuth) {
      return;
    }
    if (isFetchingNextPageAuth) {
      return;
    }
    if (!hasNextPageAuth) {
      return;
    }
    fetchNextPageAuth();
  };

  return (
    <div>
      <UserPageWavesSearch
        waveName={params.name ?? null}
        showCreateNewWaveButton={showCreateNewWaveButton}
        setWaveName={setWaveName}
      />
      <div className="tw-overflow-hidden">
        <div className="tw-mt-4 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-y-3 tw-gap-x-4">
          {waves.map((wave) => (
            <WaveItem key={`waves-${wave.id}`} wave={wave} />
          ))}
        </div>
        {(isFetchingAuth || isFetchingPublic) && (
          <div className="tw-w-full tw-text-center tw-mt-8">
            <CircleLoader size={CircleLoaderSize.XXLARGE} />
          </div>
        )}
        <CommonIntersectionElement onIntersection={onBottomIntersection} />
      </div>
    </div>
  );
}
