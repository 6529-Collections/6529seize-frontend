import { QueryClient } from "@tanstack/react-query";

import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "./query-utils";
import { ApiWave } from "@/generated/models/ApiWave";
import { QueryKey } from "../ReactQueryWrapper";

export const toggleWaveFollowing = async ({
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
};
