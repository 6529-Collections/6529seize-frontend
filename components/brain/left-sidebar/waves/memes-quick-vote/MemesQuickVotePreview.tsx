"use client";

import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import clsx from "clsx";
import { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import MemesQuickVoteDropHeader from "./MemesQuickVoteDropHeader";
import useMemesQuickVotePreviewSwipe from "./useMemesQuickVotePreviewSwipe";

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
    previewCardRef,
    canUseSwiperTouchSurface,
    cardTransform,
    cardTransitionDuration,
    handleCardTransitionEnd,
    handleSwiperMove,
    handleSwiperTouchEnd,
    swipeOffset,
  } = useMemesQuickVotePreviewSwipe({
    isBusy,
    isMobile,
    onAdvanceStart,
    onSkip,
    onVoteWithSwipe,
    swipeVoteAmount,
  });

  const previewCard = (
    <article
      ref={previewCardRef}
      data-testid="quick-vote-preview-card"
      data-quick-vote-transform={cardTransform ?? undefined}
      className={clsx(
        "tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-transition-all tw-duration-200 tw-ease-out",
        isBusy && "tw-pointer-events-none tw-opacity-70"
      )}
      style={{
        transform: cardTransform,
        touchAction: isMobile ? "pan-y" : undefined,
        transitionDuration: cardTransitionDuration,
      }}
      onTransitionEnd={handleCardTransitionEnd}
    >
      <div
        data-testid="quick-vote-preview-mobile-context"
        className="tw-flex tw-h-full tw-flex-col md:tw-flex md:tw-min-h-0 md:tw-flex-1 md:tw-p-0"
      >
        {artworkMedia ? (
          <div className="tw-relative tw-h-[45vh] tw-shrink-0 tw-overflow-hidden tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/40 md:tw-flex md:tw-h-full md:tw-w-full md:tw-items-center md:tw-justify-center md:tw-border-0">
            <div className="tw-flex tw-h-full tw-items-center tw-justify-center md:tw-h-full md:tw-w-full">
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
                isCompetitionDrop={true}
              />
            </div>
            <div
              className={clsx(
                "tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-4 tw-z-10 tw-flex tw-items-center tw-text-sm tw-font-semibold tw-text-rose-300 tw-transition-opacity md:tw-hidden",
                swipeOffset < 0 ? "tw-opacity-100" : "tw-opacity-0"
              )}
            >
              Skip
            </div>
            <div
              className={clsx(
                "tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-4 tw-z-10 tw-flex tw-items-center tw-text-right tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-opacity md:tw-hidden",
                swipeOffset > 0 ? "tw-opacity-100" : "tw-opacity-0"
              )}
            >
              {swipeHint ? `Vote ${swipeHint}` : "Vote"}
            </div>
          </div>
        ) : (
          <div className="tw-flex tw-h-[45vh] tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/30 tw-text-sm tw-text-iron-500 md:tw-h-full md:tw-border-0">
            Preview unavailable
          </div>
        )}

        <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-bg-[#0a0a0a]/30 tw-px-6 tw-pt-4 md:tw-hidden">
          <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-pb-[calc(env(safe-area-inset-bottom,0px)+10.5rem)] [-ms-overflow-style:none] [scrollbar-width:none] sm:tw-pb-[calc(env(safe-area-inset-bottom,0px)+13rem)] [&::-webkit-scrollbar]:tw-hidden">
            <div className="tw-flex tw-flex-col tw-gap-5">
              <MemesQuickVoteDropHeader drop={drop} />

              <div>
                <h2 className="tw-mb-2 tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100/85 md:tw-mb-3 md:tw-mt-4 md:tw-text-2xl">
                  {title}
                </h2>
                {description && (
                  <p className="tw-mb-0 tw-text-sm tw-font-medium tw-leading-relaxed tw-text-iron-500">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
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
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-px-4 tw-py-1.5 tw-text-[13px] tw-font-bold tw-text-iron-300 tw-shadow-sm tw-backdrop-blur-md">
          {formatNumberWithCommas(remainingCount)} unexplored
        </span>
      </div>

      <div className="tw-relative tw-min-h-0 tw-flex-1">
        {canUseSwiperTouchSurface ? (
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
