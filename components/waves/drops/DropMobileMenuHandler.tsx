"use client";

import React, { useCallback, useRef, useState } from "react";
import WaveDropMobileMenu from "./WaveDropMobileMenu";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";

interface DropMobileMenuHandlerProps {
  readonly drop: ExtendedDrop;
  readonly children: React.ReactNode;
  readonly showReplyAndQuote: boolean;
  readonly onReply: () => void;
  readonly onQuote: () => void;
}

const LONG_PRESS_DURATION = 500; // milliseconds
const MOVE_THRESHOLD = 10; // pixels

export default function DropMobileMenuHandler({
  drop,
  children,
  showReplyAndQuote,
  onReply,
  onQuote,
}: DropMobileMenuHandlerProps) {
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const isMobile = useIsMobileDevice();

  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleLongPress = useCallback(() => {
    if (!isMobile) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [isMobile]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isTemporaryDrop) return;

    // Prevent text selection highlighting during long press
    if (isMobile) {
      e.preventDefault();
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;

    longPressTimeout.current = setTimeout(() => {
      setLongPressTriggered(true);
      handleLongPress();
    }, LONG_PRESS_DURATION);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Prevent scrolling/selection during long press detection
    if (isMobile && longPressTimeout.current) {
      e.preventDefault();
    }

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    const deltaX = Math.abs(touchX - touchStartX.current);
    const deltaY = Math.abs(touchY - touchStartY.current);

    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    setLongPressTriggered(false);
  };

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply();
  }, [onReply]);

  const handleOnQuote = useCallback(() => {
    setIsSlideUp(false);
    onQuote();
  }, [onQuote]);

  const handleOnAddReaction = useCallback(() => {
    setIsSlideUp(false);
  }, []);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}>
      {children} {/* Mobile menu */}
      <WaveDropMobileMenu
        drop={drop}
        isOpen={isSlideUp}
        longPressTriggered={longPressTriggered}
        showReplyAndQuote={showReplyAndQuote}
        setOpen={setIsSlideUp}
        onReply={handleOnReply}
        onQuote={handleOnQuote}
        onAddReaction={handleOnAddReaction}
      />
    </div>
  );
}
