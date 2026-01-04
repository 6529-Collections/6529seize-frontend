"use client";

import { useCompactMode } from "@/contexts/CompactModeContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiUpdateDropRequest } from "@/generated/models/ApiUpdateDropRequest";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropUpdateMutation } from "@/hooks/drops/useDropUpdateMutation";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { selectEditingDropId, setEditingDropId } from "@/store/editSlice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DropInteractionParams} from "./Drop";
import { DropLocation } from "./Drop";
import WaveDropActions from "./WaveDropActions";
import WaveDropAuthorPfp from "./WaveDropAuthorPfp";
import WaveDropContent from "./WaveDropContent";
import WaveDropHeader from "./WaveDropHeader";
import WaveDropMetadata from "./WaveDropMetadata";
import WaveDropMobileMenu from "./WaveDropMobileMenu";
import WaveDropRatings from "./WaveDropRatings";
import WaveDropReactions from "./WaveDropReactions";
import WaveDropReply from "./WaveDropReply";

enum GroupingThreshold {
  TIME_DIFFERENCE = 60000,
}

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
    GroupingThreshold.TIME_DIFFERENCE;

  if (!isSameAuthor || !isWithinTimeThreshold) {
    return false;
  }

  const bothNotReplies = !currentDrop.reply_to && !otherDrop.reply_to;
  const repliesInSameThread =
    currentDrop.reply_to?.drop_id === otherDrop.reply_to?.drop_id;

  return bothNotReplies || repliesInSameThread;
};

