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
import { selectEditingDropId, setEditingDropId } from "@/store/editSlice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import WaveDropMobileMenu from "./WaveDropMobileMenu";
import WaveDropRatings from "./WaveDropRatings";
import WaveDropReactions from "./WaveDropReactions";
import WaveDropReply from "./WaveDropReply";

const GROUPING_TIME_DIFFERENCE_MS = 60_000;

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

  const touch = event.touches[0];
  touchStartPosition.current = { x: touch!.clientX, y: touch!.clientY };
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

  const touch = event.touches[0];
  const moveThreshold = 10;
  const deltaX = Math.abs(touch!.clientX - touchStartPosition.current.x);
  const deltaY = Math.abs(touch!.clientY - touchStartPosition.current.y);

  if (deltaX > moveThreshold || deltaY > moveThreshold) {
    clearLongPressTimeout({ longPressTimeoutRef });
  }
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

const WaveDrop = ({
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
  const [boostAnimation, setBoostAnimation] =
    useState<BoostAnimationState | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const editingDropId = useSelector(selectEditingDropId);
  const isEditing = editingDropId === drop.id;
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosition = useRef<{ x: number; y: number } | null>(null);
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
  const allowLongPress = showInteractions && canUseTouchActionSheet;
  const compact = useCompactMode();
  const hasActiveLinkCardActions = activeLinkCardActionIds.length > 0;

  const isProfileView = location === DropLocation.PROFILE;
  const showAuthorInfo = shouldShowAuthorInfo({
    identityMode,
    shouldGroupWithPreviousDrop,
    isProfileView,
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

  const handleLongPress = useCallback(() => {
    if (!allowLongPress) return;
    markNextClickForSuppression();
    // Cancel any active edit mode first
    if (editingDropId) {
      dispatch(setEditingDropId(null));
    }
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [allowLongPress, editingDropId, dispatch, markNextClickForSuppression]);

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
    },
    [allowLongPress, handleLongPress, isEditing]
  );

  const handleTouchEnd = useCallback(() => {
    handleTouchEndInternal({
      longPressTimeoutRef,
      touchStartPosition,
    });
    releaseSuppressionAfterTouchEnd();
  }, [releaseSuppressionAfterTouchEnd]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleTouchMoveInternal({
        allowLongPress,
        event: e,
        touchStartPosition,
        longPressTimeoutRef,
      });
    },
    [allowLongPress]
  );

  const handleOnReply = useCallback(() => {
    // Cancel any active edit mode first
    if (editingDropId) {
      dispatch(setEditingDropId(null));
    }
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]!.part_id });
  }, [onReply, drop, activePartIndex, editingDropId, dispatch]);

  const handleOnAddReaction = useCallback(() => {
    // Cancel any active edit mode first
    if (editingDropId) {
      dispatch(setEditingDropId(null));
    }
    setIsSlideUp(false);
  }, [editingDropId, dispatch]);

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
    setIsSlideUp(false); // Close mobile menu when entering edit mode
    dispatch(setEditingDropId(drop.id));
  }, [dispatch, drop.id]);

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
      dispatch(setEditingDropId(null));

      // Execute the mutation
      dropUpdateMutation.mutate({
        dropId: drop.id,
        request: updateRequest,
        currentDrop: drop,
      });
    },
    [drop, activePartIndex, dropUpdateMutation, dispatch]
  );

  const handleEditCancel = useCallback(() => {
    dispatch(setEditingDropId(null));
  }, [dispatch]);

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
    setIsSlideUp(false);
    setLongPressTriggered(false);
    clearSuppression();
  }, [canUseTouchActionSheet, clearSuppression]);

  // Derive effective menu state - menu can't be open while editing
  const effectiveIsSlideUp = isSlideUp && !isEditing && canUseTouchActionSheet;

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
        onClickCapture={handleClickCapture}
      >
        {wrapContentOnly ? wrapContentOnly(contentBlock) : contentBlock}
        {reactionsRow}
        {footerRow}
        {showInteractions && (
          <WaveDropMobileMenu
            drop={drop}
            isOpen={effectiveIsSlideUp}
            longPressTriggered={longPressTriggered}
            showReplyAndQuote={showReplyAndQuote}
            setOpen={setIsSlideUp}
            onReply={handleOnReply}
            onAddReaction={handleOnAddReaction}
            onEdit={handleOnEdit}
            onBoostAnimation={handleMobileBoostAnimation}
          />
        )}
        <DropBoostAnimation
          animation={boostAnimation}
          onComplete={handleBoostAnimationComplete}
        />
      </div>
    </div>
  );
};

export default memo(WaveDrop);
