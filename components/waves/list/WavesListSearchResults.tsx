import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { useContext, useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";
import { ApiWave } from "../../../generated/models/ApiWave";
import { AuthContext } from "../../auth/Auth";
import WaveItem from "./WaveItem";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { useDebounce } from "react-use";

export interface SearchWavesParams {
  readonly author?: string;
  readonly name?: string;
  readonly limit: number;
  readonly serial_no_less_than?: number;
  readonly group_id?: string;
}

export default function WavesListSearchResults({
  identity,
  waveName,
}: {
  readonly identity: string | null;
  readonly waveName: string | null;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getUsePublicWaves = () =>
    !connectedProfile?.profile?.handle || !!activeProfileProxy;
  const [usePublicWaves, setUsePublicWaves] = useState(getUsePublicWaves());
  useEffect(
    () => setUsePublicWaves(getUsePublicWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const getParams = (): SearchWavesParams => {
    return {
      author: identity ?? undefined,
      name: waveName ?? undefined,
      limit: 20,
    };
  };

  const [params, setParams] = useState<SearchWavesParams>(getParams());
  useEffect(() => setParams(getParams()), [identity, waveName]);

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
    enabled: !usePublicWaves,
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
    enabled: usePublicWaves,
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
      <div>
        <span className="tw-tracking-tight tw-text-xl tw-font-medium tw-text-iron-50">
          Search
        </span>
        {waves.length === 0 && !isFetchingAuth && !isFetchingPublic && (
          <p className="tw-mt-2 tw-block tw-mb-0 tw-text-sm tw-italic tw-text-iron-500">
            No results found. Please try a different keyword or create a new
            wave.
          </p>
        )}
      </div>
      <div className="tw-overflow-hidden">
        <div className="tw-mt-3 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">
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
