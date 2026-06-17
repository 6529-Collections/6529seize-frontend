"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import Link from "next/link";
import { memo, useCallback, useEffect, useState } from "react";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropTimestampLayout,
} from "../drop.types";
import { DropLocation, hasDropFooter } from "../drop.types";
import {
  getRankHoverBorderClass,
  getRankStaticBorderClass,
} from "../dropRankStyles";
import DropMinimalIdentityRow from "../DropMinimalIdentityRow";
import WaveDropActions from "../WaveDropActions";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import WaveDropContent from "../WaveDropContent";
import WaveDropHeader from "../WaveDropHeader";
import WaveDropMetadata from "../WaveDropMetadata";
import WaveDropMobileMenu from "../WaveDropMobileMenu";
import WaveDropRatings from "../WaveDropRatings";
import WaveDropReactions from "../WaveDropReactions";
import WaveDropReply from "../WaveDropReply";
import WinnerDropBadge from "./WinnerDropBadge";
import { WaveWinnerIdentity } from "@/components/waves/winners/identity/WaveWinnerIdentity";
import { getWinnerVisibleMetadata } from "@/components/waves/winners/identity/winnerIdentity.helpers";

const getRankHoverClass = (rank: number | null): string => {
  return getRankHoverBorderClass(rank);
};

const getDropStyles = (isActiveDrop: boolean) => {
  if (isActiveDrop) {
    return {
      borderColor: "rgba(60,203,127,0.45)",
      boxShadow:
        "inset 0 0 0 1px rgba(60,203,127,0.2), inset 0 0 24px rgba(60,203,127,0.08)",
    };
  }

  return undefined;
};

