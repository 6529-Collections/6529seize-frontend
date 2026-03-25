"use client";

import type SwiperClass from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import clsx from "clsx";
import React, { useMemo, useState } from "react";

const SWIPE_TRIGGER_THRESHOLD = 96;
const MAX_SWIPE_OFFSET = 132;
const SWIPE_EXIT_DURATION_MS = 180;
const SWIPE_EXIT_OFFSET = 420;
const MOBILE_SWIPE_CENTER_SLIDE_INDEX = 1;

interface MemesQuickVotePreviewProps {
  readonly drop: ExtendedDrop;
  readonly isBusy: boolean;
  readonly isMobile: boolean;
  readonly remainingCount: number;
  readonly swipeVoteAmount: number | null;
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly onAdvanceStart: () => void;
  readonly onSkip: () => void;
  readonly onVoteWithSwipe: () => void;
}

type SwipeDirection = "left" | "right";

function commitSwipeAction(
  direction: SwipeDirection,
  onSkip: () => void,
  onVoteWithSwipe: () => void
) {
  if (direction === "left") {
    onSkip();
    return;
  }

  onVoteWithSwipe();
}

function getCardTransform(
  isMobile: boolean,
  swipeExitDirection: SwipeDirection | null,
  swipeOffset: number
) {
  if (!isMobile) {
    return undefined;
  }

  if (swipeExitDirection === "left") {
    return `translateX(-${SWIPE_EXIT_OFFSET}px) rotate(-6deg)`;
  }

  if (swipeExitDirection === "right") {
    return `translateX(${SWIPE_EXIT_OFFSET}px) rotate(6deg)`;
  }

  return `translateX(${swipeOffset}px)`;
}

function getCardTransitionDuration(
  swipeExitDirection: SwipeDirection | null,
  swipeOffset: number
) {
  if (swipeExitDirection === null && swipeOffset !== 0) {
    return "0ms";
  }

  return `${SWIPE_EXIT_DURATION_MS}ms`;
}

function useQuickVotePreviewSwipe({
  isBusy,
  isMobile,
  onAdvanceStart,
  onSkip,
  onVoteWithSwipe,
  swipeVoteAmount,
}: Pick<
  MemesQuickVotePreviewProps,
  | "isBusy"
  | "isMobile"
  | "onAdvanceStart"
  | "onSkip"
  | "onVoteWithSwipe"
  | "swipeVoteAmount"
>) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeExitDirection, setSwipeExitDirection] =
    useState<SwipeDirection | null>(null);

  const resetSwipe = () => {
    if (swipeExitDirection !== null) {
      return;
    }

    setSwipeOffset(0);
  };

  const beginSwipeCommit = (direction: SwipeDirection) => {
    if (swipeExitDirection !== null) {
      return;
    }

    onAdvanceStart();
    setSwipeOffset(0);
    setSwipeExitDirection(direction);
  };

  const handleSwipeEnd = (swipeDistance: number) => {
    if (swipeDistance <= -SWIPE_TRIGGER_THRESHOLD) {
      beginSwipeCommit("left");
      return;
    }

    if (swipeDistance >= SWIPE_TRIGGER_THRESHOLD && swipeVoteAmount !== null) {
      beginSwipeCommit("right");
      return;
    }

    resetSwipe();
  };

  const handleSwiperMove = (swiper: SwiperClass) => {
    if (isBusy || !isMobile || swipeExitDirection !== null) {
      return;
    }

    setSwipeOffset(
      Math.max(
        -MAX_SWIPE_OFFSET,
        Math.min(swiper.touches.diff, MAX_SWIPE_OFFSET)
      )
    );
  };

  const handleSwiperTouchEnd = (swiper: SwiperClass) => {
    if (isBusy || !isMobile) {
      resetSwipe();
      return;
    }

    handleSwipeEnd(swiper.touches.diff);
  };

  const handleCardTransitionEnd = (
    event: React.TransitionEvent<HTMLElement>
  ) => {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "transform" ||
      swipeExitDirection === null
    ) {
      return;
    }

    commitSwipeAction(swipeExitDirection, onSkip, onVoteWithSwipe);
  };

  return {
    cardTransform: getCardTransform(isMobile, swipeExitDirection, swipeOffset),
    cardTransitionDuration: getCardTransitionDuration(
      swipeExitDirection,
      swipeOffset
    ),
    handleCardTransitionEnd,
    handleSwiperMove,
    handleSwiperTouchEnd,
    swipeExitDirection,
    swipeOffset,
  };
}

