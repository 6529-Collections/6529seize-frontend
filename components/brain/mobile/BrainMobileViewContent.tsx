"use client";

import type { ReactNode } from "react";
import BrainMobileAbout from "./BrainMobileAbout";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveLeaderboard from "../my-stream/MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "../my-stream/MyStreamWaveOutcome";
import MyStreamWaveSales from "../my-stream/MyStreamWaveSales";
import MyStreamWaveMyVotes from "../my-stream/votes/MyStreamWaveMyVotes";
import MyStreamWaveFAQ from "../my-stream/MyStreamWaveFAQ";
import BrainMobileWaves from "./BrainMobileWaves";
import BrainMobileMessages from "./BrainMobileMessages";
import BrainNotifications from "../notifications/NotificationsContainer";
import { WaveWinners } from "@/components/waves/winners/WaveWinners";
import { BrainView } from "./brainMobileViews";

interface BrainMobileViewContentProps {
  readonly activeView: BrainView;
  readonly activeWaveId: string | null;
  readonly children: ReactNode;
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
  readonly wave: ApiWave | null | undefined;
}

export default function BrainMobileViewContent({
  activeView,
  activeWaveId,
  children,
  isCurationWave,
  isMemesWave,
  isRankWave,
  onDropClick,
  onOpenQuickVote,
  onPrefetchQuickVote,
  wave,
}: BrainMobileViewContentProps) {
  const rankWave = isRankWave ? (wave ?? null) : null;
  const curationWave = isCurationWave ? (wave ?? null) : null;
  const faqWave = isRankWave && isMemesWave ? (wave ?? null) : null;

  const leaderboardContent = rankWave ? (
    <MyStreamWaveLeaderboard
      key={rankWave.id}
      wave={rankWave}
      onDropClick={onDropClick}
    />
  ) : null;

  const salesContent = curationWave ? (
    <MyStreamWaveSales waveId={curationWave.id} />
  ) : null;

  const winnersContent = rankWave ? (
    <div className="tw-px-2 sm:tw-px-4">
      <WaveWinners wave={rankWave} onDropClick={onDropClick} />
    </div>
  ) : null;

  const outcomeContent = rankWave ? (
    <MyStreamWaveOutcome wave={rankWave} />
  ) : null;

  const myVotesContent = rankWave ? (
    <MyStreamWaveMyVotes wave={rankWave} onDropClick={onDropClick} />
  ) : null;

  const faqContent = faqWave ? <MyStreamWaveFAQ wave={faqWave} /> : null;

  const contentByView: Record<BrainView, ReactNode> = {
    [BrainView.DEFAULT]: <>{children}</>,
    [BrainView.ABOUT]: <BrainMobileAbout activeWaveId={activeWaveId} />,
    [BrainView.LEADERBOARD]: leaderboardContent,
    [BrainView.SALES]: salesContent,
    [BrainView.WINNERS]: winnersContent,
    [BrainView.OUTCOME]: outcomeContent,
    [BrainView.MY_VOTES]: myVotesContent,
    [BrainView.FAQ]: faqContent,
    [BrainView.WAVES]: (
      <BrainMobileWaves
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    ),
    [BrainView.MESSAGES]: <BrainMobileMessages />,
    [BrainView.NOTIFICATIONS]: <BrainNotifications />,
  };

  return contentByView[activeView];
}
