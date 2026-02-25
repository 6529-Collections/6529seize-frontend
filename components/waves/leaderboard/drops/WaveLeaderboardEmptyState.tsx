import React from "react";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";

import { getWaveDropEligibility } from "../dropEligibility";

import { WaveLeaderboardCurationEmptyState } from "./WaveLeaderboardCurationEmptyState";
import { WaveLeaderboardDefaultEmptyState } from "./WaveLeaderboardDefaultEmptyState";
import { WaveLeaderboardMemesEmptyState } from "./WaveLeaderboardMemesEmptyState";

interface WaveLeaderboardEmptyStateProps {
  readonly wave: ApiWave;
  readonly onCreateDrop?: (() => void) | undefined;
}

export const WaveLeaderboardEmptyState: React.FC<
  WaveLeaderboardEmptyStateProps
> = ({ onCreateDrop, wave }) => {
  const { connectedProfile, activeProfileProxy } =
    React.useContext(AuthContext);
  const { isMemesWave, isCurationWave, participation } = useWave(wave);
  const isLoggedIn = Boolean(connectedProfile?.handle);
  const { canCreateDrop, restrictionMessage, restrictionLink } =
    getWaveDropEligibility({
      isLoggedIn,
      isProxy: Boolean(activeProfileProxy),
      isCurationWave,
      participation,
    });

  if (isMemesWave) {
    return <WaveLeaderboardMemesEmptyState />;
  }

  if (isCurationWave) {
    return (
      <WaveLeaderboardCurationEmptyState
        onCreateDrop={onCreateDrop}
        canCreateDrop={canCreateDrop}
        dropRestrictionMessage={restrictionMessage}
        dropRestrictionLink={restrictionLink}
      />
    );
  }

  return (
    <WaveLeaderboardDefaultEmptyState
      onCreateDrop={onCreateDrop}
      canCreateDrop={canCreateDrop}
      dropRestrictionMessage={restrictionMessage}
    />
  );
};
