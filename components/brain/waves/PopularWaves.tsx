import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { WavesOverviewParams } from "../../../types/waves.types";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";
import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Wave } from "../../../generated/models/Wave";
import WavesList, { WavesListType } from "./WavesList";

export default function PopularWaves() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getUsePublicWaves = () =>
    !connectedProfile?.profile?.handle || !!activeProfileProxy;
  const [usePublicWaves, setUsePublicWaves] = useState(getUsePublicWaves());

  useEffect(
    () => setUsePublicWaves(getUsePublicWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const getParams = (): Omit<WavesOverviewParams, "offset"> => {
    const paramsBody: Omit<WavesOverviewParams, "offset"> = {
      limit: 10,
      type: WavesOverviewType.MostSubscribed,
    };

    return paramsBody;
  };

  const params = getParams();

  useEffect(() => console.log(params), [params]);

  const { data: wavesAuth } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
      };

      return await commonApiFetch<Wave[]>({
        endpoint: `waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) => allPages.flat().length,
    enabled: !usePublicWaves,
  });

  const { data: wavesPublic } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW_PUBLIC, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
      };

      return await commonApiFetch<Wave[]>({
        endpoint: `public/waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) => allPages.flat().length,
    enabled: usePublicWaves,
  });

  const getWaves = (): Wave[] => {
    if (usePublicWaves) {
      return wavesPublic?.pages.flat() ?? [];
    }
    return wavesAuth?.pages.flat() ?? [];
  };

  const [waves, setWaves] = useState<Wave[]>(getWaves());
  useEffect(
    () => setWaves(getWaves()),
    [wavesAuth, wavesPublic, usePublicWaves]
  );

  return <WavesList waves={waves} type={WavesListType.POPULAR} />;
}
