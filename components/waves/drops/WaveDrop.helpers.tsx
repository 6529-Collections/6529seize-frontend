"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { type CSSProperties } from "react";
import type { DropIdentityMode, DropTimestampLayout } from "./drop.types";
import { DropLocation } from "./drop.types";
import { getRankHoverRingClass } from "./dropRankStyles";
import DropMinimalIdentityRow from "./DropMinimalIdentityRow";
import WaveDropAuthorPfp from "./WaveDropAuthorPfp";
import WaveDropContent from "./WaveDropContent";
import WaveDropHeader from "./WaveDropHeader";

import WaveDropReply from "./WaveDropReply";
import WaveDropTime from "./time/WaveDropTime";

const GROUPING_TIME_DIFFERENCE_MS = 60_000;
const TOUCH_MOVE_THRESHOLD_PX = 10;
const GROUPED_TIMESTAMP_SWIPE_ACTIVATION_PX = 16;
const GROUPED_TIMESTAMP_SWIPE_MAX_OFFSET_PX = 148;
const GROUPED_TIMESTAMP_SWIPE_AXIS_RATIO = 1.15;
const PRIMARY_POINTER_BUTTON = 0;

type TouchCoordinates = Pick<Touch, "clientX" | "clientY">;
type TimestampSwipeStart = {
  readonly x: number;
  readonly y: number;
  readonly pointerId?: number | undefined;
};

const getPrimaryTouch = (event: React.TouchEvent): TouchCoordinates | null =>
  event.touches[0] ?? event.targetTouches[0] ?? event.changedTouches[0] ?? null;

const getPointerType = (event: React.PointerEvent<HTMLDivElement>): string =>
  event.pointerType || "mouse";

const getPointerId = (event: React.PointerEvent<HTMLDivElement>): number =>
  Number.isFinite(event.pointerId) ? event.pointerId : -1;

const isPrimaryPointerButton = (
  event: React.PointerEvent<HTMLDivElement>
): boolean => {
  const maybeButton = (
    event as React.PointerEvent<HTMLDivElement> & {
      readonly button?: number | undefined;
    }
  ).button;

  return (
    maybeButton === undefined ||
    maybeButton === PRIMARY_POINTER_BUTTON ||
    event.buttons === 1
  );
};

const isInteractiveSwipeTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      "a, button, input, textarea, select, summary, [role='button'], [contenteditable='true']"
    )
  );
};

const shouldGroupWithDrop = (
  currentDrop: ExtendedDrop,
  otherDrop: ExtendedDrop | null
): boolean => {
  if (!otherDrop || currentDrop.parts.length > 1) {
    return false;
  }

  const isSameAuthor = currentDrop.author.handle === otherDrop.author.handle;
  const isWithinTimeThreshold =
    Math.abs(currentDrop.created_at - otherDrop.created_at) <=
    GROUPING_TIME_DIFFERENCE_MS;

  if (!isSameAuthor || !isWithinTimeThreshold) {
    return false;
  }

  const bothNotReplies = !currentDrop.reply_to && !otherDrop.reply_to;
  const repliesInSameThread =
    currentDrop.reply_to?.drop_id === otherDrop.reply_to?.drop_id;

  return bothNotReplies || repliesInSameThread;
};

const shouldGroupCurrentDrop = ({
  isDrop,
  drop,
  otherDrop,
}: {
  readonly isDrop: boolean;
  readonly drop: ExtendedDrop;
  readonly otherDrop: ExtendedDrop | null;
}): boolean => {
  if (isDrop) {
    return false;
  }

  return shouldGroupWithDrop(drop, otherDrop);
};

const RANK_STYLES = {
  1: `tw-ring-1 tw-ring-inset tw-ring-iron-700/35 ${getRankHoverRingClass(1)}`,
  2: `tw-ring-1 tw-ring-inset tw-ring-iron-700/35 ${getRankHoverRingClass(2)}`,
  3: `tw-ring-1 tw-ring-inset tw-ring-iron-700/35 ${getRankHoverRingClass(3)}`,
  default:
    "tw-ring-1 tw-ring-inset tw-ring-iron-700/35 desktop-hover:hover:tw-ring-iron-600/45",
} as const;

