"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import BrainMobileAbout from "./BrainMobileAbout";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import CommunityCurations from "@/components/community-curations/CommunityCurations";
import MyStreamWaveLeaderboard from "../my-stream/MyStreamWaveLeaderboard";
import MyStreamWaveSubmissions from "../my-stream/MyStreamWaveSubmissions";
import MyStreamWaveOutcome from "../my-stream/MyStreamWaveOutcome";
import MyStreamWaveSales from "../my-stream/MyStreamWaveSales";
import MyStreamWavePolls from "../my-stream/MyStreamWavePolls";
import MyStreamWaveMyVotes from "../my-stream/votes/MyStreamWaveMyVotes";
import MyStreamWaveFAQ from "../my-stream/MyStreamWaveFAQ";
import BrainMobileWaves from "./BrainMobileWaves";
import BrainMobileMessages from "./BrainMobileMessages";
import BrainNotifications from "../notifications/NotificationsContainer";
import { WaveWinners } from "@/components/waves/winners/WaveWinners";
import { BrainView } from "./brainMobileViews";
import { useLayout } from "../my-stream/layout/LayoutContext";

interface BrainMobileViewContentProps {
  readonly activeView: BrainView;
  readonly activeWaveId: string | null;
  readonly children: ReactNode;
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly isApproveWave?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
  readonly hasPolls?: boolean | undefined;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
  readonly wave: ApiWave | null | undefined;
}

function BrainMobileProfileFeed() {
  const { mobileWavesViewStyle } = useLayout();

  return (
    <CommunityCurations
      heightStyle={mobileWavesViewStyle}
      topContent={
        <div className="tw-mb-5">
          <Link
            href="/waves"
            prefetch={false}
            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
          >
            <ArrowLeftIcon className="tw-size-4" aria-hidden="true" />
            <span>Back to Waves</span>
          </Link>
        </div>
      }
    />
  );
}

export default function BrainMobileViewContent({
  activeView,
  activeWaveId,
  children,
  isCurationWave,
  isMemesWave,
  isRankWave,
  isApproveWave = false,
  outcomesVisible = true,
  hasPolls = false,
  onDropClick,
  onOpenQuickVote,
  onPrefetchQuickVote,
  wave,
}: BrainMobileViewContentProps) {
  const isCompetitionWave = isRankWave || isApproveWave;
  const supportsOutcomeView =
    isCompetitionWave && !isCurationWave && outcomesVisible;
  const rankWave = isCompetitionWave ? (wave ?? null) : null;
  const outcomeWave = supportsOutcomeView ? (wave ?? null) : null;
  const curationWave = isCurationWave ? (wave ?? null) : null;
  const faqWave = isMemesWave ? (wave ?? null) : null;

  const leaderboardContent = rankWave ? (
    <MyStreamWaveLeaderboard
      key={rankWave.id}
      wave={rankWave}
      onDropClick={onDropClick}
    />
  ) : null;

  const submissionsContent = rankWave ? (
    <MyStreamWaveSubmissions
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

  const outcomeContent = outcomeWave ? (
    <MyStreamWaveOutcome wave={outcomeWave} />
  ) : null;

  const myVotesContent = rankWave ? (
    <MyStreamWaveMyVotes wave={rankWave} onDropClick={onDropClick} />
  ) : null;

  const pollsContent =
    wave && hasPolls ? (
      <MyStreamWavePolls wave={wave} onDropClick={onDropClick} />
    ) : null;

  const faqContent = faqWave ? <MyStreamWaveFAQ wave={faqWave} /> : null;

  const contentByView: Record<BrainView, ReactNode> = {
    [BrainView.DEFAULT]: <>{children}</>,
    [BrainView.ABOUT]: <BrainMobileAbout activeWaveId={activeWaveId} />,
    [BrainView.LEADERBOARD]: leaderboardContent,
    [BrainView.SUBMISSIONS]: submissionsContent,
    [BrainView.SALES]: salesContent,
    [BrainView.WINNERS]: winnersContent,
    [BrainView.OUTCOME]: outcomeContent,
    [BrainView.MY_VOTES]: myVotesContent,
    [BrainView.POLLS]: pollsContent,
    [BrainView.FAQ]: faqContent,
    [BrainView.WAVES]: (
      <BrainMobileWaves
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    ),
    [BrainView.PROFILE_FEED]: <BrainMobileProfileFeed />,
    [BrainView.MESSAGES]: <BrainMobileMessages />,
    [BrainView.NOTIFICATIONS]: <BrainNotifications />,
  };

  return contentByView[activeView];
}