function MemesQuickVotePreviewContent({
  drop,
  isBusy,
  isMobile,
  remainingCount,
  swipeVoteAmount,
  uncastPower,
  votingLabel,
  onAdvanceStart,
  onSkip,
  onVoteWithSwipe,
}: MemesQuickVotePreviewProps) {
  const title =
    drop.metadata.find((entry) => entry.data_key === "title")?.data_value ??
    "Untitled submission";
  const description =
    drop.metadata.find((entry) => entry.data_key === "description")
      ?.data_value ?? "";
  const artworkMedia = drop.parts.at(0)?.media.at(0);
  const authorLabel = drop.author.handle ?? drop.author.primary_address;
  const swipeHint = useMemo(() => {
    if (swipeVoteAmount === null) {
      return null;
    }

    return `${formatNumberWithCommas(swipeVoteAmount)} ${
      votingLabel ?? "votes"
    }`;
  }, [swipeVoteAmount, votingLabel]);
  const swipeInstructionText = swipeHint
    ? `Swipe left to skip, right to vote ${swipeHint}`
    : null;
  const {
    cardTransform,
    cardTransitionDuration,
    handleCardTransitionEnd,
    handleSwiperMove,
    handleSwiperTouchEnd,
    swipeExitDirection,
    swipeOffset,
  } = useQuickVotePreviewSwipe({
    isBusy,
    isMobile,
    onAdvanceStart,
    onSkip,
    onVoteWithSwipe,
    swipeVoteAmount,
  });

  const previewCard = (
    <article
      data-testid="quick-vote-preview-card"
      className={clsx(
        "tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-transition-all tw-duration-200 tw-ease-out",
        isBusy && "tw-pointer-events-none tw-opacity-70"
      )}
      style={{
        transform: cardTransform,
        opacity: swipeExitDirection ? 0 : undefined,
        touchAction: isMobile ? "pan-y" : undefined,
        transitionDuration: cardTransitionDuration,
      }}
      onTransitionEnd={handleCardTransitionEnd}
    >
      <div
        data-testid="quick-vote-preview-mobile-context"
        className="tw-flex tw-h-full tw-flex-col sm:tw-flex sm:tw-min-h-0 sm:tw-flex-1 sm:tw-p-0"
      >
        {artworkMedia ? (
          <div className="tw-relative tw-h-[45vh] tw-shrink-0 tw-overflow-hidden tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/40 sm:tw-flex sm:tw-h-full sm:tw-w-full sm:tw-items-center sm:tw-justify-center sm:tw-border-0">
            <div className="tw-flex tw-h-full tw-items-center tw-justify-center sm:tw-h-full sm:tw-w-full">
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
                isCompetitionDrop={true}
              />
            </div>
            <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-[#0a0a0a] tw-via-transparent tw-to-transparent tw-opacity-60 sm:tw-hidden" />
          </div>
        ) : (
          <div className="tw-flex tw-h-[45vh] tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/30 tw-text-sm tw-text-iron-500 sm:tw-h-full sm:tw-border-0">
            Preview unavailable
          </div>
        )}

        <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-bg-[#0a0a0a]/30 tw-px-6 tw-pt-4 sm:tw-hidden">
          <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-pb-[calc(env(safe-area-inset-bottom,0px)+12rem)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden">
            <div className="tw-flex tw-flex-col tw-gap-4">
              <div className="tw-flex tw-items-center tw-gap-3">
                <WaveDropAuthorPfp drop={drop} />
                <div className="tw-min-w-0 tw-flex-1">
                  <div className="tw-mb-1 tw-flex tw-items-center tw-gap-1.5">
                    <span className="tw-truncate tw-text-md tw-font-bold tw-leading-none tw-text-white">
                      {authorLabel}
                    </span>
                    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-zinc-500 [&>p]:tw-mb-0">
                      <span className="tw-text-xs tw-font-medium tw-leading-none">
                        •
                      </span>
                      <WaveDropTime timestamp={drop.created_at} />
                    </span>
                  </div>
                  <p className="tw-mb-0 tw-truncate tw-text-[9px] tw-font-extrabold tw-uppercase tw-leading-none tw-tracking-[0.15em] tw-text-zinc-500">
                    {drop.wave.name}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="tw-mb-3 tw-mt-4 tw-text-[24px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-white">
                  {title}
                </h2>
                {description && (
                  <p className="tw-mb-0 tw-text-[14px] tw-font-medium tw-leading-relaxed tw-text-zinc-400">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-24 tw-bg-gradient-to-t tw-from-[#0a0a0a] tw-via-[#0a0a0a]/90 tw-to-transparent sm:tw-hidden" />
        </div>
      </div>
    </article>
  );

  return (
    <div className="tw-flex tw-h-full tw-flex-col">
      <div data-testid="quick-vote-preview-status" className="tw-hidden">
        {swipeInstructionText && (
          <span className="tw-sr-only">{swipeInstructionText}</span>
        )}
        {typeof uncastPower === "number" && (
          <span className="tw-sr-only tw-text-primary-300">
            {formatNumberWithCommas(uncastPower)} {votingLabel ?? "votes"} left
          </span>
        )}
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-px-4 tw-py-1.5 tw-text-[13px] tw-font-bold tw-text-zinc-300 tw-shadow-sm tw-backdrop-blur-md">
          {formatNumberWithCommas(remainingCount)} unexplored
        </span>
      </div>

      <div className="tw-relative tw-min-h-0 tw-flex-1">
        {isMobile && (
          <>
            <div
              className={clsx(
                "tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-4 tw-z-10 tw-flex tw-items-center tw-text-sm tw-font-semibold tw-text-rose-300 tw-transition-opacity",
                swipeOffset < 0 ? "tw-opacity-100" : "tw-opacity-0"
              )}
            >
              Skip
            </div>
            <div
              className={clsx(
                "tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-4 tw-z-10 tw-flex tw-items-center tw-text-right tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-opacity",
                swipeOffset > 0 ? "tw-opacity-100" : "tw-opacity-0"
              )}
            >
              {swipeHint ? `Vote ${swipeHint}` : "Vote"}
            </div>
          </>
        )}

        {isMobile ? (
          <Swiper
            initialSlide={MOBILE_SWIPE_CENTER_SLIDE_INDEX}
            slidesPerView={1}
            watchOverflow={false}
            followFinger={false}
            longSwipes={false}
            shortSwipes={false}
            threshold={0}
            allowTouchMove={!isBusy}
            resistanceRatio={0}
            touchStartPreventDefault={false}
            className="tw-h-full tw-overflow-visible"
            onTouchMove={handleSwiperMove}
            onTouchEnd={handleSwiperTouchEnd}
          >
            <SwiperSlide aria-hidden="true" className="tw-h-full">
              <div className="tw-h-px" />
            </SwiperSlide>
            <SwiperSlide className="tw-h-full">{previewCard}</SwiperSlide>
            <SwiperSlide aria-hidden="true" className="tw-h-full">
              <div className="tw-h-px" />
            </SwiperSlide>
          </Swiper>
        ) : (
          previewCard
        )}
      </div>
    </div>
  );
}

export default function MemesQuickVotePreview(
  props: MemesQuickVotePreviewProps
) {
  return <MemesQuickVotePreviewContent key={props.drop.id} {...props} />;
}