const getColorClasses = ({
  isActiveDrop,
  rank,
  isDrop,
  location,
}: {
  isActiveDrop: boolean;
  rank: number | null;
  isDrop: boolean;
  location: DropLocation;
}): string => {
  if (isActiveDrop) {
    return "tw-bg-[#3CCB7F]/10 tw-ring-1 tw-ring-inset tw-ring-[#3CCB7F]/55";
  }

  if (!isDrop) {
    const isWaveView = location === DropLocation.WAVE;
    const hoverClass = isWaveView
      ? "desktop-hover:hover:tw-bg-iron-800/50"
      : "";
    const ringClasses = isWaveView
      ? ""
      : "tw-ring-1 tw-ring-inset tw-ring-iron-800";
    const bgClass = isWaveView ? "" : "tw-bg-iron-950/80";

    return `${bgClass} ${ringClasses} ${hoverClass}`.trim();
  }

  const rankClass = RANK_STYLES[rank as keyof typeof RANK_STYLES];
  return `${rankClass} tw-transition-shadow tw-duration-300`.trim();
};

const getDropClasses = (
  isActiveDrop: boolean,
  groupingClass: string,
  location: DropLocation,
  rank: number | null,
  isDrop: boolean
): string => {
  const baseClasses =
    "touch-select-none tw-cursor-default tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-z-30 focus-within:tw-z-30";

  const streamClasses = "tw-rounded-xl";

  const chatDropClasses = isDrop ? "tw-rounded-lg tw-my-0.5" : "";

  const rankClasses = getColorClasses({ isActiveDrop, rank, isDrop, location });

  const locationClasses =
    location === DropLocation.MY_STREAM || location === DropLocation.PROFILE
      ? streamClasses
      : chatDropClasses;

  return `${baseClasses} ${groupingClass} ${locationClasses} ${rankClasses}`.trim();
};

const getContentOffsetClass = (compact: boolean): string => {
  if (compact) {
    return "md:tw-ml-11 md:tw-w-[calc(100%-2.5rem)]";
  }

  return "md:tw-ml-[3.25rem] md:tw-w-[calc(100%-3.25rem)]";
};

const getDropContentClass = ({
  showAuthorInfo,
  shouldGroupWithPreviousDrop,
  isProfileView,
}: {
  readonly showAuthorInfo: boolean;
  readonly shouldGroupWithPreviousDrop: boolean;
  readonly isProfileView: boolean;
}): string => {
  const classes = ["tw-w-full"];

  if (showAuthorInfo) {
    classes.push("tw-mt-2");
  }

  if (shouldGroupWithPreviousDrop && !isProfileView) {
    classes.push("md:tw-pl-[3.25rem]");
  }

  return classes.join(" ");
};

const shouldShowAuthorInfo = ({
  identityMode,
  shouldGroupWithPreviousDrop,
  isProfileView,
}: {
  readonly identityMode: DropIdentityMode;
  readonly shouldGroupWithPreviousDrop: boolean;
  readonly isProfileView: boolean;
}): boolean =>
  identityMode !== "hidden" &&
  (!shouldGroupWithPreviousDrop || isProfileView || identityMode === "minimal");

const shouldShowTouchActionsButton = ({
  showInteractions,
  hasTouch,
  showReplyAndQuote,
  isEditing,
  identityMode,
}: {
  readonly showInteractions: boolean;
  readonly hasTouch: boolean;
  readonly showReplyAndQuote: boolean;
  readonly isEditing: boolean;
  readonly identityMode: DropIdentityMode;
}): boolean =>
  showInteractions &&
  hasTouch &&
  showReplyAndQuote &&
  !isEditing &&
  identityMode === "default";

