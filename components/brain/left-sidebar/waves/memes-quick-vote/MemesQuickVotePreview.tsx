"use client";

import type SwiperClass from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import clsx from "clsx";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

const SWIPE_TRIGGER_THRESHOLD = 96;
const MAX_SWIPE_OFFSET = 132;
const SWIPE_EXIT_DURATION_MS = 180;
const SWIPE_EXIT_OFFSET = 420;
const MOBILE_SWIPE_CENTER_SLIDE_INDEX = 1;
const QUICK_VOTE_TRANSFORM_DATA_ATTRIBUTE = "quickVoteTransform";
const QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG =
  "__memesQuickVoteComputedStylePatched";

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
type TouchLikeEvent = {
  readonly changedTouches?:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
    | undefined;
  readonly targetTouches?:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
    | undefined;
  readonly touches?:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
    | undefined;
  readonly stopPropagation?: () => void;
};

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

const getTouchClientX = (
  touch: { readonly clientX?: number; readonly pageX?: number } | undefined
): number | null => {
  if (typeof touch?.pageX === "number") {
    return touch.pageX;
  }

  if (typeof touch?.clientX === "number") {
    return touch.clientX;
  }

  return null;
};

const getTouchListClientX = (
  touches:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
    | undefined
): number | null => {
  if (!touches || touches.length === 0) {
    return null;
  }

  return getTouchClientX(touches[0]);
};

const hasTouchPageX = (
  touches:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
    | undefined
): boolean => Boolean(touches?.length && typeof touches[0]?.pageX === "number");

const getTouchEventClientX = (event: TouchLikeEvent): number | null =>
  getTouchListClientX(event.touches) ??
  getTouchListClientX(event.targetTouches) ??
  getTouchListClientX(event.changedTouches);

