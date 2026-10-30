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
import { ComingUpNextDecision } from "./ComingUpNextDecision";
import { LeadingCard } from "./LeadingCard";
import { NextMintCard } from "./NextMintCard";
import {
  HOME_ACTION_ARROW_CLASSES,
  HOME_TEXT_LINK_CLASSES,
  HOME_SECTION_TITLE_CLASSES,
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
    nextDecisionTime,
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
    "tw-relative tw-z-10 tw-px-4 tw-@container md:tw-px-6 lg:tw-px-8";
  const header = (
    <div className="tw-mb-7 tw-flex tw-flex-col tw-items-start tw-gap-3 md:tw-mb-8 md:tw-flex-row md:tw-items-end md:tw-justify-between md:tw-gap-6">
      <div className="tw-min-w-0">
        <h2 id="coming-up-heading" className={HOME_SECTION_TITLE_CLASSES}>
          {t(locale, "home.comingUp.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-3 tw-text-pretty tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-400 md:tw-text-[15px]">
          {t(locale, "home.comingUp.subtitle")}
          <ComingUpNextDecision timestamp={nextDecisionTime} locale={locale} />
        </p>
      </div>
      <Link
        data-home-action="View all"
        href={getWaveRoute({
          waveId,
          isDirectMessage: false,
          isApp: false,
        })}
        className={HOME_TEXT_LINK_CLASSES}
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
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950">
        <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-px-4 tw-py-4">
          <div className="tw-h-4 tw-w-20 tw-animate-pulse tw-rounded-md tw-bg-iron-800/60" />
          <div className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded-md tw-bg-iron-800/60" />
        </div>
        <div className="tw-aspect-[3/4] tw-w-full tw-shrink-0 tw-animate-pulse tw-bg-iron-900/70" />
        <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-pb-5 tw-pt-5">
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
