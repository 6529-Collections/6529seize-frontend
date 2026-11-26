"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import useLongPressClickSuppression from "@/hooks/useLongPressClickSuppression";
import { useAuth } from "@/components/auth/Auth";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import { isDropReplyEligible } from "@/helpers/waves/drop-reply-eligibility";
import { useSwipeToReply } from "@/hooks/useSwipeToReply";
import { cancelHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { SwipeReplyHint } from "./SwipeReplyHint";
import {
  useWaveDropMobileMenu,
  withWaveDropMobileMenuProvider,
} from "./WaveDropMobileMenuContext";
import { useWaveDropMobileMenuController } from "./useWaveDropMobileMenuController";

interface DropMobileMenuHandlerProps {
  readonly drop: ExtendedDrop;
  readonly children: React.ReactNode;
  readonly showReplyAndQuote: boolean;
  readonly onReply: () => void;
}

const LONG_PRESS_DURATION = 500; // milliseconds
const MOVE_THRESHOLD = 10; // pixels

function DropMobileMenuHandlerInner({
  drop,
  children,
  showReplyAndQuote,
  onReply,
}: DropMobileMenuHandlerProps) {
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const { canUseTouchActionSheet } = useDropActionInteractionMode();
  const mobileMenu = useWaveDropMobileMenu();
  const { connectedProfile } = useAuth();
  const { getEligibility } = useWaveEligibility();
  const canReply =
    canUseTouchActionSheet &&
    showReplyAndQuote &&
    !isTemporaryDrop &&
    Boolean(connectedProfile?.handle) &&
    isDropReplyEligible(drop, getEligibility(drop.wave.id));

  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const {
    markNextClickForSuppression,
    releaseSuppressionAfterTouchEnd,
    clearSuppression,
    handleClickCapture,
  } = useLongPressClickSuppression();
  const {
    rootRef: swipeRootRef,
    contentRef: swipeContentRef,
    onTouchStart: startReplySwipe,
  } = useSwipeToReply({
    enabled: canReply,
    canReply,
    scope: drop.id,
    onReply: () => handleOnReply(),
    onStart: () => {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
      setLongPressTriggered(false);
      setIsSlideUp(false);
    },
  });

  const handleLongPress = useCallback(() => {
    if (!canUseTouchActionSheet) return;
    cancelHorizontalSwipe();
    markNextClickForSuppression();
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [canUseTouchActionSheet, markNextClickForSuppression]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) {
      handleTouchEnd();
      return;
    }
    if (isTemporaryDrop || !canUseTouchActionSheet) return;
    startReplySwipe(e);

    touchStartX.current = e.touches[0]!.clientX;
    touchStartY.current = e.touches[0]!.clientY;

    longPressTimeout.current = setTimeout(() => {
      handleLongPress();
    }, LONG_PRESS_DURATION);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touchX = e.touches[0]?.clientX;
    const touchY = e.touches[0]?.clientY;

    const deltaX = Math.abs(touchX! - touchStartX.current);
    const deltaY = Math.abs(touchY! - touchStartY.current);

    if (
      (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) &&
      longPressTimeout.current
    ) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    releaseSuppressionAfterTouchEnd();
    setLongPressTriggered(false);
  };

  const handleOnReply = useCallback(() => {
    mobileMenu?.close();
    setIsSlideUp(false);
    onReply();
  }, [mobileMenu, onReply]);

  const handleOnAddReaction = useCallback(() => {
    mobileMenu?.close();
    setIsSlideUp(false);
  }, [mobileMenu]);

  useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (canUseTouchActionSheet) {
      return;
    }

    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    setIsSlideUp(false);
    setLongPressTriggered(false);
    mobileMenu?.close();
    clearSuppression();
  }, [canUseTouchActionSheet, clearSuppression, mobileMenu]);

  const effectiveIsSlideUp = isSlideUp && canUseTouchActionSheet;

  useWaveDropMobileMenuController({
    drop,
    enabled: true,
    isOpen: effectiveIsSlideUp,
    longPressTriggered,
    showReplyAndQuote,
    onOpenChange: setIsSlideUp,
    onReply: handleOnReply,
    onAddReaction: handleOnAddReaction,
  });

  const rootClassName = canUseTouchActionSheet
    ? "touch-action-sheet-select-none"
    : undefined;

  return (
    <div
      ref={swipeRootRef}
      className={`tw-relative ${rootClassName ?? ""}`}
      onClickCapture={handleClickCapture}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {canReply && <SwipeReplyHint />}
      <div
        ref={swipeContentRef}
        style={
          canUseTouchActionSheet
            ? { transform: "var(--message-swipe-transform, none)" }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

export default withWaveDropMobileMenuProvider(DropMobileMenuHandlerInner);