const RANK_STYLES = {
  1: "tw-border-l tw-border-[#E8D48A]/40 tw-border-y-0 tw-border-r-0",
  2: "tw-border-l tw-border-[#DDDDDD]/40 tw-border-y-0 tw-border-r-0",
  3: "tw-border-l tw-border-[#CD7F32]/40 tw-border-y-0 tw-border-r-0",
  default: "tw-border-l tw-border-iron-600/40 tw-border-y-0 tw-border-r-0",
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
    return "tw-bg-[#3CCB7F]/10 tw-border-l tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0";
  }

  if (!isDrop) {
    const isWaveView = location === DropLocation.WAVE;
    const hoverClass = isWaveView
      ? "desktop-hover:hover:tw-bg-iron-800/50"
      : "";
    const ringClasses = !isWaveView
      ? "tw-ring-1 tw-ring-inset tw-ring-iron-800"
      : "";
    const bgClass = !isWaveView ? "tw-bg-iron-950" : "";

    return `${bgClass} ${ringClasses} ${hoverClass}`.trim();
  }

  const rankClass =
    RANK_STYLES[rank as keyof typeof RANK_STYLES] ?? RANK_STYLES.default;
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
    "touch-select-none tw-cursor-default tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-transition-colors tw-duration-300";

  const streamClasses = "tw-rounded-xl";

  const chatDropClasses = isDrop ? "tw-rounded-lg tw-my-0.5" : "";

  const rankClasses = getColorClasses({ isActiveDrop, rank, isDrop, location });

  const locationClasses =
    location === DropLocation.MY_STREAM || location === DropLocation.PROFILE
      ? streamClasses
      : chatDropClasses;

  return `${baseClasses} ${groupingClass} ${locationClasses} ${rankClasses}`.trim();
};

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
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
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
  onQuote,
  onReplyClick,
  onQuoteClick,
  onDropContentClick,
  showReplyAndQuote,
}: WaveDropProps) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const dispatch = useDispatch();
  const editingDropId = useSelector(selectEditingDropId);
  const isEditing = editingDropId === drop.id;
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosition = useRef<{ x: number; y: number } | null>(null);
  const dropUpdateMutation = useDropUpdateMutation();
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isStorm = drop.parts.length > 1;
  const isDrop = drop.drop_type === ApiDropType.Participatory;

  const shouldGroupWithPreviousDrop =
    !isDrop && shouldGroupWithDrop(drop, previousDrop);

  const shouldGroupWithNextDrop =
    !isDrop && shouldGroupWithDrop(drop, nextDrop);

  const isMobile = useIsMobileDevice();
  const compact = useCompactMode();

  const isProfileView = location === DropLocation.PROFILE;
  const showAuthorInfo = !shouldGroupWithPreviousDrop || isProfileView;

  const getGroupingClass = () => {
    if (isProfileView) return "tw-py-4";
    if (shouldGroupWithPreviousDrop) return "tw-pt-1";
    if (shouldGroupWithNextDrop) return "tw-pt-4 tw-pb-1";
    return "tw-py-4";
  };

  const groupingClass = getGroupingClass();

  const handleLongPress = useCallback(() => {
    if (!isMobile) return;
    // Cancel any active edit mode first
    if (editingDropId) {
      dispatch(setEditingDropId(null));
    }
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [isMobile, editingDropId, dispatch]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return;
      // Don't allow mobile menu when in edit mode
      if (isEditing) return;
      const touch = e.touches[0];
      touchStartPosition.current = { x: touch!.clientX, y: touch!.clientY };
      longPressTimeoutRef.current = setTimeout(handleLongPress, 500);
    },
    [isMobile, handleLongPress, isEditing]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    touchStartPosition.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPosition.current) return;

    const touch = e.touches[0];
    const moveThreshold = 10; // pixels

    const deltaX = Math.abs(touch!.clientX - touchStartPosition.current.x);
    const deltaY = Math.abs(touch!.clientY - touchStartPosition.current.y);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    }
  }, []);

  const handleOnReply = useCallback(() => {
    // Cancel any active edit mode first
    if (editingDropId) {
      dispatch(setEditingDropId(null));
    }
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]!.part_id });
  }, [onReply, drop, activePartIndex, editingDropId, dispatch]);

  const handleOnQuote = useCallback(() => {
    // Cancel any active edit mode first
    if (editingDropId) {
      dispatch(setEditingDropId(null));
    }
    setIsSlideUp(false);
    onQuote({ drop, partId: drop.parts[activePartIndex]!.part_id });
  }, [onQuote, drop, activePartIndex, editingDropId, dispatch]);

  const handleOnAddReaction = useCallback(() => {
    // Cancel any active edit mode first
    if (editingDropId) {
      dispatch(setEditingDropId(null));
    }
    setIsSlideUp(false);
  }, [editingDropId, dispatch]);

  const handleOnEdit = useCallback(() => {
    setIsSlideUp(false); // Close mobile menu when entering edit mode
    dispatch(setEditingDropId(drop.id));
  }, [dispatch, drop.id]);

  const handleEditSave = useCallback(
    async (newContent: string, mentions?: ApiDropMentionedUser[]) => {
      // Clean mentioned users to only include allowed fields for API
      const cleanedMentions = (mentions || drop.mentioned_users).map(
        (user) => ({
          mentioned_profile_id: user.mentioned_profile_id,
          handle_in_content: user.handle_in_content,
          // Exclude current_handle as it's not allowed in update requests
        })
      );

      const updateRequest: ApiUpdateDropRequest = {
        parts: drop.parts.map((part, index) => ({
          content: index === activePartIndex ? newContent : part.content,
          quoted_drop: part.quoted_drop || null,
          media: part.media || [],
        })),
        title: drop.title,
        metadata: drop.metadata,
        referenced_nfts: drop.referenced_nfts,
        mentioned_users: cleanedMentions,
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

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  // Close mobile menu if in edit mode
  useEffect(() => {
    if (isEditing && isSlideUp) {
      setIsSlideUp(false);
    }
  }, [isEditing]);

  const dropClasses = getDropClasses(
    isActiveDrop,
    groupingClass,
    location,
    drop.rank,
    isDrop
  );

  return (
    <div
      className={`${
        isDrop && location === DropLocation.WAVE ? "tw-py-0.5 tw-px-4" : ""
      } ${isProfileView ? "tw-mb-3" : ""} tw-w-full`}
    >
      <div
        className={dropClasses}
        data-wave-drop-id={drop.stableHash ?? drop.id}
        data-serial-no={drop.serial_no}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {drop.reply_to &&
          (drop.reply_to.drop_id !== previousDrop?.reply_to?.drop_id ||
            drop.author.handle !== previousDrop?.author.handle) &&
          drop.reply_to.drop_id !== dropViewDropId && (
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
        <div className="tw-flex tw-gap-x-3 tw-relative tw-z-10 tw-w-full tw-text-left tw-bg-transparent tw-border-0">
          {showAuthorInfo && <WaveDropAuthorPfp drop={drop} />}
          <div
            className="tw-flex tw-flex-col tw-w-full tw-gap-y-1"
            style={{
              maxWidth: showAuthorInfo ? "calc(100% - 3.5rem)" : "100%",
            }}
          >
            {showAuthorInfo && (
              <WaveDropHeader
                drop={drop}
                showWaveInfo={showWaveInfo}
                isStorm={isStorm}
                currentPartIndex={activePartIndex}
                partsCount={drop.parts.length}
              />
            )}
            <div
              className={
                shouldGroupWithPreviousDrop && !isProfileView
                  ? "tw-ml-[3.25rem]"
                  : ""
              }
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
                isSaving={dropUpdateMutation.isPending}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
              />
            </div>
          </div>
        </div>
        {!isMobile && showReplyAndQuote && !isEditing && (
          <WaveDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            onReply={handleOnReply}
            onQuote={handleOnQuote}
            onEdit={handleOnEdit}
          />
        )}
        <div
          className={`tw-mx-2 tw-flex tw-items-center tw-gap-x-2 tw-gap-y-1 tw-flex-wrap ${
            compact
              ? "tw-ml-[2.75rem] tw-w-[calc(100%-2.5rem)]"
              : "tw-ml-[3.25rem] tw-w-[calc(100%-3.25rem)]"
          }`}
        >
          {drop.metadata.length > 0 && (
            <WaveDropMetadata metadata={drop.metadata} />
          )}
          {!!drop.raters_count && <WaveDropRatings drop={drop} />}
          <WaveDropReactions drop={drop} />
        </div>
        <WaveDropMobileMenu
          drop={drop}
          isOpen={isSlideUp}
          longPressTriggered={longPressTriggered}
          showReplyAndQuote={showReplyAndQuote}
          setOpen={setIsSlideUp}
          onReply={handleOnReply}
          onQuote={handleOnQuote}
          onAddReaction={handleOnAddReaction}
          onEdit={handleOnEdit}
        />
      </div>
    </div>
  );
};

export default memo(WaveDrop);
