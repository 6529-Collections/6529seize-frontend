import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "./query-keys";
import { toggleWaveFollowing } from "./utils/toggleWaveFollowing";

export const createWaveQueryHandlers = (queryClient: QueryClient) => {
  const invalidateWavesV2 = () => {
    queryClient
      .invalidateQueries({
        queryKey: [QueryKey.WAVES_V2],
      })
      .catch(() => undefined);
  };

  const invalidateAllWaves = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES_OVERVIEW],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES_OVERVIEW_PUBLIC],
    });
    invalidateWavesV2();
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
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES_PUBLIC],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVE],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVE_OUTCOMES],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVE_OUTCOME_DISTRIBUTION],
    });
  };

  const invalidateDrops = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROPS_LEADERBOARD],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP],
    });
    queryClient
      .invalidateQueries({
        queryKey: [QueryKey.WAVE_POLLS],
      })
      .catch(() => undefined);
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP_VOTERS],
    });
    queryClient
      .invalidateQueries({
        queryKey: [QueryKey.DROP_POLL_VOTERS],
      })
      .catch(() => undefined);
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP_VOTE_LOGS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.FEED_ITEMS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP_DISCUSSION],
    });
  };

  const onWaveCreated = () => invalidateAllWaves();

  const onWaveFollowChange = ({
    waveId,
    following,
  }: {
    readonly waveId: string;
    readonly following: boolean;
  }) => {
    toggleWaveFollowing({ waveId, following, queryClient });
    setTimeout(() => {
      invalidateAllWaves();
    }, 1000);
  };
  const onIdentityFollowChange = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_FOLLOWING_ACTIONS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_FOLLOWERS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
    });
  };

  return {
    invalidateDrops,
    invalidateWavesV2,
    onIdentityFollowChange,
    onWaveCreated,
    onWaveFollowChange,
  };
};
