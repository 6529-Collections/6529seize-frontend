"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import WaveDropMobileMenu from "./WaveDropMobileMenu";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";

interface DropMobileMenuHandlerProps {
  readonly drop: ExtendedDrop;
  readonly children: React.ReactNode;
  readonly showReplyAndQuote: boolean;
  readonly onReply: () => void;
}

const LONG_PRESS_DURATION = 500; // milliseconds
const MOVE_THRESHOLD = 10; // pixels
const SUPPRESS_CLICK_AFTER_LONG_PRESS_MS = 750;

export default function DropMobileMenuHandler({
  drop,
  children,
  showReplyAndQuote,
  onReply,
}: DropMobileMenuHandlerProps) {
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const { canUseTouchActionSheet } = useDropActionInteractionMode();

  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const suppressClickTimeout = useRef<NodeJS.Timeout | null>(null);
  const shouldSuppressNextClick = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const clearSuppressNextClick = useCallback(() => {
    if (suppressClickTimeout.current) {
      clearTimeout(suppressClickTimeout.current);
      suppressClickTimeout.current = null;
    }

    shouldSuppressNextClick.current = false;
  }, []);

  const markSuppressNextClick = useCallback(() => {
    shouldSuppressNextClick.current = true;

    if (suppressClickTimeout.current) {
      clearTimeout(suppressClickTimeout.current);
    }

    suppressClickTimeout.current = setTimeout(() => {
      shouldSuppressNextClick.current = false;
      suppressClickTimeout.current = null;
    }, SUPPRESS_CLICK_AFTER_LONG_PRESS_MS);
  }, []);

  const handleLongPress = useCallback(() => {
    if (!canUseTouchActionSheet) return;
    markSuppressNextClick();
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [canUseTouchActionSheet, markSuppressNextClick]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isTemporaryDrop || !canUseTouchActionSheet) return;

    touchStartX.current = e.touches[0]!.clientX;
    touchStartY.current = e.touches[0]!.clientY;

    longPressTimeout.current = setTimeout(() => {
      handleLongPress();
    }, LONG_PRESS_DURATION);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Prevent scrolling/selection during long press detection
    if (canUseTouchActionSheet && longPressTimeout.current) {
      e.preventDefault();
    }

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
    setLongPressTriggered(false);
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!shouldSuppressNextClick.current) return;

    clearSuppressNextClick();
    e.preventDefault();
    e.stopPropagation();
  };

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply();
  }, [onReply]);

  const handleOnAddReaction = useCallback(() => {
    setIsSlideUp(false);
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }

      clearSuppressNextClick();
    };
  }, [clearSuppressNextClick]);

  return (
    <div
      onClickCapture={handleClickCapture}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children} {/* Mobile menu */}
      <WaveDropMobileMenu
        drop={drop}
        isOpen={isSlideUp && canUseTouchActionSheet}
        longPressTriggered={longPressTriggered}
        showReplyAndQuote={showReplyAndQuote}
        setOpen={setIsSlideUp}
        onReply={handleOnReply}
        onAddReaction={handleOnAddReaction}
      />
    </div>
  );
}