interface DefautWinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly footer?: React.ReactNode;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly timestampLayout?: DropTimestampLayout | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly inlineAuthorOnDesktop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const DefaultWinnerDrop = ({
  drop,
  showWaveInfo,
  activeDrop,
  location,
  dropViewDropId,
  onReply,
  onReplyClick,
  onQuoteClick,
  onDropContentClick,
  footer,
  showReplyAndQuote,
  identityMode = "default",
  timestampLayout = "inline",
  showInteractions = true,
  inlineAuthorOnDesktop = false,
  mediaImageScale,
  fullWidthMedia = false,
  fullWidthLinkPreviews = false,
  winningThreshold,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}: DefautWinnerDropProps) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isStorm = drop.parts.length > 1;
  const { canUseDesktopHoverActions, canUseTouchActionSheet } =
    useDropActionInteractionMode();

  const effectiveRank = drop.winning_context?.place ?? drop.rank;

  const decisionTime = drop.winning_context?.decision_time;
  const showIdentity = identityMode !== "hidden";
  const shouldOffsetRows = showIdentity && !inlineAuthorOnDesktop;

  const visibleMetadata = getWinnerVisibleMetadata({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const getBackgroundColorClass = (_loc: DropLocation): string =>
    "tw-bg-iron-950";

  const bgColorClass = isActiveDrop
    ? "tw-bg-[#3CCB7F]/10"
    : getBackgroundColorClass(location);

  const handleLongPress = useCallback(() => {
    if (!showInteractions || !canUseTouchActionSheet) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [canUseTouchActionSheet, showInteractions]);

  useEffect(() => {
    if (canUseTouchActionSheet) {
      return;
    }

    setIsSlideUp(false);
    setLongPressTriggered(false);
  }, [canUseTouchActionSheet]);

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]?.part_id! });
  }, [onReply, drop, activePartIndex]);

  const handleOnAddReaction = useCallback(() => {
    setIsSlideUp(false);
  }, []);
  const identityHeader =
    identityMode === "minimal" ? (
      <DropMinimalIdentityRow drop={drop} timestampLayout={timestampLayout} />
    ) : (
      <WaveDropHeader
        drop={drop}
        showWaveInfo={false}
        isStorm={isStorm}
        currentPartIndex={activePartIndex}
        partsCount={drop.parts.length}
        badge={
          <WinnerDropBadge
            rank={effectiveRank}
            decisionTime={decisionTime ?? null}
          />
        }
        timestampLayout={timestampLayout}
      />
    );

  return (
    <div
      className={`tw-w-full ${
        location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
      }`}
    >
      <div
        className={`tw-group tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid ${getRankStaticBorderClass(
          effectiveRank
        )} tw-px-4 tw-py-3 ${bgColorClass} ${getRankHoverClass(effectiveRank)}`}
        style={{
          ...getDropStyles(isActiveDrop),
          transition: "box-shadow 0.2s ease, background-color 0.2s ease",
        }}
      >
        {drop.reply_to && drop.reply_to.drop_id !== dropViewDropId && (
          <WaveDropReply
            onReplyClick={onReplyClick}
            dropId={drop.reply_to.drop_id}
            dropPartId={drop.reply_to.drop_part_id}
            maybeDrop={
              drop.reply_to.drop
                ? { ...drop.reply_to.drop, wave: drop.wave }
                : null
            }
          />
        )}

        <div
          className={`tw-relative tw-z-10 tw-flex tw-w-full tw-border-0 tw-bg-transparent tw-text-left ${
            inlineAuthorOnDesktop ? "tw-flex-col tw-gap-y-2" : "tw-gap-x-3"
          }`}
        >
          {inlineAuthorOnDesktop
            ? showIdentity && (
                <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2">
                  <WaveDropAuthorPfp drop={drop} />
                  <div className="tw-min-w-0 tw-flex-1">{identityHeader}</div>
                </div>
              )
            : showIdentity && <WaveDropAuthorPfp drop={drop} />}
          <div className="tw-flex tw-w-full tw-flex-col">
            <div className="tw-flex tw-flex-col tw-items-start">
              {showIdentity && !inlineAuthorOnDesktop && identityHeader}
              {identityMode === "default" &&
                showWaveInfo &&
                (() => {
                  const waveDetails = drop.wave as unknown as {
                    chat?:
                      | {
                          scope?:
                            | {
                                group?:
                                  | {
                                      is_direct_message?: boolean | undefined;
                                    }
                                  | undefined;
                              }
                            | undefined;
                        }
                      | undefined;
                  };
                  const isDirectMessage =
                    waveDetails.chat?.scope?.group?.is_direct_message ?? false;
                  const waveHref = getWaveRoute({
                    waveId: drop.wave.id,
                    isDirectMessage,
                    isApp: false,
                  });
                  return (
                    <Link
                      href={waveHref}
                      onClick={(e) => e.stopPropagation()}
                      className="tw-mt-0.5 tw-text-xs tw-leading-none tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
                    >
                      {drop.wave.name}
                    </Link>
                  );
                })()}
            </div>
            <div className={showIdentity ? "tw-mt-2" : ""}>
              <WaveDropContent
                drop={drop}
                activePartIndex={activePartIndex}
                setActivePartIndex={setActivePartIndex}
                onDropContentClick={onDropContentClick}
                onQuoteClick={onQuoteClick}
                onLongPress={handleLongPress}
                setLongPressTriggered={setLongPressTriggered}
                isCompetitionDrop={true}
                mediaImageScale={mediaImageScale}
                fullWidthMedia={fullWidthMedia}
                fullWidthLinkPreviews={fullWidthLinkPreviews}
                hasTouch={showInteractions && canUseTouchActionSheet}
                embedPath={embedPath}
                quotePath={quotePath}
                embedDepth={embedDepth}
                maxEmbedDepth={maxEmbedDepth}
              />
            </div>
          </div>
        </div>
        {canUseDesktopHoverActions && showInteractions && showReplyAndQuote && (
          <div className="tw-absolute tw-right-0 tw-top-1">
            <WaveDropActions
              drop={drop}
              activePartIndex={activePartIndex}
              onReply={handleOnReply}
            />
          </div>
        )}
        <div
          className={`${shouldOffsetRows ? "tw-ml-[3.25rem]" : ""} tw-flex tw-flex-col tw-gap-2`}
        >
          <WaveWinnerIdentity drop={drop} variant="full" cardVariant="chat" />
          {visibleMetadata.length > 0 && (
            <WaveDropMetadata metadata={visibleMetadata} />
          )}
          {showInteractions && (
            <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
              {!!drop.raters_count && (
                <WaveDropRatings
                  drop={drop}
                  winningThreshold={winningThreshold}
                />
              )}
              <WaveDropReactions drop={drop} />
            </div>
          )}
        </div>
        {hasDropFooter(footer) && (
          <div
            className={`${shouldOffsetRows ? "tw-ml-[3.25rem]" : ""} tw-pb-1 tw-pt-2`}
          >
            {footer}
          </div>
        )}
      </div>
      {showInteractions && (
        <WaveDropMobileMenu
          drop={drop}
          isOpen={isSlideUp && canUseTouchActionSheet}
          longPressTriggered={longPressTriggered}
          showReplyAndQuote={showReplyAndQuote}
          setOpen={setIsSlideUp}
          onReply={handleOnReply}
          onAddReaction={handleOnAddReaction}
        />
      )}
    </div>
  );
};

export default memo(DefaultWinnerDrop);
