"use client";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import VotingModalButton from "@/components/voting/VotingModalButton";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import WaveDropPartContentMarkdown from "@/components/waves/drops/WaveDropPartContentMarkdown";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import React, {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

interface WaveLeaderboardGridItemViewportProps {
  readonly drop: ExtendedDrop;
  readonly isCompactMode: boolean;
  readonly isContentOnlyMode: boolean;
  readonly showDesktopContentOnlyActions: boolean;
  readonly canOpenDrop: boolean;
  readonly canShowVotingAction: boolean;
  readonly onOpenDrop: () => void;
  readonly onVoteButtonClick: () => void;
}

const getGridViewportClassName = ({
  hasMedia,
  isCompactMode,
}: {
  readonly hasMedia: boolean;
  readonly isCompactMode: boolean;
}): string =>
  isCompactMode || hasMedia
    ? "tw-relative tw-overflow-hidden tw-bg-iron-950"
    : "tw-relative tw-max-h-[20rem] tw-overflow-hidden tw-bg-iron-950";

const getGridContentSpacingClassName = (isCompactMode: boolean): string =>
  isCompactMode ? "tw-space-y-3" : "tw-space-y-1";

const getGridMediaWrapperClassName = (isCompactMode: boolean): string =>
  `tw-relative tw-flex tw-aspect-square tw-min-h-[14rem] tw-items-center tw-justify-center tw-overflow-hidden md:tw-min-h-[15rem] ${
    isCompactMode ? "tw-rounded-lg tw-bg-iron-900" : "tw-bg-iron-950"
  }`;

const getGridTextWrapperClassName = ({
  hasMedia,
  isCompactMode,
}: {
  readonly hasMedia: boolean;
  readonly isCompactMode: boolean;
}): string =>
  `tw-px-3 ${hasMedia ? "tw-pt-2" : "tw-pt-3"} ${
    isCompactMode ? "tw-pb-4" : "tw-pb-3"
  }`;

const getCompactTextViewportClassName = ({
  hasMedia,
  isCompactMode,
}: {
  readonly hasMedia: boolean;
  readonly isCompactMode: boolean;
}): string | undefined => {
  if (!isCompactMode) {
    return undefined;
  }

  if (hasMedia) {
    return "tw-max-h-28 tw-overflow-hidden [&_p]:tw-whitespace-normal";
  }

  return "tw-relative tw-max-h-56 tw-overflow-hidden [&_p]:tw-whitespace-normal";
};

function useOverflowGradient({
  viewportEl,
  innerEl,
}: {
  readonly viewportEl: HTMLElement | null;
  readonly innerEl: HTMLElement | null;
}): boolean {
  const getOverflowSnapshot = useCallback(() => {
    if (!viewportEl || !innerEl) {
      return false;
    }

    return innerEl.scrollHeight > viewportEl.clientHeight + 1;
  }, [innerEl, viewportEl]);

  const subscribeToOverflow = useCallback(
    (onStoreChange: () => void) => {
      if (!viewportEl || !innerEl) {
        return () => {};
      }

      if (typeof ResizeObserver === "undefined") {
        globalThis.addEventListener("resize", onStoreChange);
        return () => {
          globalThis.removeEventListener("resize", onStoreChange);
        };
      }

      const observer = new ResizeObserver(() => {
        onStoreChange();
      });
      observer.observe(viewportEl);
      observer.observe(innerEl);

      return () => {
        observer.disconnect();
      };
    },
    [innerEl, viewportEl]
  );

  return useSyncExternalStore(
    subscribeToOverflow,
    getOverflowSnapshot,
    () => false
  );
}

export const WaveLeaderboardGridItemViewport: React.FC<
  WaveLeaderboardGridItemViewportProps
> = ({
  drop,
  isCompactMode,
  isContentOnlyMode,
  showDesktopContentOnlyActions,
  canOpenDrop,
  canShowVotingAction,
  onOpenDrop,
  onVoteButtonClick,
}) => {
  const activePart = drop.parts[0];
  const primaryMedia = activePart?.media[0];
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const [innerEl, setInnerEl] = useState<HTMLDivElement | null>(null);
  const [compactTextViewportEl, setCompactTextViewportEl] =
    useState<HTMLDivElement | null>(null);
  const [compactTextInnerEl, setCompactTextInnerEl] =
    useState<HTMLDivElement | null>(null);

  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );

  const mediaUrl = primaryMedia?.url ?? null;
  const mediaMimeType = primaryMedia?.mime_type ?? "image/jpeg";
  const mediaPreviewImageUrl = mediaMimeType.includes("image")
    ? null
    : previewImageUrl;
  const hasMedia = mediaUrl !== null && mediaUrl.length > 0;
  const hasTextContent = (activePart?.content ?? "").trim().length > 0;
  const shouldRenderMarkdown = !(isContentOnlyMode && hasMedia);
  const shouldMeasureCompactTextOverflow = isCompactMode && !hasMedia;
  const showCompactMediaReadAction =
    isCompactMode && hasMedia && hasTextContent && shouldRenderMarkdown;
  const showGradient = useOverflowGradient({
    viewportEl,
    innerEl,
  });
  const showCompactTextGradient = useOverflowGradient({
    viewportEl: compactTextViewportEl,
    innerEl: compactTextInnerEl,
  });
  const onReadFullTextClick = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(
    (event) => {
      event.stopPropagation();
      onOpenDrop();
    },
    [onOpenDrop]
  );

  return (
    <div
      ref={setViewportEl}
      className={getGridViewportClassName({ hasMedia, isCompactMode })}
    >
      <div
        ref={setInnerEl}
        className={getGridContentSpacingClassName(isCompactMode)}
      >
        {hasMedia && (
          <div className={getGridMediaWrapperClassName(isCompactMode)}>
            <MediaDisplay
              media_mime_type={mediaMimeType}
              media_url={mediaUrl}
              disableMediaInteraction={true}
              fillVideoContainer={true}
              imageScale={ImageScale.AUTOx450}
              previewImageUrl={mediaPreviewImageUrl}
            />
          </div>
        )}
        {activePart && shouldRenderMarkdown && (
          <div
            className={getGridTextWrapperClassName({
              hasMedia,
              isCompactMode,
            })}
          >
            <div
              ref={
                shouldMeasureCompactTextOverflow
                  ? setCompactTextViewportEl
                  : undefined
              }
              className={getCompactTextViewportClassName({
                hasMedia,
                isCompactMode,
              })}
            >
              <div
                ref={
                  shouldMeasureCompactTextOverflow
                    ? setCompactTextInnerEl
                    : undefined
                }
              >
                <LinkPreviewProvider variant="home">
                  <WaveDropPartContentMarkdown
                    mentionedUsers={drop.mentioned_users}
                    mentionedGroups={drop.mentioned_groups}
                    mentionedWaves={drop.mentioned_waves}
                    referencedNfts={drop.referenced_nfts}
                    part={activePart}
                    wave={drop.wave}
                    drop={drop}
                    onQuoteClick={() => {}}
                  />
                </LinkPreviewProvider>
              </div>
              {shouldMeasureCompactTextOverflow && showCompactTextGradient && (
                <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-14 tw-bg-gradient-to-t tw-from-iron-950 tw-via-iron-950/70 tw-to-transparent" />
              )}
            </div>
            {showCompactMediaReadAction && (
              <button
                type="button"
                onClick={onReadFullTextClick}
                className="desktop-hover:hover:tw-text-primary-200 tw-mt-2 tw-inline-flex tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline-offset-2 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline"
              >
                Read full text
              </button>
            )}
          </div>
        )}
      </div>
      {showGradient && (
        <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-14 tw-bg-gradient-to-t tw-from-iron-900 tw-via-iron-900/90 tw-to-transparent" />
      )}
      {showDesktopContentOnlyActions && (
        <div
          data-testid={`wave-leaderboard-grid-item-content-only-actions-${drop.id}`}
          className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-0 tw-bg-gradient-to-t tw-from-black/90 tw-via-black/65 tw-to-transparent tw-p-2 tw-opacity-0 tw-transition-opacity tw-duration-200 group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100"
        >
          <div className="tw-pointer-events-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
            {canOpenDrop && (
              <div className="tw-flex tw-h-8 tw-items-center">
                <WaveDropActionsOpen drop={drop} />
              </div>
            )}
            {canShowVotingAction && (
              <VotingModalButton
                drop={drop}
                onClick={onVoteButtonClick}
                variant="subtle"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
