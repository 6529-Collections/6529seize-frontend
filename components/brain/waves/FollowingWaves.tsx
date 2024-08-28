import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Wave } from "../../../generated/models/Wave";

import { OutgoingIdentitySubscriptionsPage } from "../../../generated/models/OutgoingIdentitySubscriptionsPage";
import WavesList, { WavesListType } from "./WavesList";

export default function FollowingWaves() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowWaves = (): boolean =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;
  const [showWaves, setShowWaves] = useState(getShowWaves());

  useEffect(
    () => setShowWaves(getShowWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const { data } = useQuery({
    queryKey: [
      QueryKey.FOLLOWING_WAVES,
      {
        target_type: "WAVE",
      },
    ],
    queryFn: async () =>
      await commonApiFetch<OutgoingIdentitySubscriptionsPage>({
        endpoint: `/identity-subscriptions/outgoing/WAVE`,
      }),
    enabled: showWaves,
  });

  const getWaves = () => {
    if (!data?.data.length) {
      return [];
    }
    return data.data.map((wave) => wave.target as Wave);
  };

  const [waves, setWaves] = useState<Wave[]>(getWaves());

  useEffect(() => {
    if (data) {
      setWaves(getWaves());
    }
  }, [data]);

  return <WavesList waves={waves} type={WavesListType.FOLLOWING} />;
}
