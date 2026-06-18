"use client";

import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import type { MediaLoadStrategy } from "@/components/drops/view/item/content/media/mediaLoadStrategy";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  getDropPreviewImageUrl,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  formatMemesQuickVoteLeftThisRoundText,
  formatMemesQuickVoteUnratedText,
} from "@/hooks/memesQuickVote.helpers";
import clsx from "clsx";
import type { ReactNode, TouchEventHandler } from "react";
import { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import MemesQuickVoteDescription from "./MemesQuickVoteDescription";
import MemesQuickVoteDropHeader from "./MemesQuickVoteDropHeader";
import useMemesQuickVotePreviewSwipe from "./useMemesQuickVotePreviewSwipe";

const MOBILE_SWIPE_CENTER_SLIDE_INDEX = 1;

interface MemesQuickVotePreviewProps {
  readonly drop: ExtendedDrop;
  readonly isBusy: boolean;
  readonly isMobile: boolean;
  readonly leftThisRoundCount: number;
  readonly renderMode: "active" | "preloaded";
  readonly swipeVoteAmount: number | null;
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
  readonly onAdvanceStart: () => void;
  readonly onSkip: () => void;
  readonly onVoteWithSwipe: () => void;
}

interface MemesQuickVoteTouchSurfaceProps {
  readonly onTouchCancel: TouchEventHandler<HTMLDivElement>;
  readonly onTouchEnd: TouchEventHandler<HTMLDivElement>;
  readonly onTouchMove: TouchEventHandler<HTMLDivElement>;
  readonly onTouchStart: TouchEventHandler<HTMLDivElement>;
}

function getQuickVoteArtworkMediaContent({
  artworkMedia,
  hasTouchScreen,
  htmlPreviewImageUrl,
  loadStrategy,
}: {
  readonly artworkMedia:
    | ExtendedDrop["parts"][number]["media"][number]
    | undefined;
  readonly hasTouchScreen: boolean;
  readonly htmlPreviewImageUrl?: string | undefined;
  readonly loadStrategy: MediaLoadStrategy;
}): ReactNode {
  if (!artworkMedia) {
    return null;
  }

  return (
    <DropListItemContentMedia
      media_mime_type={artworkMedia.mime_type}
      media_url={artworkMedia.url}
      isCompetitionDrop={true}
      disableAutoPlay={hasTouchScreen || loadStrategy === "eager"}
      disableModal={hasTouchScreen}
      htmlPreviewImageUrl={htmlPreviewImageUrl}
      loadStrategy={loadStrategy}
      videoAlign="center"
    />
  );
}

function MemesQuickVoteMobileSwipeSurface({
  className,
  touchSurfaceProps,
}: {
  readonly className: string;
  readonly touchSurfaceProps: MemesQuickVoteTouchSurfaceProps;
}) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ touchAction: "pan-y" }}
      onTouchStart={touchSurfaceProps.onTouchStart}
      onTouchMove={touchSurfaceProps.onTouchMove}
      onTouchEnd={touchSurfaceProps.onTouchEnd}
      onTouchCancel={touchSurfaceProps.onTouchCancel}
    />
  );
}

