"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useNowMinting } from "@/hooks/useNowMinting";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { LeadingCard } from "./LeadingCard";
import { NextMintCard } from "./NextMintCard";

const SKELETON_KEYS = [
  "coming-up-skeleton-1",
  "coming-up-skeleton-2",
  "coming-up-skeleton-3",
];

export function NextMintLeadingSection() {
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const { nft: nowMinting, isFetching: isNowMintingFetching } = useNowMinting();

  const waveId = seizeSettings.memes_wave_id;

  const { decisionPoints, isFetching: isWinnersFetching } = useWaveDecisions({
    waveId: waveId ?? "",
    enabled: !!waveId,
  });

  const { drops, isFetching: isLeaderboardFetching } = useWaveDropsLeaderboard({
    waveId: waveId ?? "",
    sort: WaveDropsLeaderboardSort.RATING_PREDICTION,
    pausePolling: !waveId,
  });

  // Get latest winner (last decision, first place)
  const latestDecision = decisionPoints[decisionPoints.length - 1];
  const nextMint = latestDecision?.winners[0]?.drop ?? null;

  // Get nextMint title
  const nextMintTitle =
    nextMint?.title ??
    nextMint?.metadata.find((m) => m.data_key === "title")?.data_value;

  // Compare with nowMinting name (case-insensitive, trimmed)
  // Only treat as same when both values exist; otherwise treat as not equal
  const isNextMintSameAsNowMinting =
    !!nowMinting?.name &&
    !!nextMintTitle &&
    nowMinting.name.toLowerCase().trim() === nextMintTitle.toLowerCase().trim();

  // Determine what to show
  const showNextMint = nextMint && !isNextMintSameAsNowMinting;
  const leadingCount = showNextMint ? 2 : 3;

  // Get top drops from leaderboard
  const leading = drops.slice(0, leadingCount);

  const isFetching =
    isNowMintingFetching || isWinnersFetching || isLeaderboardFetching;

  if (!isLoaded || !waveId) {
    return null;
  }

  const sectionClassName =
    "tw-px-4 md:tw-px-6 lg:tw-px-8 tw-relative tw-z-10 tw-@container tw-pb-10 md:tw-pb-16";
  const header = (
    <div className="tw-mb-8 tw-flex tw-flex-col tw-items-start tw-gap-4 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
      <div>
        <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-2xl">
          Coming up
        </span>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-text-iron-500">
          Next in queue and current vote leaders
        </p>
      </div>
      <Link
        href={`/waves?wave=${waveId}`}
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-white"
      >
        <span>View all</span>
        <ArrowRightIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden />
      </Link>
    </div>
  );

  if (isFetching && !showNextMint && leading.length === 0) {
    return (
      <section className={sectionClassName}>
        <div>
          {header}
          <div className="tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-3 lg:tw-gap-8">
            {SKELETON_KEYS.map((key) => (
              <NextMintLeadingSkeletonCard key={key} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!showNextMint && leading.length === 0) {
    return null;
  }

  return (
    <section className={sectionClassName}>
      <div>
        {header}
        <div className="tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-3 lg:tw-gap-8">
          {showNextMint && <NextMintCard drop={nextMint} />}
          {leading.map((drop, index) => (
            <LeadingCard key={drop.id} drop={drop} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

const NextMintLeadingSkeletonCard = () => {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-text-left sm:tw-gap-4">
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-border-b tw-border-white/10 tw-bg-iron-900 tw-px-2.5 tw-py-1.5 sm:tw-px-3 sm:tw-py-2">
          <div className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          <div className="tw-h-3 tw-w-16 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        </div>
        <div className="tw-relative tw-flex tw-aspect-[3/4] tw-max-h-[clamp(320px,70vw,500px)] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-950 tw-p-2 sm:tw-p-3">
          <div className="tw-h-full tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-900/70" />
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-3">
        <div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-h-4 tw-w-10 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
            <div className="tw-h-4 tw-flex-1 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          </div>
          <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
            <div className="tw-size-6 tw-animate-pulse tw-rounded-full tw-bg-iron-800/60" />
            <div className="tw-h-3 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          </div>
        </div>
      </div>
    </div>
  );
};