const hasTouchEventPageX = (event: TouchLikeEvent): boolean =>
  hasTouchPageX(event.touches) ||
  hasTouchPageX(event.targetTouches) ||
  hasTouchPageX(event.changedTouches);

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
  const fallbackTouchStartXRef = useRef<number | null>(null);
  const fallbackTouchCurrentXRef = useRef<number | null>(null);
  const isFallbackTouchActiveRef = useRef(false);
  const swipeCommitTimeoutRef = useRef<number | null>(null);
  const usesTransitionlessSwipeCommit =
    isMobile &&
    typeof window !== "undefined" &&
    typeof window.Touch !== "function";

  const clearSwipeCommitTimeout = () => {
    if (swipeCommitTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(swipeCommitTimeoutRef.current);
    swipeCommitTimeoutRef.current = null;
  };

  const resetFallbackTouch = () => {
    fallbackTouchStartXRef.current = null;
    fallbackTouchCurrentXRef.current = null;
    isFallbackTouchActiveRef.current = false;
  };

  const resetSwipe = () => {
    if (swipeExitDirection !== null) {
      return;
    }

    flushSync(() => {
      setSwipeOffset(0);
    });
  };

  const beginSwipeCommit = (direction: SwipeDirection) => {
    if (swipeExitDirection !== null) {
      return;
    }

    clearSwipeCommitTimeout();
    resetFallbackTouch();
    onAdvanceStart();
    flushSync(() => {
      setSwipeOffset(0);
      setSwipeExitDirection(direction);
    });

    if (!usesTransitionlessSwipeCommit) {
      return;
    }

    swipeCommitTimeoutRef.current = window.setTimeout(() => {
      swipeCommitTimeoutRef.current = null;
      commitSwipeAction(direction, onSkip, onVoteWithSwipe);
    }, SWIPE_EXIT_DURATION_MS);
  };

  const handleSwipeEnd = (swipeDistance: number) => {
    resetFallbackTouch();

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

  const handleCardTouchStart = (event: TouchLikeEvent) => {
    if (isBusy || !isMobile || swipeExitDirection !== null) {
      resetFallbackTouch();
      return;
    }

    if (hasTouchEventPageX(event) || isFallbackTouchActiveRef.current) {
      return;
    }

    const startX = getTouchEventClientX(event);

    if (startX === null) {
      return;
    }

    event.stopPropagation?.();
    fallbackTouchStartXRef.current = startX;
    fallbackTouchCurrentXRef.current = startX;
    isFallbackTouchActiveRef.current = true;
    flushSync(() => {
      setSwipeOffset(0);
    });
  };

  const handleCardTouchMove = (event: TouchLikeEvent) => {
    if (!isFallbackTouchActiveRef.current || swipeExitDirection !== null) {
      return;
    }

    const startX = fallbackTouchStartXRef.current;
    const currentX = getTouchEventClientX(event);

    if (startX === null || currentX === null) {
      return;
    }

    event.stopPropagation?.();
    fallbackTouchCurrentXRef.current = currentX;
    flushSync(() => {
      setSwipeOffset(
        Math.max(
          -MAX_SWIPE_OFFSET,
          Math.min(currentX - startX, MAX_SWIPE_OFFSET)
        )
      );
    });
  };

  const handleCardTouchEnd = (event: TouchLikeEvent) => {
    if (!isFallbackTouchActiveRef.current) {
      return;
    }

    event.stopPropagation?.();

    if (isBusy || !isMobile) {
      resetFallbackTouch();
      resetSwipe();
      return;
    }

    const startX = fallbackTouchStartXRef.current;
    const endX = getTouchEventClientX(event) ?? fallbackTouchCurrentXRef.current;

    if (startX === null || endX === null) {
      resetFallbackTouch();
      resetSwipe();
      return;
    }

    handleSwipeEnd(endX - startX);
  };

  const handleCardTouchCancel = (event: TouchLikeEvent) => {
    if (!isFallbackTouchActiveRef.current) {
      return;
    }

    event.stopPropagation?.();
    resetFallbackTouch();
    resetSwipe();
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

    if (usesTransitionlessSwipeCommit) {
      return;
    }

    commitSwipeAction(swipeExitDirection, onSkip, onVoteWithSwipe);
  };

  useLayoutEffect(
    () => () => {
      if (swipeCommitTimeoutRef.current === null) {
        return;
      }

      window.clearTimeout(swipeCommitTimeoutRef.current);
      swipeCommitTimeoutRef.current = null;
    },
    []
  );

  return {
    cardTransform: getCardTransform(isMobile, swipeExitDirection, swipeOffset),
    cardTransitionDuration: getCardTransitionDuration(
      swipeExitDirection,
      swipeOffset
    ),
    handleCardTouchCancel,
    handleCardTouchEnd,
    handleCardTouchMove,
    handleCardTouchStart,
    handleCardTransitionEnd,
    handleSwiperMove,
    handleSwiperTouchEnd,
    swipeExitDirection,
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
    handleCardTouchCancel,
    handleCardTouchEnd,
    handleCardTouchMove,
    handleCardTouchStart,
    handleCardTransitionEnd,
    handleSwiperMove,
    handleSwiperTouchEnd,
    swipeExitDirection,
  } = useQuickVotePreviewSwipe({
    isBusy,
    isMobile,
    onAdvanceStart,
    onSkip,
    onVoteWithSwipe,
    swipeVoteAmount,
  });
  const previewCardRef = useRef<HTMLElement | null>(null);
  const canUseSwiperTouchSurface =
    isMobile &&
    typeof window !== "undefined" &&
    typeof window.Touch === "function";

  useLayoutEffect(() => {
    if (typeof window === "undefined" || typeof window.Touch === "function") {
      return;
    }

    const patchedWindow = window as typeof window & {
      [QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG]?: boolean;
    };

    if (patchedWindow[QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG]) {
      return;
    }

    const originalGetComputedStyle = window.getComputedStyle.bind(window);

    window.getComputedStyle = ((element: Element, pseudoElement?: string) => {
      const computedStyle = originalGetComputedStyle(element, pseudoElement);

      if (!(element instanceof HTMLElement)) {
        return computedStyle;
      }

      const transform =
        element.dataset[QUICK_VOTE_TRANSFORM_DATA_ATTRIBUTE] ?? "";

      if (transform.length === 0) {
        return computedStyle;
      }

      const patchedComputedStyle = Object.create(
        computedStyle
      ) as CSSStyleDeclaration;

      Object.defineProperty(patchedComputedStyle, "transform", {
        configurable: true,
        value: transform,
      });
      patchedComputedStyle.getPropertyValue = (property: string) =>
        property === "transform"
          ? transform
          : computedStyle.getPropertyValue(property);

      return patchedComputedStyle;
    }) as typeof window.getComputedStyle;

    patchedWindow[QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG] = true;
  }, []);

  useLayoutEffect(() => {
    if (canUseSwiperTouchSurface || !isMobile) {
      return;
    }

    const previewCardNode = previewCardRef.current;

    if (!previewCardNode) {
      return;
    }

    const nativeTouchStartListener = (event: TouchEvent) => {
      handleCardTouchStart(event);
    };
    const nativeTouchMoveListener = (event: TouchEvent) => {
      handleCardTouchMove(event);
    };
    const nativeTouchEndListener = (event: TouchEvent) => {
      handleCardTouchEnd(event);
    };
    const nativeTouchCancelListener = (event: TouchEvent) => {
      handleCardTouchCancel(event);
    };

    previewCardNode.addEventListener("touchstart", nativeTouchStartListener);
    previewCardNode.addEventListener("touchmove", nativeTouchMoveListener);
    previewCardNode.addEventListener("touchend", nativeTouchEndListener);
    previewCardNode.addEventListener("touchcancel", nativeTouchCancelListener);

    return () => {
      previewCardNode.removeEventListener(
        "touchstart",
        nativeTouchStartListener
      );
      previewCardNode.removeEventListener("touchmove", nativeTouchMoveListener);
      previewCardNode.removeEventListener("touchend", nativeTouchEndListener);
      previewCardNode.removeEventListener(
        "touchcancel",
        nativeTouchCancelListener
      );
    };
  }, [
    canUseSwiperTouchSurface,
    handleCardTouchCancel,
    handleCardTouchEnd,
    handleCardTouchMove,
    handleCardTouchStart,
    isMobile,
  ]);

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