function MemesQuickVoteMobileDetails({
  allowDescriptionToggle,
  description,
  drop,
  title,
  touchSurfaceProps,
}: {
  readonly allowDescriptionToggle: boolean;
  readonly description: string;
  readonly drop: ExtendedDrop;
  readonly title: string;
  readonly touchSurfaceProps: MemesQuickVoteTouchSurfaceProps;
}) {
  return (
    <div
      className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-bg-[#0d0d0e] md:tw-hidden"
      style={{ touchAction: "pan-y" }}
      onTouchStart={touchSurfaceProps.onTouchStart}
      onTouchMove={touchSurfaceProps.onTouchMove}
      onTouchEnd={touchSurfaceProps.onTouchEnd}
      onTouchCancel={touchSurfaceProps.onTouchCancel}
    >
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-px-6 tw-pb-5 tw-pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden">
        <div className="tw-flex tw-flex-col tw-gap-4">
          <MemesQuickVoteDropHeader drop={drop} />

          <div className="tw-space-y-3">
            <h2 className="tw-mb-0 tw-text-[1.15rem] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-white">
              {title}
            </h2>

            {description && (
              <MemesQuickVoteDescription
                allowToggle={allowDescriptionToggle}
                key={drop.id}
                description={description}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemesQuickVoteMediaStage({
  isInteractive,
  isMobile,
  mediaContent,
  swipeHint,
  swipeOffset,
  touchSurfaceProps,
}: {
  readonly isInteractive: boolean;
  readonly isMobile: boolean;
  readonly mediaContent: ReactNode;
  readonly swipeHint: string | null;
  readonly swipeOffset: number;
  readonly touchSurfaceProps: MemesQuickVoteTouchSurfaceProps;
}) {
  if (mediaContent === null) {
    return (
      <div className="tw-flex tw-h-[45vh] tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/30 tw-text-sm tw-text-iron-500 md:tw-h-full md:tw-border-0">
        Preview unavailable
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "tw-relative tw-shrink-0 tw-overflow-hidden tw-bg-black/40",
        isMobile
          ? "tw-h-[45vh] tw-border-b tw-border-solid tw-border-white/5"
          : "md:tw-flex md:tw-h-full md:tw-w-full md:tw-items-center md:tw-justify-center md:tw-border-0"
      )}
    >
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center md:tw-h-full md:tw-w-full">
        {mediaContent}
      </div>

      {isInteractive &&
        isMobile &&
        (["left", "right"] as const).map((side) => (
          <MemesQuickVoteMobileSwipeSurface
            key={side}
            className={clsx(
              "tw-absolute tw-inset-y-0 tw-z-20 tw-w-12 md:tw-hidden",
              side === "left" ? "tw-left-0" : "tw-right-0"
            )}
            touchSurfaceProps={touchSurfaceProps}
          />
        ))}

      {isInteractive && (
        <>
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
        </>
      )}
    </div>
  );
}

function MemesQuickVotePreviewContent({
  drop,
  isBusy,
  isMobile,
  leftThisRoundCount,
  renderMode,
  swipeVoteAmount,
  uncastPower,
  unratedCount,
  votingLabel,
  onAdvanceStart,
  onSkip,
  onVoteWithSwipe,
}: MemesQuickVotePreviewProps) {
  const isInteractive = renderMode === "active";
  const loadStrategy: MediaLoadStrategy =
    renderMode === "preloaded" ? "eager" : "in-view";
  const title =
    drop.metadata.find((entry) => entry.data_key === "title")?.data_value ??
    "Untitled submission";
  const description =
    drop.metadata.find((entry) => entry.data_key === "description")
      ?.data_value ?? "";
  const artworkMedia = drop.parts.at(0)?.media.at(0);
  const { hasTouchScreen } = useDeviceInfo();
  const isInteractiveHtmlMedia = artworkMedia?.mime_type === "text/html";
  const previewImageUrl = getDropPreviewImageUrl(drop.metadata) ?? undefined;
  const htmlPreviewImageUrl =
    isInteractiveHtmlMedia && (hasTouchScreen || renderMode === "preloaded")
      ? previewImageUrl
      : undefined;
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
    handleTouchSurfaceCancel,
    handleTouchSurfaceEnd,
    handleTouchSurfaceMove,
    handleTouchSurfaceStart,
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

  const mediaContent = getQuickVoteArtworkMediaContent({
    artworkMedia,
    hasTouchScreen,
    htmlPreviewImageUrl,
    loadStrategy,
  });
  const mobileTouchSurfaceProps: MemesQuickVoteTouchSurfaceProps = {
    onTouchCancel: (event) => {
      handleTouchSurfaceCancel(event);
    },
    onTouchEnd: (event) => {
      handleTouchSurfaceEnd(event);
    },
    onTouchMove: (event) => {
      handleTouchSurfaceMove(event);
    },
    onTouchStart: (event) => {
      handleTouchSurfaceStart(event);
    },
  };

  const previewCard = (
    <article
      ref={previewCardRef}
      data-testid={
        renderMode === "active"
          ? "quick-vote-preview-card"
          : "quick-vote-preview-card-preloaded"
      }
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
        data-testid={
          renderMode === "active"
            ? "quick-vote-preview-mobile-context"
            : "quick-vote-preview-mobile-context-preloaded"
        }
        className="tw-flex tw-h-full tw-flex-col md:tw-flex md:tw-min-h-0 md:tw-flex-1 md:tw-p-0"
      >
        <MemesQuickVoteMediaStage
          isInteractive={isInteractive}
          isMobile={isMobile}
          mediaContent={mediaContent}
          swipeHint={swipeHint}
          swipeOffset={swipeOffset}
          touchSurfaceProps={mobileTouchSurfaceProps}
        />

        <MemesQuickVoteMobileDetails
          allowDescriptionToggle={isInteractive}
          description={description}
          drop={drop}
          title={title}
          touchSurfaceProps={mobileTouchSurfaceProps}
        />
      </div>
    </article>
  );

  return (
    <div className="tw-flex tw-h-full tw-flex-col">
      <div
        data-testid={
          renderMode === "active"
            ? "quick-vote-preview-status"
            : "quick-vote-preview-status-preloaded"
        }
        className="tw-sr-only"
      >
        {isInteractive && swipeInstructionText && (
          <span className="tw-sr-only">{swipeInstructionText}</span>
        )}
        {isInteractive && typeof uncastPower === "number" && (
          <span className="tw-sr-only tw-text-primary-300">
            {formatNumberWithCommas(uncastPower)} {votingLabel ?? "votes"} left
          </span>
        )}
        {isInteractive && (
          <>
            <span className="tw-sr-only">
              {formatMemesQuickVoteLeftThisRoundText(leftThisRoundCount)}
            </span>
            <span className="tw-sr-only">
              {formatMemesQuickVoteUnratedText(unratedCount)}
            </span>
          </>
        )}
      </div>

      <div className="tw-relative tw-min-h-0 tw-flex-1">
        {isInteractive && canUseSwiperTouchSurface ? (
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
  return <MemesQuickVotePreviewContent {...props} />;
}
