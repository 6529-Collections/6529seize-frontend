"use client";

import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import clsx from "clsx";
import React, { useMemo, useRef, useState } from "react";

const SWIPE_TRIGGER_THRESHOLD = 96;
const MAX_SWIPE_OFFSET = 132;

interface MemesQuickVotePreviewProps {
  readonly drop: ExtendedDrop;
  readonly isBusy: boolean;
  readonly isMobile: boolean;
  readonly remainingCount: number;
  readonly swipeVoteAmount: number | null;
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly onSkip: () => void;
  readonly onVoteWithSwipe: () => void;
}

export default function MemesQuickVotePreview({
  drop,
  isBusy,
  isMobile,
  remainingCount,
  swipeVoteAmount,
  uncastPower,
  votingLabel,
  onSkip,
  onVoteWithSwipe,
}: MemesQuickVotePreviewProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

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

  const resetSwipe = () => {
    setSwipeOffset(0);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (isBusy || !isMobile || !event.touches[0]) {
      return;
    }

    touchStartXRef.current = event.touches[0].clientX;
    touchStartYRef.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (
      isBusy ||
      !isMobile ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null ||
      !event.touches[0]
    ) {
      return;
    }

    const deltaX = event.touches[0].clientX - touchStartXRef.current;
    const deltaY = event.touches[0].clientY - touchStartYRef.current;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    setSwipeOffset(
      Math.max(-MAX_SWIPE_OFFSET, Math.min(deltaX, MAX_SWIPE_OFFSET))
    );
  };

  const handleTouchEnd = () => {
    if (isBusy || !isMobile) {
      resetSwipe();
      return;
    }

    if (swipeOffset <= -SWIPE_TRIGGER_THRESHOLD) {
      onSkip();
      resetSwipe();
      return;
    }

    if (swipeOffset >= SWIPE_TRIGGER_THRESHOLD && swipeVoteAmount !== null) {
      onVoteWithSwipe();
      resetSwipe();
      return;
    }

    resetSwipe();
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div
        data-testid="quick-vote-preview-status"
        className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 md:tw-hidden"
      >
        {typeof uncastPower === "number" && (
          <span className="tw-text-primary-200 tw-rounded-full tw-border tw-border-solid tw-border-primary-500/30 tw-bg-primary-500/10 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em]">
            {formatNumberWithCommas(uncastPower)} {votingLabel ?? "votes"} left
          </span>
        )}
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-300">
          {remainingCount} left
        </span>
        {isMobile && (
          <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-400">
            Swipe left to skip{swipeHint ? `, right to vote ${swipeHint}` : ""}
          </span>
        )}
      </div>

      <div className="tw-relative">
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
                "tw-text-primary-200 tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-4 tw-z-10 tw-flex tw-items-center tw-text-right tw-text-sm tw-font-semibold tw-transition-opacity",
                swipeOffset > 0 ? "tw-opacity-100" : "tw-opacity-0"
              )}
            >
              {swipeHint ? `Vote ${swipeHint}` : "Vote"}
            </div>
          </>
        )}

        <article
          data-testid="quick-vote-preview-card"
          className={clsx(
            "tw-relative tw-overflow-hidden tw-rounded-[2rem] tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/95 tw-shadow-[0_24px_60px_rgba(0,0,0,0.35)] tw-transition-transform",
            isBusy && "tw-pointer-events-none tw-opacity-70"
          )}
          style={{
            transform: isMobile ? `translateX(${swipeOffset}px)` : undefined,
            touchAction: isMobile ? "pan-y" : undefined,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={resetSwipe}
        >
          <div className="tw-border-b tw-border-solid tw-border-white/5 tw-p-4 md:tw-hidden">
            <div className="tw-flex tw-items-center tw-gap-3">
              <WaveDropAuthorPfp drop={drop} />
              <div className="tw-min-w-0 tw-flex-1">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
                    {authorLabel}
                  </span>
                  <span className="tw-size-1 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700" />
                  <span className="tw-text-xs tw-text-iron-500">
                    <WaveDropTime timestamp={drop.created_at} />
                  </span>
                </div>
                <p className="tw-mb-0 tw-mt-1 tw-truncate tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                  {drop.wave.name}
                </p>
              </div>
            </div>
          </div>

          <div
            data-testid="quick-vote-preview-mobile-context"
            className="tw-p-4 sm:tw-p-6 md:tw-p-0"
          >
            <div className="md:tw-hidden">
              <h2 className="tw-mb-2 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-white">
                {title}
              </h2>
              {description && (
                <p
                  className="tw-mb-4 tw-text-sm tw-leading-6 tw-text-iron-300"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 3,
                    overflow: "hidden",
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            {artworkMedia ? (
              <div className="tw-overflow-hidden tw-rounded-[1.5rem] tw-bg-iron-950 md:tw-rounded-none">
                <div className="tw-flex tw-h-[min(52vh,28rem)] tw-items-center tw-justify-center tw-bg-iron-950/80 md:tw-h-[min(72vh,44rem)] md:tw-bg-iron-950/85">
                  <DropListItemContentMedia
                    media_mime_type={artworkMedia.mime_type}
                    media_url={artworkMedia.url}
                    isCompetitionDrop={true}
                  />
                </div>
              </div>
            ) : (
              <div className="tw-flex tw-h-64 tw-items-center tw-justify-center tw-rounded-[1.5rem] tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-950 tw-text-sm tw-text-iron-500 md:tw-h-[min(72vh,44rem)] md:tw-rounded-none md:tw-border-0">
                Preview unavailable
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
