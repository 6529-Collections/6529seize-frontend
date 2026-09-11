import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";
import { useWaveSubmissionButtonLabelOverride } from "@/hooks/waves/useWaveMetadata";
import React from "react";
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
  const { isMemesWave, isCurationWave, isQuorumWave, participation } =
    useWave(wave);
  const customCreateDropLabel = useWaveSubmissionButtonLabelOverride({
    enabled: Boolean(!isMemesWave && wave.id),
    waveId: wave.id,
  });
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
        createDropLabel={customCreateDropLabel ?? undefined}
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
      createDropLabel={
        customCreateDropLabel ?? (isQuorumWave ? "Create Proposal" : undefined)
      }
      emptyTitle={isQuorumWave ? "No proposals to show" : undefined}
      emptyDescription={
        isQuorumWave
          ? "Be the first to create a proposal in this wave"
          : undefined
      }
    />
  );
};
