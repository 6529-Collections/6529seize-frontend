"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import BrainMobileWaves from "./BrainMobileWaves";
import { BrainView } from "./brainMobileViews";
import { useLayout } from "../my-stream/layout/LayoutContext";

function BrainMobileViewLoadingFallback() {
  return (
    <div
      aria-hidden="true"
      data-mobile-bottom-nav-scroll-target="true"
      className="tw-h-full tw-min-h-[50dvh] tw-bg-black"
    />
  );
}

const BrainMobileAbout = dynamic(() => import("./BrainMobileAbout"), {
  loading: () => <BrainMobileViewLoadingFallback />,
});

const CommunityCurations = dynamic(
  () => import("@/components/community-curations/CommunityCurations"),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

const MyStreamWaveLeaderboard = dynamic(
  () => import("../my-stream/MyStreamWaveLeaderboard"),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

const MyStreamWaveSubmissions = dynamic(
  () => import("../my-stream/MyStreamWaveSubmissions"),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

const MyStreamWaveOutcome = dynamic(
  () => import("../my-stream/MyStreamWaveOutcome"),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

const MyStreamWaveSales = dynamic(
  () => import("../my-stream/MyStreamWaveSales"),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

const MyStreamWavePolls = dynamic(
  () => import("../my-stream/MyStreamWavePolls"),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

const MyStreamWaveMyVotes = dynamic(
  () => import("../my-stream/votes/MyStreamWaveMyVotes"),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

const MyStreamWaveFAQ = dynamic(() => import("../my-stream/MyStreamWaveFAQ"), {
  loading: () => <BrainMobileViewLoadingFallback />,
});

const BrainMobileMessages = dynamic(() => import("./BrainMobileMessages"), {
  loading: () => <BrainMobileViewLoadingFallback />,
});

const BrainNotifications = dynamic(
  () => import("../notifications/NotificationsContainer"),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

const WaveWinners = dynamic(
  () =>
    import("@/components/waves/winners/WaveWinners").then(
      (mod) => mod.WaveWinners
    ),
  { loading: () => <BrainMobileViewLoadingFallback /> }
);

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

interface BrainMobileWaveViewProps {
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly wave: ApiWave | null | undefined;
}

interface BrainMobileCompetitionWaveViewProps extends BrainMobileWaveViewProps {
  readonly isCompetitionWave: boolean;
}

interface BrainMobileOutcomeViewProps {
  readonly isCompetitionWave: boolean;
  readonly isCurationWave: boolean;
  readonly outcomesVisible: boolean;
  readonly wave: ApiWave | null | undefined;
}

interface BrainMobileCurationViewProps {
  readonly isCurationWave: boolean;
  readonly wave: ApiWave | null | undefined;
}

interface BrainMobilePollsViewProps extends BrainMobileWaveViewProps {
  readonly hasPolls: boolean;
}

interface BrainMobileFAQViewProps {
  readonly isMemesWave: boolean;
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

function BrainMobileLeaderboardView({
  isCompetitionWave,
  onDropClick,
  wave,
}: BrainMobileCompetitionWaveViewProps) {
  if (!isCompetitionWave || !wave) {
    return null;
  }

  return (
    <MyStreamWaveLeaderboard
      key={wave.id}
      wave={wave}
      onDropClick={onDropClick}
    />
  );
}

function BrainMobileSubmissionsView({
  isCompetitionWave,
  onDropClick,
  wave,
}: BrainMobileCompetitionWaveViewProps) {
  if (!isCompetitionWave || !wave) {
    return null;
  }

  return (
    <MyStreamWaveSubmissions
      key={wave.id}
      wave={wave}
      onDropClick={onDropClick}
    />
  );
}

function BrainMobileWinnersView({
  isCompetitionWave,
  onDropClick,
  wave,
}: BrainMobileCompetitionWaveViewProps) {
  if (!isCompetitionWave || !wave) {
    return null;
  }

  return (
    <div key={wave.id} className="tw-px-2 sm:tw-px-4">
      <WaveWinners wave={wave} onDropClick={onDropClick} />
    </div>
  );
}

function BrainMobileOutcomeView({
  isCompetitionWave,
  isCurationWave,
  outcomesVisible,
  wave,
}: BrainMobileOutcomeViewProps) {
  if (!isCompetitionWave || isCurationWave || !outcomesVisible || !wave) {
    return null;
  }

  return <MyStreamWaveOutcome key={wave.id} wave={wave} />;
}

function BrainMobileMyVotesView({
  isCompetitionWave,
  onDropClick,
  wave,
}: BrainMobileCompetitionWaveViewProps) {
  if (!isCompetitionWave || !wave) {
    return null;
  }

  return (
    <MyStreamWaveMyVotes key={wave.id} wave={wave} onDropClick={onDropClick} />
  );
}

function BrainMobileSalesView({
  isCurationWave,
  wave,
}: BrainMobileCurationViewProps) {
  if (!isCurationWave || !wave) {
    return null;
  }

  return <MyStreamWaveSales key={wave.id} waveId={wave.id} />;
}

function BrainMobilePollsView({
  hasPolls,
  onDropClick,
  wave,
}: BrainMobilePollsViewProps) {
  if (!hasPolls || !wave) {
    return null;
  }

  return (
    <MyStreamWavePolls key={wave.id} wave={wave} onDropClick={onDropClick} />
  );
}

function BrainMobileFAQView({ isMemesWave, wave }: BrainMobileFAQViewProps) {
  if (!isMemesWave || !wave) {
    return null;
  }

  return <MyStreamWaveFAQ key={wave.id} wave={wave} />;
}

function assertUnreachable(value: never): null {
  void value;
  return null;
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

  switch (activeView) {
    case BrainView.DEFAULT:
      return children;
    case BrainView.ABOUT:
      return <BrainMobileAbout activeWaveId={activeWaveId} />;
    case BrainView.LEADERBOARD:
      return (
        <BrainMobileLeaderboardView
          isCompetitionWave={isCompetitionWave}
          wave={wave}
          onDropClick={onDropClick}
        />
      );
    case BrainView.SUBMISSIONS:
      return (
        <BrainMobileSubmissionsView
          isCompetitionWave={isCompetitionWave}
          wave={wave}
          onDropClick={onDropClick}
        />
      );
    case BrainView.SALES:
      return (
        <BrainMobileSalesView isCurationWave={isCurationWave} wave={wave} />
      );
    case BrainView.WINNERS:
      return (
        <BrainMobileWinnersView
          isCompetitionWave={isCompetitionWave}
          wave={wave}
          onDropClick={onDropClick}
        />
      );
    case BrainView.OUTCOME:
      return (
        <BrainMobileOutcomeView
          isCompetitionWave={isCompetitionWave}
          isCurationWave={isCurationWave}
          outcomesVisible={outcomesVisible}
          wave={wave}
        />
      );
    case BrainView.MY_VOTES:
      return (
        <BrainMobileMyVotesView
          isCompetitionWave={isCompetitionWave}
          wave={wave}
          onDropClick={onDropClick}
        />
      );
    case BrainView.POLLS:
      return (
        <BrainMobilePollsView
          hasPolls={hasPolls}
          wave={wave}
          onDropClick={onDropClick}
        />
      );
    case BrainView.FAQ:
      return <BrainMobileFAQView isMemesWave={isMemesWave} wave={wave} />;
    case BrainView.WAVES:
      return (
        <BrainMobileWaves
          onOpenQuickVote={onOpenQuickVote}
          onPrefetchQuickVote={onPrefetchQuickVote}
        />
      );
    case BrainView.PROFILE_FEED:
      return <BrainMobileProfileFeed />;
    case BrainView.MESSAGES:
      return <BrainMobileMessages />;
    case BrainView.NOTIFICATIONS:
      return <BrainNotifications />;
    default:
      return assertUnreachable(activeView);
  }
}
