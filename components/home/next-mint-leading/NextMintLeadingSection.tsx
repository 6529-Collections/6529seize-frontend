"use client";

import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { shouldShowNextWinnerInComingUp } from "@/helpers/mint-visibility.helpers";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { LeadingCard } from "./LeadingCard";
import { NextMintCard } from "./NextMintCard";

const SKELETON_KEYS = [
  "coming-up-skeleton-1",
  "coming-up-skeleton-2",
  "coming-up-skeleton-3",
];

const CARD_LAYOUT_CLASS_NAME =
  "-tw-mx-4 tw-grid tw-auto-cols-[80%] tw-grid-flow-col tw-snap-x tw-snap-mandatory tw-scroll-px-4 tw-gap-3 tw-overflow-x-auto tw-overscroll-x-contain tw-px-4 tw-py-1 tw-scrollbar-none md:tw-mx-0 md:tw-auto-cols-auto md:tw-grid-flow-row md:tw-grid-cols-2 md:tw-gap-4 md:tw-overflow-visible md:tw-px-0 lg:tw-grid-cols-3 lg:tw-gap-5";

export function NextMintLeadingSection() {
  const {
    nft: nowMinting,
    isFetching: isNowMintingFetching,
    isDropComplete: isNowMintingComplete,
  } = useNowMintingStatus();
  const {
    nextMint,
    nextMintTitle,
    waveId,
    isReady,
    isFetching: isWinnersFetching,
  } = useNextMintDrop();

  const { drops, isFetching: isLeaderboardFetching } = useWaveDropsLeaderboard({
    waveId: waveId ?? "",
    sort: WaveDropsLeaderboardSort.RATING_PREDICTION,
    enabled: !!waveId,
  });

  // Compare with nowMinting name (case-insensitive, trimmed)
  // Only treat as same when both values exist; otherwise treat as not equal
  const isNextMintSameAsNowMinting =
    !!nowMinting?.name &&
    !!nextMintTitle &&
    nowMinting.name.toLowerCase().trim() === nextMintTitle.toLowerCase().trim();

  // Determine what to show
  const canShowNextMint = shouldShowNextWinnerInComingUp({
    isMintEnded: isNowMintingComplete,
    nextMintExists: !!nextMint,
  });
  const showNextMint =
    canShowNextMint && !!nextMint && !isNextMintSameAsNowMinting;
  const leadingCount = showNextMint ? 2 : 3;

  // Get top drops from leaderboard
  const leading = drops.slice(0, leadingCount);

  const isFetching =
    isNowMintingFetching || isWinnersFetching || isLeaderboardFetching;

  if (!isReady || !waveId) {
    return null;
  }

  const sectionClassName =
    "tw-px-4 md:tw-px-6 lg:tw-px-8 tw-relative tw-z-10 tw-@container tw-pb-10 md:tw-pb-16";
  const header = (
    <div className="tw-mb-5 tw-flex tw-items-start tw-justify-between tw-gap-4 md:tw-mb-6 md:tw-items-end">
      <div className="tw-min-w-0">
        <h2
          id="coming-up-heading"
          className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-[-0.03em] tw-text-iron-50 md:tw-text-[26px] lg:tw-text-3xl"
        >
          Coming up
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-relaxed tw-tracking-[0.08em] tw-text-iron-500 md:tw-mt-2.5">
          Next in queue and current vote leaders
        </p>
      </div>
      <Link
        data-home-action="View all"
        href={getWaveRoute({
          waveId,
          isDirectMessage: false,
          isApp: false,
        })}
        className="tw-inline-flex tw-min-h-8 tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-200 tw-no-underline tw-transition-colors focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-4 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-white/30 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none md:tw-min-h-9 md:tw-px-3.5 md:tw-text-[13px]"
      >
        <span>View all</span>
        <ArrowRightIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden />
      </Link>
    </div>
  );

  if (isFetching && !showNextMint && leading.length === 0) {
    return (
      <section
        aria-labelledby="coming-up-heading"
        aria-busy="true"
        className={sectionClassName}
      >
        <div>
          {header}
          <div className={CARD_LAYOUT_CLASS_NAME} aria-hidden="true">
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
    <section
      aria-labelledby="coming-up-heading"
      data-home-section="Coming up"
      className={sectionClassName}
    >
      <div>
        {header}
        <div className={CARD_LAYOUT_CLASS_NAME}>
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
    <div className="tw-min-w-0 tw-snap-start tw-text-left motion-reduce:[&_*]:tw-animate-none">
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
        <div className="tw-relative tw-aspect-[4/5] tw-w-full tw-animate-pulse tw-bg-iron-900/70">
          <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-flex tw-flex-wrap tw-justify-between tw-gap-2 tw-p-3.5">
            <div className="tw-h-6 tw-w-20 tw-rounded-md tw-bg-iron-800/60" />
            <div className="tw-h-6 tw-w-24 tw-rounded-md tw-bg-iron-800/60" />
          </div>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2.5 tw-px-4 tw-pb-4 tw-pt-3.5 md:tw-px-5 md:tw-pb-5 md:tw-pt-4">
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-h-4 tw-w-10 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
            <div className="tw-h-4 tw-flex-1 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-size-6 tw-animate-pulse tw-rounded-full tw-bg-iron-800/60" />
            <div className="tw-h-3 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          </div>
        </div>
      </div>
    </div>
  );
};
