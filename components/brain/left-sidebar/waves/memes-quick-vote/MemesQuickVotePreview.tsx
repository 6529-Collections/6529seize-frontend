"use client";

import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import {
  getDropPreviewImageUrl,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  formatMemesQuickVoteLeftThisRoundText,
  formatMemesQuickVoteUnratedText,
} from "@/hooks/memesQuickVote.helpers";
import { formatInteger, formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { ReactNode, TouchEventHandler } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import MemesQuickVoteDescription from "./MemesQuickVoteDescription";
import useMemesQuickVotePreviewSwipe from "./useMemesQuickVotePreviewSwipe";
import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";

const MOBILE_SWIPE_CENTER_SLIDE_INDEX = 1;

interface MemesQuickVotePreviewProps {
  readonly drop: ExtendedDrop;
  readonly isBusy: boolean;
  readonly isMobile: boolean;
  readonly leftThisRoundCount: number;
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
}: {
  readonly artworkMedia:
    | ExtendedDrop["parts"][number]["media"][number]
    | undefined;
  readonly hasTouchScreen: boolean;
  readonly htmlPreviewImageUrl?: string | undefined;
}): ReactNode {
  if (!artworkMedia) {
    return null;
  }

  const isVideoArtwork = artworkMedia.mime_type
    .toLowerCase()
    .includes("video");

  return (
    <DropListItemContentMedia
      media_mime_type={artworkMedia.mime_type}
      media_url={artworkMedia.url}
      isCompetitionDrop={true}
      disableAutoPlay={hasTouchScreen && !isVideoArtwork}
      allowAutoPlayInApp={isVideoArtwork}
      disableModal={hasTouchScreen}
      htmlPreviewImageUrl={htmlPreviewImageUrl}
      loadStrategy={isVideoArtwork ? "eager" : "in-view"}
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
      className="tw-relative tw-flex tw-min-h-0 tw-flex-[2_1_0%] tw-flex-col tw-overflow-hidden md:tw-hidden"
      style={{ touchAction: "pan-y" }}
      onTouchStart={touchSurfaceProps.onTouchStart}
      onTouchMove={touchSurfaceProps.onTouchMove}
      onTouchEnd={touchSurfaceProps.onTouchEnd}
      onTouchCancel={touchSurfaceProps.onTouchCancel}
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-px-6 tw-pb-3 tw-pt-2">
        <div className="tw-flex tw-min-w-0 tw-shrink-0 tw-items-center tw-gap-2.5">
          <WaveDropAuthorPfp drop={drop} />
          <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-semibold tw-text-iron-200">
            {drop.author.handle ?? drop.author.primary_address}
          </span>
          <span aria-hidden="true" className="tw-text-iron-500">
            ·
          </span>
          <WaveDropTime timestamp={drop.created_at} color="iron-400" />
          <span className="tw-sr-only">{drop.wave.name}</span>
        </div>

        <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-2.5 tw-pt-3">
          <h2 className="tw-m-0 tw-line-clamp-2 tw-shrink-0 tw-break-words tw-text-[1.25rem] tw-font-bold tw-leading-[1.1] tw-tracking-tight tw-text-white">
            {title}
          </h2>

          {description && (
            <MemesQuickVoteDescription
              allowToggle={allowDescriptionToggle}
              constrainHeight={true}
              key={drop.id}
              description={description}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MemesQuickVoteMediaStage({
  hasTouchScreen,
  isMobile,
  mediaContent,
  swipeOffset,
  touchSurfaceProps,
}: {
  readonly hasTouchScreen: boolean;
  readonly isMobile: boolean;
  readonly mediaContent: ReactNode;
  readonly swipeOffset: number;
  readonly touchSurfaceProps: MemesQuickVoteTouchSurfaceProps;
}) {
  const locale = useBrowserLocale();

  if (mediaContent === null) {
    return (
      <div className="tw-flex tw-min-h-0 tw-w-full tw-flex-[3_1_0%] tw-items-center tw-justify-center tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/30 tw-text-sm tw-text-iron-500 md:tw-h-full md:tw-border-0">
        {t(locale, "memes.quickVote.previewUnavailable")}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "tw-relative tw-overflow-hidden tw-bg-black/40",
        isMobile
          ? "tw-max-h-[45dvh] tw-min-h-0 tw-flex-[3_1_0%] tw-border-b tw-border-solid tw-border-white/5"
          : "md:tw-flex md:tw-h-full md:tw-w-full md:tw-items-center md:tw-justify-center md:tw-border-0"
      )}
    >
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center md:tw-h-full md:tw-w-full">
        {mediaContent}
      </div>

      {isMobile &&
        hasTouchScreen &&
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

      {isMobile && hasTouchScreen && (
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-inset-y-0 tw-z-10 tw-flex tw-items-center tw-justify-between md:tw-hidden"
        >
          <div
            className={clsx(
              "tw-flex tw-h-24 tw-w-10 tw-items-center tw-justify-start tw-bg-gradient-to-r tw-from-black/45 tw-to-transparent tw-pl-2 tw-transition-opacity",
              swipeOffset < 0 ? "tw-opacity-100" : "tw-opacity-65"
            )}
          >
            <ChevronLeftIcon
              className={clsx(
                "tw-size-6 tw-shrink-0 tw-drop-shadow",
                swipeOffset < 0 ? "tw-text-white" : "tw-text-white/75"
              )}
            />
          </div>
          <div
            className={clsx(
              "tw-flex tw-h-24 tw-w-10 tw-items-center tw-justify-end tw-bg-gradient-to-l tw-from-black/45 tw-to-transparent tw-pr-2 tw-transition-opacity",
              swipeOffset > 0 ? "tw-opacity-100" : "tw-opacity-65"
            )}
          >
            <ChevronRightIcon
              className={clsx(
                "tw-size-6 tw-shrink-0 tw-drop-shadow",
                swipeOffset > 0 ? "tw-text-white" : "tw-text-white/75"
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MemesQuickVotePreviewContent({
  drop,
  isBusy,
  isMobile,
  leftThisRoundCount,
  swipeVoteAmount,
  uncastPower,
  unratedCount,
  votingLabel,
  onAdvanceStart,
  onSkip,
  onVoteWithSwipe,
}: MemesQuickVotePreviewProps) {
  const locale = useBrowserLocale();
  const title =
    drop.metadata.find((entry) => entry.data_key === "title")?.data_value ??
    t(locale, "memes.quickVote.untitledSubmission");
  const description =
    drop.metadata.find((entry) => entry.data_key === "description")
      ?.data_value ?? "";
  const artworkMedia = drop.parts.at(0)?.media.at(0);
  const { hasTouchScreen } = useDeviceInfo();
  const isInteractiveHtmlMedia = artworkMedia?.mime_type === "text/html";
  const previewImageUrl = getDropPreviewImageUrl(drop.metadata) ?? undefined;
  const htmlPreviewImageUrl =
    isInteractiveHtmlMedia && hasTouchScreen ? previewImageUrl : undefined;
  const swipeInstructionText =
    swipeVoteAmount === null
      ? null
      : t(locale, "memes.quickVote.swipeHint", {
          amount: formatNumber(locale, swipeVoteAmount, {
            maximumFractionDigits: 0,
            signDisplay: "exceptZero",
          }),
          unit: votingLabel ?? t(locale, "memes.quickVote.unit"),
        });
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
        <MemesQuickVoteMediaStage
          hasTouchScreen={hasTouchScreen}
          isMobile={isMobile}
          mediaContent={mediaContent}
          swipeOffset={swipeOffset}
          touchSurfaceProps={mobileTouchSurfaceProps}
        />

        <MemesQuickVoteMobileDetails
          allowDescriptionToggle={true}
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
      <div data-testid="quick-vote-preview-status" className="tw-sr-only">
        {isMobile && hasTouchScreen && swipeInstructionText && (
          <span className="tw-sr-only">{swipeInstructionText}</span>
        )}
        {typeof uncastPower === "number" && (
          <span className="tw-sr-only tw-text-primary-300">
            {t(locale, "memes.quickVote.powerLeft", {
              amount: formatInteger(locale, uncastPower),
              unit: votingLabel ?? t(locale, "memes.quickVote.unit"),
            })}
          </span>
        )}
        <span className="tw-sr-only">
          {formatMemesQuickVoteLeftThisRoundText(leftThisRoundCount, locale)}
        </span>
        <span className="tw-sr-only">
          {formatMemesQuickVoteUnratedText(unratedCount, locale)}
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
            className="tw-h-full tw-overflow-visible [&>.swiper-wrapper>.swiper-slide]:[scale:1]"
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
  return (
    <ContentModerationDropGate drop={props.drop}>
      <MemesQuickVotePreviewContent {...props} />
    </ContentModerationDropGate>
  );
}
