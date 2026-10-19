"use client";

import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { shouldShowNextWinnerInComingUp } from "@/helpers/mint-visibility.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
  const {
    nft: nowMinting,
    status: mintStatus,
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
    pageSize: 3,
    sort: WaveDropsLeaderboardSort.RATING_PREDICTION,
    enabled: !!waveId,
    retainOnUnmount: true,
  });

  const currentTitle = nowMinting?.name.trim().toLowerCase();
  const nextTitle = nextMintTitle?.trim().toLowerCase();

  const canShowNextMint = shouldShowNextWinnerInComingUp({
    isMintEnded: isNowMintingComplete,
    nextMintExists: !!nextMint,
  });
  // Unknown current artwork or mint status must not be mistaken for a new mint.
  // The leader cards do not depend on either of these optional details.
  const showNextMint =
    canShowNextMint &&
    mintStatus !== null &&
    !!currentTitle &&
    !!nextTitle &&
    currentTitle !== nextTitle;
  const leadingCount = showNextMint ? 2 : 3;

  const leading = drops.slice(0, leadingCount);
  const hasCards = showNextMint || leading.length > 0;
  const isFetching = isWinnersFetching || isLeaderboardFetching;

  if (!isReady || !waveId) return null;
  if (!hasCards && !isFetching) return null;

  const sectionClassName =
    "tw-px-4 md:tw-px-6 lg:tw-px-8 tw-relative tw-z-10 tw-@container tw-pb-10 md:tw-pb-16";
  const header = (
    <div className="tw-mb-8 tw-flex tw-flex-col tw-items-start tw-gap-4 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
      <div>
        <h2
          id="home-coming-up"
          className="tw-m-0 tw-text-xl tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-50 md:tw-text-2xl"
        >
          {t(locale, "home.comingUp.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-3 tw-text-[11px] tw-font-normal tw-uppercase tw-leading-relaxed tw-tracking-[0.14em] tw-text-iron-500 sm:tw-text-xs">
          {t(locale, "home.comingUp.subtitle")}
        </p>
      </div>
      <Link
        data-home-action="View all"
        href={getWaveRoute({
          waveId,
          isDirectMessage: false,
          isApp: false,
        })}
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-white"
      >
        <span>{t(locale, "home.comingUp.viewAll")}</span>
        <ArrowRightIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden />
      </Link>
    </div>
  );

  return (
    <section
      data-home-section="Coming up"
      aria-labelledby="home-coming-up"
      className={sectionClassName}
    >
      <div>
        {header}
        {!hasCards && (
          <p role="status" className="tw-sr-only">
            {t(locale, "home.comingUp.loading")}
          </p>
        )}
        <div className="tw-grid tw-grid-cols-1 tw-gap-6 md:tw-grid-cols-2 lg:tw-grid-cols-3 lg:tw-gap-8">
          {!hasCards &&
            SKELETON_KEYS.map((key) => (
              <NextMintLeadingSkeletonCard key={key} />
            ))}
          {showNextMint && nextMint && <NextMintCard drop={nextMint} />}
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
    <div
      aria-hidden="true"
      className="tw-flex tw-flex-col tw-text-left motion-reduce:[&_*]:tw-animate-none"
    >
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-border-b tw-border-white/10 tw-bg-iron-900 tw-px-2.5 tw-py-1.5 sm:tw-px-3 sm:tw-py-2">
          <div className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          <div className="tw-h-3 tw-w-16 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        </div>
        <div className="tw-relative tw-flex tw-aspect-[3/4] tw-max-h-[clamp(320px,70vw,500px)] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-950">
          <div className="tw-h-full tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-900/70" />
        </div>
        <div className="tw-flex tw-flex-col tw-gap-3 tw-border-t tw-border-white/10 tw-px-3 tw-py-3 sm:tw-px-4">
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