const shouldDisplayReplyHeader = ({
  replyTo,
  dropViewDropId,
  shouldGroupWithPreviousDrop,
  previousDrop,
}: {
  readonly replyTo: ExtendedDrop["reply_to"];
  readonly dropViewDropId: string | null;
  readonly shouldGroupWithPreviousDrop: boolean;
  readonly previousDrop: ExtendedDrop | null;
}): boolean => {
  if (!replyTo || replyTo.drop_id === dropViewDropId) {
    return false;
  }

  return !(
    shouldGroupWithPreviousDrop &&
    replyTo.drop_id === previousDrop?.reply_to?.drop_id
  );
};

const shouldOffsetFooterRow = ({
  inlineAuthorOnDesktop,
  showAuthorInfo,
  shouldGroupWithPreviousDrop,
  isProfileView,
}: {
  readonly inlineAuthorOnDesktop: boolean;
  readonly showAuthorInfo: boolean;
  readonly shouldGroupWithPreviousDrop: boolean;
  readonly isProfileView: boolean;
}): boolean => {
  if (inlineAuthorOnDesktop) {
    return false;
  }

  return showAuthorInfo || (shouldGroupWithPreviousDrop && !isProfileView);
};

const getWaveDropOuterClass = ({
  isDrop,
  location,
  isProfileView,
}: {
  readonly isDrop: boolean;
  readonly location: DropLocation;
  readonly isProfileView: boolean;
}): string => {
  const classes = ["tw-w-full"];

  if (isDrop && location === DropLocation.WAVE) {
    classes.push("tw-px-4 tw-py-0.5");
  }

  if (isProfileView) {
    classes.push("tw-mb-3");
  }

  return classes.join(" ");
};

const getGroupingClass = ({
  isProfileView,
  shouldGroupWithPreviousDrop,
  shouldGroupWithNextDrop,
}: {
  readonly isProfileView: boolean;
  readonly shouldGroupWithPreviousDrop: boolean;
  readonly shouldGroupWithNextDrop: boolean;
}): string => {
  if (isProfileView) return "tw-py-4";
  if (shouldGroupWithPreviousDrop) return "tw-pt-1";
  if (shouldGroupWithNextDrop) return "tw-pt-4 tw-pb-1";
  return "tw-py-4";
};

const clearLongPressTimeout = ({
  longPressTimeoutRef,
}: {
  readonly longPressTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
}) => {
  if (longPressTimeoutRef.current) {
    clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = null;
  }
};

const handleTouchStartInternal = ({
  allowLongPress,
  isEditing,
  event,
  touchStartPosition,
  longPressTimeoutRef,
  onLongPress,
}: {
  readonly allowLongPress: boolean;
  readonly isEditing: boolean;
  readonly event: React.TouchEvent;
  readonly touchStartPosition: React.RefObject<{
    x: number;
    y: number;
  } | null>;
  readonly longPressTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
  readonly onLongPress: () => void;
}) => {
  if (!allowLongPress || isEditing) {
    return;
  }

  const touch = getPrimaryTouch(event);
  if (!touch) {
    return;
  }

  touchStartPosition.current = { x: touch.clientX, y: touch.clientY };
  longPressTimeoutRef.current = setTimeout(onLongPress, 500);
};

const handleTouchEndInternal = ({
  longPressTimeoutRef,
  touchStartPosition,
}: {
  readonly longPressTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
  readonly touchStartPosition: React.RefObject<{
    x: number;
    y: number;
  } | null>;
}) => {
  clearLongPressTimeout({ longPressTimeoutRef });
  touchStartPosition.current = null;
};

