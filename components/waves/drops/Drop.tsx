"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type {
  Drop as DropType,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ImageScale } from "@/helpers/image.helpers";
import { useMemo } from "react";
import DropContext from "./DropContext";
import { DropLocation } from "./drop.types";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropTimestampLayout,
} from "./drop.types";
import ParticipationDrop from "./participation/ParticipationDrop";
import WaveDrop from "./WaveDrop";
import WinnerDrop from "./winner/WinnerDrop";
export type { DropInteractionParams } from "./drop.types";
export { DropLocation } from "./drop.types";

interface DropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: DropType | null;
  readonly nextDrop: DropType | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null> | undefined;
  readonly wrapContentOnly?: (content: React.ReactNode) => React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly timestampLayout?: DropTimestampLayout | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly inlineAuthorOnDesktop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly showVideoFullscreen?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

export default function Drop({
  drop,
  previousDrop,
  nextDrop,
  showWaveInfo,
  activeDrop,
  location,
  dropViewDropId,
  onReply,
  onReplyClick,
  onQuoteClick,
  onDropContentClick,
  showReplyAndQuote,
  parentContainerRef,
  wrapContentOnly,
  footer,
  identityMode,
  timestampLayout,
  showInteractions = true,
  inlineAuthorOnDesktop,
  mediaImageScale,
  fullWidthMedia,
  fullWidthLinkPreviews,
  showVideoFullscreen = true,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}: DropProps) {
  const canOpenDrop =
    drop.drop_type !== ApiDropType.Chat || location !== DropLocation.WAVE;
  const openDropContentClick = canOpenDrop ? onDropContentClick : undefined;

  const components: Record<ApiDropType, React.ReactNode> = {
    [ApiDropType.Participatory]: (
      <ParticipationDrop
        drop={drop}
        showWaveInfo={showWaveInfo}
        activeDrop={activeDrop}
        location={location}
        onReply={onReply}
        onQuoteClick={onQuoteClick}
        onDropContentClick={openDropContentClick}
        showReplyAndQuote={showReplyAndQuote}
        parentContainerRef={parentContainerRef}
        footer={footer}
        identityMode={identityMode}
        timestampLayout={timestampLayout}
        showInteractions={showInteractions}
        inlineAuthorOnDesktop={inlineAuthorOnDesktop}
        mediaImageScale={mediaImageScale}
        fullWidthMedia={fullWidthMedia}
        fullWidthLinkPreviews={fullWidthLinkPreviews}
        winningThreshold={winningThreshold}
        winningThresholdMinDurationMs={winningThresholdMinDurationMs}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
        embedPath={embedPath}
        quotePath={quotePath}
        embedDepth={embedDepth}
        maxEmbedDepth={maxEmbedDepth}
      />
    ),
    [ApiDropType.Winner]: (
      <WinnerDrop
        drop={drop}
        previousDrop={previousDrop}
        nextDrop={nextDrop}
        showWaveInfo={showWaveInfo}
        activeDrop={activeDrop}
        location={location}
        dropViewDropId={dropViewDropId}
        onReply={onReply}
        onReplyClick={onReplyClick}
        onQuoteClick={onQuoteClick}
        onDropContentClick={openDropContentClick}
        showReplyAndQuote={showReplyAndQuote}
        parentContainerRef={parentContainerRef}
        footer={footer}
        identityMode={identityMode}
        timestampLayout={timestampLayout}
        showInteractions={showInteractions}
        inlineAuthorOnDesktop={inlineAuthorOnDesktop}
        mediaImageScale={mediaImageScale}
        fullWidthMedia={fullWidthMedia}
        fullWidthLinkPreviews={fullWidthLinkPreviews}
        winningThreshold={winningThreshold}
        embedPath={embedPath}
        quotePath={quotePath}
        embedDepth={embedDepth}
        maxEmbedDepth={maxEmbedDepth}
      />
    ),
    [ApiDropType.Chat]: (
      <WaveDrop
        drop={drop}
        previousDrop={
          previousDrop?.type === DropSize.FULL ? previousDrop : null
        }
        nextDrop={nextDrop?.type === DropSize.FULL ? nextDrop : null}
        showWaveInfo={showWaveInfo}
        activeDrop={activeDrop}
        location={location}
        dropViewDropId={dropViewDropId}
        onReply={onReply}
        onReplyClick={onReplyClick}
        onQuoteClick={onQuoteClick}
        onDropContentClick={openDropContentClick}
        showReplyAndQuote={showReplyAndQuote}
        wrapContentOnly={wrapContentOnly}
        footer={footer}
        identityMode={identityMode}
        timestampLayout={timestampLayout}
        showInteractions={showInteractions}
        inlineAuthorOnDesktop={inlineAuthorOnDesktop}
        mediaImageScale={mediaImageScale}
        fullWidthMedia={fullWidthMedia}
        fullWidthLinkPreviews={fullWidthLinkPreviews}
        embedPath={embedPath}
        quotePath={quotePath}
        embedDepth={embedDepth}
        maxEmbedDepth={maxEmbedDepth}
      />
    ),
  };

  const memoizedValue = useMemo(
    () => ({ drop, location, showVideoFullscreen }),
    [drop, location, showVideoFullscreen]
  );

  return (
    <DropContext.Provider value={memoizedValue}>
      {components[drop.drop_type]}
    </DropContext.Provider>
  );
}
