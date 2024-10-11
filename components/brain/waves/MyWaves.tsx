import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { ApiWave } from "../../../generated/models/ApiWave";
import WavesList, { WavesListType } from "./WavesList";

type QueryParams = {
  readonly author: string;
  readonly limit: string;
};

export default function MyWaves() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowWaves = (): boolean =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;
  const [showWaves, setShowWaves] = useState(getShowWaves());

  useEffect(
    () => setShowWaves(getShowWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const params: QueryParams = {
    author: connectedProfile?.profile?.handle ?? "",
    limit: "10",
  };

  const { data } = useQuery({
    queryKey: [QueryKey.WAVES, params],
    queryFn: async () =>
      await commonApiFetch<ApiWave[]>({
        endpoint: `waves`,
        params,
      }),
    enabled: showWaves,
  });

  const [waves, setWaves] = useState<ApiWave[]>([]);

  useEffect(() => {
    if (data) {
      setWaves(data);
    }
  }, [data]);

  return <WavesList waves={waves} type={WavesListType.MY_WAVES} />;
}