const handleTouchMoveInternal = ({
  allowLongPress,
  event,
  touchStartPosition,
  longPressTimeoutRef,
}: {
  readonly allowLongPress: boolean;
  readonly event: React.TouchEvent;
  readonly touchStartPosition: React.RefObject<{
    x: number;
    y: number;
  } | null>;
  readonly longPressTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
}) => {
  if (!allowLongPress || !touchStartPosition.current) {
    return;
  }

  const touch = getPrimaryTouch(event);
  if (!touch) {
    return;
  }

  const deltaX = Math.abs(touch.clientX - touchStartPosition.current.x);
  const deltaY = Math.abs(touch.clientY - touchStartPosition.current.y);

  if (deltaX > TOUCH_MOVE_THRESHOLD_PX || deltaY > TOUCH_MOVE_THRESHOLD_PX) {
    clearLongPressTimeout({ longPressTimeoutRef });
  }
};

const clampGroupedTimestampSwipeOffset = (offset: number): number =>
  Math.min(GROUPED_TIMESTAMP_SWIPE_MAX_OFFSET_PX, Math.max(0, offset));

const getGroupedTimestampContentStyle = (
  offset: number
): CSSProperties | undefined => {
  if (offset <= 0) {
    return undefined;
  }

  return { transform: `translateX(-${offset}px)` };
};

const getGroupedTimestampActionStyle = (
  offset: number
): CSSProperties | undefined => {
  if (offset <= 0) {
    return undefined;
  }

  return { transform: `translateX(${offset}px)` };
};

const getGroupedTimestampOpacityStyle = (offset: number): CSSProperties => ({
  opacity: Math.min(1, offset / GROUPED_TIMESTAMP_SWIPE_MAX_OFFSET_PX),
});

const releasePointerCapture = (
  event: React.PointerEvent<HTMLDivElement>,
  pointerId: number | undefined
) => {
  if (pointerId === undefined) {
    return;
  }

  if (
    typeof event.currentTarget.hasPointerCapture !== "function" ||
    typeof event.currentTarget.releasePointerCapture !== "function" ||
    !event.currentTarget.hasPointerCapture(pointerId)
  ) {
    return;
  }

  event.currentTarget.releasePointerCapture(pointerId);
};

const setPointerCapture = (
  event: React.PointerEvent<HTMLDivElement>,
  pointerId: number
) => {
  if (
    typeof event.currentTarget.hasPointerCapture !== "function" ||
    typeof event.currentTarget.setPointerCapture !== "function" ||
    event.currentTarget.hasPointerCapture(pointerId)
  ) {
    return;
  }

  event.currentTarget.setPointerCapture(pointerId);
};

const shouldShowGroupedDropTimestamp = ({
  shouldGroupWithPreviousDrop,
  showAuthorInfo,
  identityMode,
  isProfileView,
  location,
}: {
  readonly shouldGroupWithPreviousDrop: boolean;
  readonly showAuthorInfo: boolean;
  readonly identityMode: DropIdentityMode;
  readonly isProfileView: boolean;
  readonly location: DropLocation;
}): boolean =>
  location === DropLocation.WAVE &&
  identityMode === "default" &&
  shouldGroupWithPreviousDrop &&
  !showAuthorInfo &&
  !isProfileView;

const GroupedDropTimestamp = ({
  swipeOffset = 0,
  timestamp,
  variant,
  forceVisible = false,
}: {
  readonly swipeOffset?: number;
  readonly timestamp: number;
  readonly variant: "swipe" | "hover";
  /** Pointer-driven row hover for browsers whose CSS :hover never fires. */
  readonly forceVisible?: boolean;
}) => {
  // "swipe": revealed by the touch swipe gesture via inline opacity.
  // "hover": desktop affordance — swiping would hijack text selection, so the
  // timestamp reveals on row hover instead.
  const isHoverVariant = variant === "hover";

  return (
    <div
      className={`tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 tw-z-0 tw-flex tw-w-[9.25rem] -tw-translate-y-1/2 tw-justify-end tw-overflow-visible tw-text-right tw-transition-opacity tw-duration-150 ${
        isHoverVariant
          ? "tw-opacity-0 desktop-hover:group-hover:tw-opacity-100"
          : ""
      }`}
      data-testid={
        isHoverVariant
          ? "grouped-drop-hover-timestamp"
          : "grouped-drop-swipe-timestamp"
      }
      style={
        isHoverVariant
          ? forceVisible
            ? { opacity: 1 }
            : undefined
          : getGroupedTimestampOpacityStyle(swipeOffset)
      }
    >
      <WaveDropTime timestamp={timestamp} size="xs" variant="compactReveal" />
    </div>
  );
};

