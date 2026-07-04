"use client";

import { useCallback, useEffect } from "react";
import {
  useWaveDropMobileMenu,
  type WaveDropMobileMenuRequest,
} from "./WaveDropMobileMenuContext";

type WaveDropMobileMenuControllerInput = WaveDropMobileMenuRequest & {
  readonly enabled: boolean;
  readonly isOpen: boolean;
};

export const useWaveDropMobileMenuController = ({
  drop,
  enabled,
  isOpen,
  longPressTriggered,
  onAddReaction,
  onBoostAnimation,
  onEdit,
  onOpenChange,
  onReply,
  showCopyOption,
  showOpenOption,
  showReplyAndQuote,
  showVoting,
}: WaveDropMobileMenuControllerInput) => {
  const mobileMenu = useWaveDropMobileMenu();

  useEffect(() => {
    if (!enabled || !isOpen) {
      return;
    }

    mobileMenu?.open({
      drop,
      longPressTriggered,
      showReplyAndQuote,
      onOpenChange,
      onReply,
      onAddReaction,
      onEdit,
      onBoostAnimation,
      showOpenOption,
      showCopyOption,
      showVoting,
    });
  }, [
    drop,
    enabled,
    isOpen,
    longPressTriggered,
    mobileMenu,
    onAddReaction,
    onBoostAnimation,
    onEdit,
    onOpenChange,
    onReply,
    showCopyOption,
    showOpenOption,
    showReplyAndQuote,
    showVoting,
  ]);

  useEffect(() => {
    return () => {
      mobileMenu?.clearDrop(drop.id);
    };
  }, [drop.id, mobileMenu]);

  return useCallback(() => {
    mobileMenu?.close();
  }, [mobileMenu]);
};
