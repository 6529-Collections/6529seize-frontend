"use client";

import { useCompactMode } from "@/contexts/CompactModeContext";
import type { ApiCreateDropPart } from "@/generated/models/ApiCreateDropPart";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiUpdateDropRequest } from "@/generated/models/ApiUpdateDropRequest";
import { useDropUpdateMutation } from "@/hooks/drops/useDropUpdateMutation";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import useLongPressClickSuppression from "@/hooks/useLongPressClickSuppression";
import { useEditingDrop } from "@/contexts/EditingDropContext";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";


import { DropLocation, hasDropFooter } from "./drop.types";
import type { BoostAnimationState } from "./DropBoostAnimation";
import DropBoostAnimation from "./DropBoostAnimation";
import WaveDropActions from "./WaveDropActions";
import WaveDropMetadata from "./WaveDropMetadata";
import {
  useWaveDropMobileMenu,
  withWaveDropMobileMenuProvider,
} from "./WaveDropMobileMenuContext";
import { useWaveDropMobileMenuController } from "./useWaveDropMobileMenuController";
import WaveDropRatings from "./WaveDropRatings";
import WaveDropReactions from "./WaveDropReactions";
import {
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
} from "./WaveDrop.helpers";
import type { WaveDropProps } from "./WaveDrop.types";

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
  // Pointer-driven row hover: some browsers (capability-lying convertibles)
  // never activate CSS :hover although mouse pointer events flow, leaving the
  // group-hover action reveal invisible. Track the cursor with pointer events
  // instead; CSS :hover stays as the no-JS fallback. pointerover/out (with a
  // containment check) rather than enter/leave so child crossings are cheap
  // no-op state writes and jsdom can exercise the path.
  const [isRowPointerHovered, setIsRowPointerHovered] = useState(false);
  const handleRowPointerOver = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (getPointerType(event) === "mouse" && canUseDesktopHoverActions) {
        setIsRowPointerHovered(true);
      }
    },
    [canUseDesktopHoverActions]
  );
  const handleRowPointerOut = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        getPointerType(event) === "mouse" &&
        !(
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        )
      ) {
        setIsRowPointerHovered(false);
      }
    },
    []
  );
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
        // Pointer-driven timestamp swipe only belongs to touch-sheet mode
        // (e.g. pen on a touch-first device). On desktop it would hijack
        // drag-to-select — the timestamp reveals on hover there instead.
        !canUseTouchActionSheet ||
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
    [canUseTouchActionSheet, isEditing, showGroupedTimestamp]
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
        onPointerOver={handleRowPointerOver}
        onPointerOut={handleRowPointerOut}
        onClickCapture={handleClickCapture}
      >
        {showGroupedTimestamp && (
          <GroupedDropTimestamp
            swipeOffset={timestampSwipeOffset}
            timestamp={drop.created_at}
            variant={canUseTouchActionSheet ? "swipe" : "hover"}
            forceVisible={isRowPointerHovered}
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
                forceVisible={isRowPointerHovered}
                style={getGroupedTimestampActionStyle(timestampSwipeOffset)}
              />
            )}
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