const getAuthorHeader = ({
  showAuthorInfo,
  identityMode,
  drop,
  showWaveInfo,
  isStorm,
  activePartIndex,
  showActionsButton,
  handleOpenTouchActions,
  timestampLayout,
}: {
  readonly showAuthorInfo: boolean;
  readonly identityMode: DropIdentityMode;
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly isStorm: boolean;
  readonly activePartIndex: number;
  readonly showActionsButton: boolean;
  readonly handleOpenTouchActions: (
    e: React.MouseEvent<HTMLButtonElement>
  ) => void;
  readonly timestampLayout: DropTimestampLayout;
}): React.ReactNode => {
  if (!showAuthorInfo) {
    return null;
  }

  if (identityMode === "default") {
    return (
      <WaveDropHeader
        drop={drop}
        showWaveInfo={showWaveInfo}
        isStorm={isStorm}
        currentPartIndex={activePartIndex}
        partsCount={drop.parts.length}
        showActionsButton={showActionsButton}
        onOpenActions={handleOpenTouchActions}
        timestampLayout={timestampLayout}
      />
    );
  }

  return (
    <DropMinimalIdentityRow drop={drop} timestampLayout={timestampLayout} />
  );
};

const getDesktopAuthorHeader = ({
  showAuthorInfo,
  inlineAuthorOnDesktop,
  authorHeader,
}: {
  readonly showAuthorInfo: boolean;
  readonly inlineAuthorOnDesktop: boolean;
  readonly authorHeader: React.ReactNode;
}): React.ReactNode => {
  if (showAuthorInfo && !inlineAuthorOnDesktop) {
    return <div className="tw-hidden md:tw-block">{authorHeader}</div>;
  }

  if (showAuthorInfo) {
    return null;
  }

  return authorHeader;
};

