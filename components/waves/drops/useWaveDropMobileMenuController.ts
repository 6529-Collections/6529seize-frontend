"use client";

import { useCallback, useEffect, useId } from "react";
import {
  useWaveDropMobileMenu,
  type WaveDropMobileMenuRequest,
} from "./WaveDropMobileMenuContext";

type WaveDropMobileMenuControllerInput = WaveDropMobileMenuRequest & {
  readonly enabled: boolean;
  readonly isOpen: boolean;
  readonly interactionScopeKey: string;
};

export const useWaveDropMobileMenuController = ({
  drop,
  enabled,
  isOpen,
  interactionScopeKey,
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
  showOnlyQuickRemove,
  standaloneQuickRemoveCuration,
}: WaveDropMobileMenuControllerInput) => {
  const mobileMenu = useWaveDropMobileMenu();
  const ownerId = useId();
  useEffect(() => {
    if (!enabled || !isOpen) {
      mobileMenu?.closeDrop(drop.id, ownerId);
      return;
    }

    mobileMenu?.open({
      drop,
      ownerId,
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
      showOnlyQuickRemove,
      standaloneQuickRemoveCuration,
    });
  }, [
    drop,
    enabled,
    isOpen,
    interactionScopeKey,
    longPressTriggered,
    mobileMenu,
    ownerId,
    onAddReaction,
    onBoostAnimation,
    onEdit,
    onOpenChange,
    onReply,
    showCopyOption,
    showOpenOption,
    showReplyAndQuote,
    showVoting,
    showOnlyQuickRemove,
    standaloneQuickRemoveCuration,
  ]);

  useEffect(() => {
    return () => {
      mobileMenu?.clearDrop(drop.id, ownerId);
    };
  }, [drop.id, mobileMenu, interactionScopeKey, ownerId]);

  return useCallback(() => {
    mobileMenu?.close();
  }, [mobileMenu]);
};
