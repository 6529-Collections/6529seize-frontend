"use client";

import { useCompactMode } from "@/contexts/CompactModeContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiCreateDropPart } from "@/generated/models/ApiCreateDropPart";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiUpdateDropRequest } from "@/generated/models/ApiUpdateDropRequest";
import type { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropUpdateMutation } from "@/hooks/drops/useDropUpdateMutation";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import useLongPressClickSuppression from "@/hooks/useLongPressClickSuppression";
import { useEditingDrop } from "@/contexts/EditingDropContext";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropTimestampLayout,
} from "./drop.types";
import { DropLocation, hasDropFooter } from "./drop.types";
import { getRankHoverRingClass } from "./dropRankStyles";
import type { BoostAnimationState } from "./DropBoostAnimation";
import DropBoostAnimation from "./DropBoostAnimation";
import DropMinimalIdentityRow from "./DropMinimalIdentityRow";
import WaveDropActions from "./WaveDropActions";
import WaveDropAuthorPfp from "./WaveDropAuthorPfp";
import WaveDropContent from "./WaveDropContent";
import WaveDropHeader from "./WaveDropHeader";
import WaveDropMetadata from "./WaveDropMetadata";
import {
  useWaveDropMobileMenu,
  withWaveDropMobileMenuProvider,
} from "./WaveDropMobileMenuContext";
import { useWaveDropMobileMenuController } from "./useWaveDropMobileMenuController";
import WaveDropRatings from "./WaveDropRatings";
import WaveDropReactions from "./WaveDropReactions";
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
}: {
  readonly swipeOffset?: number;
  readonly timestamp: number;
}) => {
  return (
    <div
      className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 tw-z-0 tw-flex tw-w-[9.25rem] -tw-translate-y-1/2 tw-justify-end tw-overflow-visible tw-text-right tw-transition-opacity tw-duration-150"
      data-testid="grouped-drop-swipe-timestamp"
      style={getGroupedTimestampOpacityStyle(swipeOffset)}
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
  canUseDesktopHoverActions,
  showInteractions,
  showReplyAndQuote,
  handleOnReply,
  handleOnEdit,
  hasActiveLinkCardActions,
  inlineAuthorOnDesktop,
  mediaImageScale,
  fullWidthMedia,
  fullWidthLinkPreviews,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
  groupedTimestampSwipeOffset,
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
  readonly canUseDesktopHoverActions: boolean;
  readonly showInteractions: boolean;
  readonly showReplyAndQuote: boolean;
  readonly handleOnReply: () => void;
  readonly handleOnEdit: () => void;
  readonly hasActiveLinkCardActions: boolean;
  readonly inlineAuthorOnDesktop: boolean;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia: boolean;
  readonly fullWidthLinkPreviews: boolean;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly groupedTimestampSwipeOffset: number;
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
    {canUseDesktopHoverActions &&
      showInteractions &&
      showReplyAndQuote &&
      !isEditing && (
        <WaveDropActions
          drop={drop}
          activePartIndex={activePartIndex}
          onReply={handleOnReply}
          onEdit={handleOnEdit}
          suppressed={hasActiveLinkCardActions}
          style={getGroupedTimestampActionStyle(groupedTimestampSwipeOffset)}
        />
      )}
  </>
);

interface WaveDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly wrapContentOnly?:
    | ((content: React.ReactNode) => React.ReactNode)
    | undefined;
  readonly footer?: React.ReactNode;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly timestampLayout?: DropTimestampLayout | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly inlineAuthorOnDesktop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const WaveDropInner = ({
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
  wrapContentOnly,
  footer,
  identityMode = "default",
  timestampLayout = "inline",
  showInteractions = true,
  inlineAuthorOnDesktop = false,
  mediaImageScale,
  fullWidthMedia = false,
  fullWidthLinkPreviews = false,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}: WaveDropProps) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [activeLinkCardActionIds, setActiveLinkCardActionIds] = useState<
    string[]
  >([]);
  const [timestampSwipeOffset, setTimestampSwipeOffset] = useState(0);
  const [isTimestampSwipeDragging, setIsTimestampSwipeDragging] =
    useState(false);
  const [boostAnimation, setBoostAnimation] =
    useState<BoostAnimationState | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const { editingDropId, setEditingDropId } = useEditingDrop();
  const isEditing = editingDropId === drop.id;
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosition = useRef<{ x: number; y: number } | null>(null);
  const timestampSwipeStartRef = useRef<TimestampSwipeStart | null>(null);
  const {
    markNextClickForSuppression,
    releaseSuppressionAfterTouchEnd,
    clearSuppression,
    handleClickCapture,
  } = useLongPressClickSuppression();
  const dropUpdateMutation = useDropUpdateMutation();
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isStorm = drop.parts.length > 1;
  const isDrop = drop.drop_type === ApiDropType.Participatory;

  const shouldGroupWithPreviousDrop = shouldGroupCurrentDrop({
    isDrop,
    drop,
    otherDrop: previousDrop,
  });

  const shouldGroupWithNextDrop = shouldGroupCurrentDrop({
    isDrop,
    drop,
    otherDrop: nextDrop,
  });

  const { canUseDesktopHoverActions, canUseTouchActionSheet } =
    useDropActionInteractionMode();
  const mobileMenu = useWaveDropMobileMenu();
  const allowLongPress = showInteractions && canUseTouchActionSheet;
  const compact = useCompactMode();
  const hasActiveLinkCardActions = activeLinkCardActionIds.length > 0;

  const isProfileView = location === DropLocation.PROFILE;
  const showAuthorInfo = shouldShowAuthorInfo({
    identityMode,
    shouldGroupWithPreviousDrop,
    isProfileView,
  });
  const showGroupedTimestamp = shouldShowGroupedDropTimestamp({
    shouldGroupWithPreviousDrop,
    showAuthorInfo,
    identityMode,
    isProfileView,
    location,
  });
  const showActionsButton = shouldShowTouchActionsButton({
    showInteractions,
    hasTouch: canUseTouchActionSheet,
    showReplyAndQuote,
    isEditing,
    identityMode,
  });
  const groupingClass = getGroupingClass({
    isProfileView,
    shouldGroupWithPreviousDrop,
    shouldGroupWithNextDrop,
  });
  const replyTo = drop.reply_to;

  const shouldShowReplyHeader = shouldDisplayReplyHeader({
    replyTo,
    dropViewDropId,
    shouldGroupWithPreviousDrop,
    previousDrop,
  });

  const resetTimestampSwipe = useCallback(() => {
    timestampSwipeStartRef.current = null;
    setTimestampSwipeOffset(0);
    setIsTimestampSwipeDragging(false);
  }, []);

  const handleLongPress = useCallback(() => {
    if (!allowLongPress) return;
    markNextClickForSuppression();
    // Cancel any active edit mode first
    if (editingDropId) {
      setEditingDropId(null);
    }
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [
    allowLongPress,
    editingDropId,
    setEditingDropId,
    markNextClickForSuppression,
  ]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleTouchStartInternal({
        allowLongPress,
        isEditing,
        event: e,
        touchStartPosition,
        longPressTimeoutRef,
        onLongPress: handleLongPress,
      });

      if (showGroupedTimestamp && canUseTouchActionSheet && !isEditing) {
        const touch = getPrimaryTouch(e);
        if (!touch) {
          resetTimestampSwipe();
          return;
        }

        timestampSwipeStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };
        setTimestampSwipeOffset(0);
        setIsTimestampSwipeDragging(false);
        return;
      }

      resetTimestampSwipe();
    },
    [
      allowLongPress,
      canUseTouchActionSheet,
      handleLongPress,
      isEditing,
      resetTimestampSwipe,
      showGroupedTimestamp,
    ]
  );

  const handleTouchEnd = useCallback(() => {
    handleTouchEndInternal({
      longPressTimeoutRef,
      touchStartPosition,
    });
    resetTimestampSwipe();
    releaseSuppressionAfterTouchEnd();
  }, [releaseSuppressionAfterTouchEnd, resetTimestampSwipe]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleTouchMoveInternal({
        allowLongPress,
        event: e,
        touchStartPosition,
        longPressTimeoutRef,
      });

      const swipeStart = timestampSwipeStartRef.current;
      if (
        !swipeStart ||
        !showGroupedTimestamp ||
        !canUseTouchActionSheet ||
        isEditing
      ) {
        return;
      }

      const touch = getPrimaryTouch(e);
      if (!touch) {
        return;
      }

      const swipeDeltaX = swipeStart.x - touch.clientX;
      const deltaY = Math.abs(touch.clientY - swipeStart.y);
      const isActivatedSwipe =
        swipeDeltaX > GROUPED_TIMESTAMP_SWIPE_ACTIVATION_PX &&
        swipeDeltaX > deltaY * GROUPED_TIMESTAMP_SWIPE_AXIS_RATIO;

      if (!isActivatedSwipe && !isTimestampSwipeDragging) {
        return;
      }

      if (swipeDeltaX <= 0 || deltaY > swipeDeltaX) {
        resetTimestampSwipe();
        return;
      }

      const nextOffset = clampGroupedTimestampSwipeOffset(swipeDeltaX);
      if (nextOffset <= 0) {
        return;
      }

      clearLongPressTimeout({ longPressTimeoutRef });
      markNextClickForSuppression();
      setLongPressTriggered(false);
      setIsSlideUp(false);
      setIsTimestampSwipeDragging(true);
      setTimestampSwipeOffset(nextOffset);

      if (e.cancelable) {
        e.preventDefault();
      }
    },
    [
      allowLongPress,
      canUseTouchActionSheet,
      isEditing,
      isTimestampSwipeDragging,
      markNextClickForSuppression,
      resetTimestampSwipe,
      showGroupedTimestamp,
    ]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pointerType = getPointerType(event);
      if (
        pointerType === "touch" ||
        !isPrimaryPointerButton(event) ||
        !showGroupedTimestamp ||
        isEditing ||
        isInteractiveSwipeTarget(event.target)
      ) {
        return;
      }

      timestampSwipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: getPointerId(event),
      };
      setTimestampSwipeOffset(0);
      setIsTimestampSwipeDragging(false);
    },
    [isEditing, showGroupedTimestamp]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const swipeStart = timestampSwipeStartRef.current;
      const pointerId = getPointerId(event);
      if (
        swipeStart?.pointerId !== pointerId ||
        getPointerType(event) === "touch" ||
        !showGroupedTimestamp ||
        isEditing
      ) {
        return;
      }

      const swipeDeltaX = swipeStart.x - event.clientX;
      const deltaY = Math.abs(event.clientY - swipeStart.y);
      const isActivatedSwipe =
        swipeDeltaX > GROUPED_TIMESTAMP_SWIPE_ACTIVATION_PX &&
        swipeDeltaX > deltaY * GROUPED_TIMESTAMP_SWIPE_AXIS_RATIO;

      if (!isActivatedSwipe && !isTimestampSwipeDragging) {
        return;
      }

      if (swipeDeltaX <= 0 || deltaY > swipeDeltaX) {
        resetTimestampSwipe();
        releasePointerCapture(event, swipeStart.pointerId);
        return;
      }

      const nextOffset = clampGroupedTimestampSwipeOffset(swipeDeltaX);
      if (nextOffset <= 0) {
        return;
      }

      setPointerCapture(event, pointerId);

      markNextClickForSuppression();
      setIsTimestampSwipeDragging(true);
      setTimestampSwipeOffset(nextOffset);

      if (event.cancelable) {
        event.preventDefault();
      }
    },
    [
      isEditing,
      isTimestampSwipeDragging,
      markNextClickForSuppression,
      resetTimestampSwipe,
      showGroupedTimestamp,
    ]
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const swipeStart = timestampSwipeStartRef.current;
      releasePointerCapture(event, swipeStart?.pointerId);
      resetTimestampSwipe();
    },
    [resetTimestampSwipe]
  );

  const handleOnReply = useCallback(() => {
    // Cancel any active edit mode first
    if (editingDropId) {
      setEditingDropId(null);
    }
    mobileMenu?.close();
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]!.part_id });
  }, [
    onReply,
    drop,
    activePartIndex,
    editingDropId,
    setEditingDropId,
    mobileMenu,
  ]);

  const handleOnAddReaction = useCallback(() => {
    // Cancel any active edit mode first
    if (editingDropId) {
      setEditingDropId(null);
    }
    mobileMenu?.close();
    setIsSlideUp(false);
  }, [editingDropId, setEditingDropId, mobileMenu]);

  const handleOpenTouchActions = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setLongPressTriggered(false);
      setIsSlideUp(true);
    },
    []
  );

  const authorHeader = getAuthorHeader({
    showAuthorInfo,
    identityMode,
    drop,
    showWaveInfo,
    isStorm,
    activePartIndex,
    showActionsButton,
    handleOpenTouchActions,
    timestampLayout,
  });

  const handleOnEdit = useCallback(() => {
    mobileMenu?.close();
    setIsSlideUp(false); // Close mobile menu when entering edit mode
    setEditingDropId(drop.id);
  }, [setEditingDropId, drop.id, mobileMenu]);

  const handleEditSave = useCallback(
    (
      newContent: string,
      mentions?: ApiDropMentionedUser[],
      _mentionedGroups?: ApiDropGroupMention[],
      mentionedWaves?: ApiMentionedWave[]
    ) => {
      // Clean mentioned users to only include allowed fields for API
      const cleanedMentions = (mentions ?? drop.mentioned_users).map(
        (user) => ({
          mentioned_profile_id: user.mentioned_profile_id,
          handle_in_content: user.handle_in_content,
          // Exclude current_handle as it's not allowed in update requests
        })
      );
      const cleanedWaves = (mentionedWaves ?? drop.mentioned_waves).map(
        (wave) => ({
          wave_id: wave.wave_id,
          wave_name_in_content: wave.wave_name_in_content,
        })
      );
      const updatedParts: ApiCreateDropPart[] = drop.parts.map(
        (part, index) => {
          const attachments = (part.attachments ?? []).map((attachment) => ({
            attachment_id: attachment.attachment_id,
          }));
          const requestPart: ApiCreateDropPart = {
            content: index === activePartIndex ? newContent : part.content,
            quoted_drop: part.quoted_drop ?? null,
            media: part.media,
          };

          if (attachments.length) {
            requestPart.attachments = attachments;
          }

          return requestPart;
        }
      );

      const updateRequest: ApiUpdateDropRequest = {
        parts: updatedParts,
        title: drop.title,
        metadata: drop.metadata,
        referenced_nfts: drop.referenced_nfts,
        mentioned_users: cleanedMentions,
        mentioned_waves: cleanedWaves,
        signature: null,
      };

      // Optimistically close the editor
      setEditingDropId(null);

      // Execute the mutation
      dropUpdateMutation.mutate({
        dropId: drop.id,
        request: updateRequest,
        currentDrop: drop,
      });
    },
    [drop, activePartIndex, dropUpdateMutation, setEditingDropId]
  );

  const handleEditCancel = useCallback(() => {
    setEditingDropId(null);
  }, [setEditingDropId]);

  const handleBoostAnimationComplete = useCallback(() => {
    setBoostAnimation(null);
  }, []);

  const handleLinkCardActionsActiveChange = useCallback(
    (actionId: string, active: boolean) => {
      setActiveLinkCardActionIds((current) => {
        const hasActionId = current.includes(actionId);
        if (active) {
          return hasActionId ? current : [...current, actionId];
        }

        return hasActionId
          ? current.filter((item) => item !== actionId)
          : current;
      });
    },
    []
  );

  // Handler for mobile menu boost animation
  const handleMobileBoostAnimation = useCallback(() => {
    if (!dropRef.current) return;

    const rect = dropRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const isBoosted = drop.context_profile_context?.boosted ?? false;

    setBoostAnimation({
      id: `${drop.id}-${Date.now()}`,
      x,
      y,
      type: isBoosted ? "unboost" : "boost",
    });
  }, [drop.id, drop.context_profile_context?.boosted]);

  useEffect(() => {
    return () => {
      clearLongPressTimeout({ longPressTimeoutRef });
    };
  }, []);

  useEffect(() => {
    if (canUseTouchActionSheet) {
      return;
    }

    clearLongPressTimeout({ longPressTimeoutRef });
    touchStartPosition.current = null;
    resetTimestampSwipe();
    setIsSlideUp(false);
    setLongPressTriggered(false);
    mobileMenu?.close();
    clearSuppression();
  }, [
    canUseTouchActionSheet,
    clearSuppression,
    mobileMenu,
    resetTimestampSwipe,
  ]);

  useEffect(() => {
    if (showGroupedTimestamp) {
      return;
    }

    resetTimestampSwipe();
  }, [resetTimestampSwipe, showGroupedTimestamp]);

  // Derive effective menu state - menu can't be open while editing
  const effectiveIsSlideUp = isSlideUp && !isEditing && canUseTouchActionSheet;

  useWaveDropMobileMenuController({
    drop,
    enabled: showInteractions,
    isOpen: effectiveIsSlideUp,
    longPressTriggered,
    showReplyAndQuote,
    onOpenChange: setIsSlideUp,
    onReply: handleOnReply,
    onAddReaction: handleOnAddReaction,
    onEdit: handleOnEdit,
    onBoostAnimation: handleMobileBoostAnimation,
  });

  const dropClasses = getDropClasses(
    isActiveDrop,
    groupingClass,
    location,
    drop.rank,
    isDrop
  );

  const contentBlock = getContentBlock({
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
    isSaving: dropUpdateMutation.isPending,
    handleEditSave,
    handleEditCancel,
    allowLongPress,
    handleLinkCardActionsActiveChange,
    canUseDesktopHoverActions,
    showInteractions,
    showReplyAndQuote,
    handleOnReply,
    handleOnEdit,
    hasActiveLinkCardActions,
    inlineAuthorOnDesktop,
    mediaImageScale,
    fullWidthMedia,
    fullWidthLinkPreviews,
    embedPath,
    quotePath,
    embedDepth,
    maxEmbedDepth,
    groupedTimestampSwipeOffset: timestampSwipeOffset,
  });

  const contentOffsetClass = inlineAuthorOnDesktop
    ? ""
    : getContentOffsetClass(compact);
  const reactionsRow = (drop.metadata.length > 0 || showInteractions) && (
    <div
      className={`tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 md:tw-mx-2 ${contentOffsetClass}`}
    >
      {drop.metadata.length > 0 && (
        <WaveDropMetadata metadata={drop.metadata} />
      )}
      {showInteractions && !!drop.raters_count && (
        <WaveDropRatings drop={drop} />
      )}
      {showInteractions && <WaveDropReactions drop={drop} />}
    </div>
  );
  const shouldOffsetFooter = shouldOffsetFooterRow({
    inlineAuthorOnDesktop,
    showAuthorInfo,
    shouldGroupWithPreviousDrop,
    isProfileView,
  });
  const footerOffsetClass = shouldOffsetFooter ? contentOffsetClass : "";
  const footerRow = hasDropFooter(footer) && (
    <div className={`tw-mt-2 md:tw-mx-2 ${footerOffsetClass}`}>{footer}</div>
  );
  const outerClass = getWaveDropOuterClass({
    isDrop,
    location,
    isProfileView,
  });
  const groupedTimestampTransitionClass = isTimestampSwipeDragging
    ? "tw-will-change-transform"
    : "tw-transition-transform tw-duration-150 tw-ease-out";
  const swipeableContentClass = `tw-relative tw-z-10 ${
    showGroupedTimestamp ? groupedTimestampTransitionClass : ""
  }`;
  const swipeableContentStyle =
    getGroupedTimestampContentStyle(timestampSwipeOffset);

  return (
    <div className={outerClass}>
      <div
        ref={dropRef}
        className={dropClasses}
        data-wave-drop-id={drop.stableHash}
        data-serial-no={drop.serial_no}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        {showGroupedTimestamp && (
          <GroupedDropTimestamp
            swipeOffset={timestampSwipeOffset}
            timestamp={drop.created_at}
          />
        )}
        <div
          className={swipeableContentClass}
          data-testid={
            showGroupedTimestamp ? "grouped-drop-swipeable-content" : undefined
          }
          style={swipeableContentStyle}
        >
          {wrapContentOnly ? wrapContentOnly(contentBlock) : contentBlock}
          {reactionsRow}
          {footerRow}
        </div>
        <DropBoostAnimation
          animation={boostAnimation}
          onComplete={handleBoostAnimationComplete}
        />
      </div>
    </div>
  );
};

const WaveDrop = withWaveDropMobileMenuProvider(WaveDropInner);

export default memo(WaveDrop);