const getContentBlock = ({
  shouldShowReplyHeader,
  onReplyClick,
  replyTo,
  drop,
  showAuthorInfo,
  authorHeader,
  shouldGroupWithPreviousDrop,
  isProfileView,
  activePartIndex,
  setActivePartIndex,
  handleLongPress,
  onDropContentClick,
  onQuoteClick,
  setLongPressTriggered,
  isEditing,
  isSaving,
  handleEditSave,
  handleEditCancel,
  allowLongPress,
  handleLinkCardActionsActiveChange,
  inlineAuthorOnDesktop,
  mediaImageScale,
  fullWidthMedia,
  fullWidthLinkPreviews,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}: {
  readonly shouldShowReplyHeader: boolean;
  readonly onReplyClick: (serialNo: number) => void;
  readonly replyTo: ExtendedDrop["reply_to"];
  readonly drop: ExtendedDrop;
  readonly showAuthorInfo: boolean;
  readonly authorHeader: React.ReactNode;
  readonly shouldGroupWithPreviousDrop: boolean;
  readonly isProfileView: boolean;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly handleLongPress: () => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly isEditing: boolean;
  readonly isSaving: boolean;
  readonly handleEditSave: (
    newContent: string,
    mentions?: ApiDropMentionedUser[],
    mentionedGroups?: ApiDropGroupMention[],
    mentionedWaves?: ApiMentionedWave[]
  ) => void;
  readonly handleEditCancel: () => void;
  readonly allowLongPress: boolean;
  readonly handleLinkCardActionsActiveChange: (
    actionId: string,
    active: boolean
  ) => void;
  readonly inlineAuthorOnDesktop: boolean;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia: boolean;
  readonly fullWidthLinkPreviews: boolean;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}): React.ReactNode => (
  <>
    {shouldShowReplyHeader && replyTo && (
      <WaveDropReply
        onReplyClick={onReplyClick}
        dropId={replyTo.drop_id}
        dropPartId={replyTo.drop_part_id}
        maybeDrop={replyTo.drop ? { ...replyTo.drop, wave: drop.wave } : null}
      />
    )}
    <div
      className={`tw-relative tw-z-10 tw-flex tw-w-full tw-flex-col tw-border-0 tw-bg-transparent tw-text-left ${
        inlineAuthorOnDesktop ? "" : "md:tw-flex-row md:tw-gap-x-3"
      }`}
    >
      {showAuthorInfo && (
        <div
          className={`tw-flex tw-w-full tw-items-center tw-gap-x-2 ${
            inlineAuthorOnDesktop
              ? ""
              : "md:tw-block md:tw-w-auto md:tw-flex-shrink-0"
          }`}
        >
          <WaveDropAuthorPfp drop={drop} />
          <div
            className={`tw-min-w-0 tw-flex-1 ${
              inlineAuthorOnDesktop ? "" : "md:tw-hidden"
            }`}
          >
            {authorHeader}
          </div>
        </div>
      )}
      <div
        className={`tw-flex tw-w-full tw-flex-col ${
          showAuthorInfo && !inlineAuthorOnDesktop
            ? "md:tw-max-w-[calc(100%-3.5rem)]"
            : ""
        }`}
      >
        {getDesktopAuthorHeader({
          showAuthorInfo,
          inlineAuthorOnDesktop,
          authorHeader,
        })}
        <div
          className={getDropContentClass({
            showAuthorInfo,
            shouldGroupWithPreviousDrop,
            isProfileView,
          })}
        >
          <WaveDropContent
            drop={drop}
            activePartIndex={activePartIndex}
            setActivePartIndex={setActivePartIndex}
            onLongPress={handleLongPress}
            onDropContentClick={onDropContentClick}
            onQuoteClick={onQuoteClick}
            setLongPressTriggered={setLongPressTriggered}
            isEditing={isEditing}
            isSaving={isSaving}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            hasTouch={allowLongPress}
            onLinkCardActionsActiveChange={handleLinkCardActionsActiveChange}
            mediaImageScale={mediaImageScale}
            fullWidthMedia={fullWidthMedia}
            fullWidthLinkPreviews={fullWidthLinkPreviews}
            embedPath={embedPath}
            quotePath={quotePath}
            embedDepth={embedDepth}
            maxEmbedDepth={maxEmbedDepth}
          />
        </div>
      </div>
    </div>
  </>
);

export {
  GROUPED_TIMESTAMP_SWIPE_ACTIVATION_PX,
  GROUPED_TIMESTAMP_SWIPE_AXIS_RATIO,
  GroupedDropTimestamp,
  type TimestampSwipeStart,
  clampGroupedTimestampSwipeOffset,
  clearLongPressTimeout,
  getAuthorHeader,
  getContentBlock,
  getGroupedTimestampActionStyle,
  getGroupedTimestampContentStyle,
  getGroupingClass,
  getContentOffsetClass,
  getDropClasses,
  getPointerId,
  getPointerType,
  getPrimaryTouch,
  getWaveDropOuterClass,
  handleTouchEndInternal,
  handleTouchMoveInternal,
  handleTouchStartInternal,
  isInteractiveSwipeTarget,
  isPrimaryPointerButton,
  releasePointerCapture,
  setPointerCapture,
  shouldDisplayReplyHeader,
  shouldGroupCurrentDrop,
  shouldOffsetFooterRow,
  shouldShowAuthorInfo,
  shouldShowGroupedDropTimestamp,
  shouldShowTouchActionsButton,
};
