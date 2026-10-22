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
import {
  HOME_ACTION_ARROW_CLASSES,
  HOME_VIEW_ALL_CLASSES,
} from "../homeInteractionStyles";

const SKELETON_KEYS = [
  "coming-up-skeleton-1",
  "coming-up-skeleton-2",
  "coming-up-skeleton-3",
];

const CARD_LAYOUT_CLASS_NAME =
  "tw-grid tw-grid-cols-1 tw-gap-6 tw-py-1 md:tw-grid-cols-2 md:tw-gap-4 lg:tw-grid-cols-3 lg:tw-gap-5";

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
  const showLoadingCards =
    !hasCards || (isLeaderboardFetching && leading.length === 0);
  const isFetching = isWinnersFetching || isLeaderboardFetching;

  if (!isReady || !waveId) return null;
  if (!hasCards && !isFetching) return null;

  const sectionClassName =
    "tw-px-4 md:tw-px-6 lg:tw-px-8 tw-relative tw-z-10 tw-@container tw-pb-10 md:tw-pb-16";
  const header = (
    <div className="tw-relative tw-mb-5 tw-block md:tw-flex md:tw-items-end md:tw-justify-between md:tw-gap-4">
      <div className="tw-min-w-0">
        <h2
          id="coming-up-heading"
          className="tw-m-0 tw-pr-24 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-[-0.03em] tw-text-iron-50 md:tw-pr-0 md:tw-text-[22px] lg:tw-text-2xl"
        >
          {t(locale, "home.comingUp.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-normal tw-leading-[1.55] tw-text-iron-400">
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
        className={`${HOME_VIEW_ALL_CLASSES} tw-absolute tw-right-0 tw-top-0 tw-inline-flex md:tw-static`}
      >
        <span>{t(locale, "home.comingUp.viewAll")}</span>
        <ArrowRightIcon className={HOME_ACTION_ARROW_CLASSES} aria-hidden />
      </Link>
    </div>
  );

  return (
    <section
      aria-labelledby="coming-up-heading"
      data-home-section="Coming up"
      className={sectionClassName}
    >
      <div>
        {header}
        {showLoadingCards && (
          <output className="tw-sr-only">
            {t(locale, "home.comingUp.loading")}
          </output>
        )}
        <div data-testid="coming-up-cards" className={CARD_LAYOUT_CLASS_NAME}>
          {showNextMint && nextMint && <NextMintCard drop={nextMint} />}
          {leading.map((drop, index) => (
            <LeadingCard key={drop.id} drop={drop} rank={index + 1} />
          ))}
          {showLoadingCards &&
            SKELETON_KEYS.slice(0, leadingCount).map((key) => (
              <NextMintLeadingSkeletonCard key={key} />
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
      data-testid="coming-up-loading-card"
      className="tw-min-w-0 tw-text-left motion-reduce:[&_*]:tw-animate-none"
    >
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950">
        <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-px-3.5 tw-py-3">
          <div className="tw-h-4 tw-w-20 tw-animate-pulse tw-rounded-md tw-bg-iron-800/60" />
          <div className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded-md tw-bg-iron-800/60" />
        </div>
        <div className="tw-aspect-[3/4] tw-w-full tw-shrink-0 tw-animate-pulse tw-bg-iron-900/70" />
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
