import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";

export const WAVE_FOLLOWING_WAVES_PARAMS = {
  limit: 20,
  initialWavesOverviewType: WavesOverviewType.RecentlyDroppedTo,
  only_waves_followed_by_authenticated_user: true,
};

export const WAVE_DROPS_PARAMS = {
  limit: 50,
};
