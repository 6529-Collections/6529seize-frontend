"use client";

import React, { useMemo } from "react";
import type { ComponentType } from "react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  resolveWaveParticipationVariant,
  type WaveParticipationVariant,
} from "@/helpers/waves/wave-participation-presentation.helpers";
import { MemesLeaderboardDrop } from "@/components/memes/drops/MemesLeaderboardDrop";
import { DefaultWaveSmallLeaderboardDrop } from "@/components/waves/small-leaderboard/DefaultWaveSmallLeaderboardDrop";
import { MemesWaveSmallLeaderboardDrop } from "@/components/waves/small-leaderboard/MemesWaveSmallLeaderboardDrop";
import { QuorumWaveSmallLeaderboardDrop } from "@/components/waves/small-leaderboard/QuorumWaveSmallLeaderboardDrop";
import { DefaultWaveLeaderboardDrop } from "./drops/DefaultWaveLeaderboardDrop";
import { QuorumWaveLeaderboardDrop } from "./drops/QuorumWaveLeaderboardDrop";

interface WaveLeaderboardDropRendererProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onSourceDropDeleted?: (() => void) | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
}

interface WaveSmallLeaderboardDropRendererProps {
  readonly drop: ExtendedDrop;
  readonly isApproveWave?: boolean | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
  readonly onDropClick: () => void;
}

interface WaveLeaderboardRendererSet {
  readonly LeaderboardDrop: ComponentType<WaveLeaderboardDropRendererProps>;
  readonly SmallLeaderboardDrop: ComponentType<WaveSmallLeaderboardDropRendererProps>;
}

interface ResolvedWaveLeaderboardRendererSet extends WaveLeaderboardRendererSet {
  readonly variant: WaveParticipationVariant;
}

const WAVE_LEADERBOARD_VARIANT_OVERRIDES: Readonly<
  Partial<Record<string, WaveParticipationVariant>>
> = {};

const DefaultLeaderboardDropRenderer: React.FC<
  WaveLeaderboardDropRendererProps
> = ({
  drop,
  onDropClick,
  isVotingClosed,
  isVotingControlsLocked,
  winningThreshold,
  winningThresholdMinDurationMs,
}) => {
  return (
    <DefaultWaveLeaderboardDrop
      drop={drop}
      onDropClick={onDropClick}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      winningThreshold={winningThreshold}
      winningThresholdMinDurationMs={winningThresholdMinDurationMs}
      mediaContainerHeightClassName="tw-h-96"
    />
  );
};

const QuorumLeaderboardDropRenderer: React.FC<
  WaveLeaderboardDropRendererProps
> = ({
  drop,
  onDropClick,
  isVotingClosed,
  isVotingControlsLocked,
  winningThreshold,
  winningThresholdMinDurationMs,
}) => {
  return (
    <QuorumWaveLeaderboardDrop
      drop={drop}
      onDropClick={onDropClick}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      winningThreshold={winningThreshold}
      winningThresholdMinDurationMs={winningThresholdMinDurationMs}
    />
  );
};

const MemesLeaderboardDropRenderer: React.FC<
  WaveLeaderboardDropRendererProps
> = ({ drop, wave, onDropClick, onSourceDropDeleted }) => {
  return (
    <MemesLeaderboardDrop
      drop={drop}
      wave={wave}
      onDropClick={onDropClick}
      onSourceDropDeleted={onSourceDropDeleted}
    />
  );
};

const WAVE_LEADERBOARD_RENDERERS: Readonly<
  Record<WaveParticipationVariant, WaveLeaderboardRendererSet>
> = {
  default: {
    LeaderboardDrop: DefaultLeaderboardDropRenderer,
    SmallLeaderboardDrop: DefaultWaveSmallLeaderboardDrop,
  },
  memes: {
    LeaderboardDrop: MemesLeaderboardDropRenderer,
    SmallLeaderboardDrop: MemesWaveSmallLeaderboardDrop,
  },
  curation: {
    LeaderboardDrop: DefaultLeaderboardDropRenderer,
    SmallLeaderboardDrop: DefaultWaveSmallLeaderboardDrop,
  },
  quorum: {
    LeaderboardDrop: QuorumLeaderboardDropRenderer,
    SmallLeaderboardDrop: QuorumWaveSmallLeaderboardDrop,
  },
};

export const useWaveLeaderboardRendererSet = (
  waveId: string | null | undefined
): ResolvedWaveLeaderboardRendererSet => {
  const { isMemesWave, isCurationWave, isQuorumWave } = useSeizeSettings();

  return useMemo(() => {
    const variant = resolveWaveParticipationVariant({
      waveId,
      overrides: WAVE_LEADERBOARD_VARIANT_OVERRIDES,
      isMemesWave,
      isCurationWave,
      isQuorumWave,
    });

    return {
      variant,
      ...WAVE_LEADERBOARD_RENDERERS[variant],
    };
  }, [isCurationWave, isMemesWave, isQuorumWave, waveId]);
};
