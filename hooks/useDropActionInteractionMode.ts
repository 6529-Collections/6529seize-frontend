"use client";

import { useSyncExternalStore } from "react";
import {
  hasHoverCapability,
  subscribeToTouchFirstChanges,
} from "@/helpers/touch-first.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

interface DropActionInteractionMode {
  readonly hasTouchActionInput: boolean;
  readonly hasHoverActionInput: boolean;
  readonly canUseDesktopHoverActions: boolean;
  readonly canUseTouchActionSheet: boolean;
}

// hasHoverCapability includes behavioral fine-pointer evidence, so browsers
// that mis-report "no hover" still get hover actions once a mouse is seen.
const getHasHoverInput = (): boolean => hasHoverCapability();

const subscribeToHoverInput = (onStoreChange: () => void) =>
  subscribeToTouchFirstChanges(onStoreChange);

const getServerHoverInputSnapshot = () => false;

const useHasHoverInput = (): boolean =>
  useSyncExternalStore(
    subscribeToHoverInput,
    getHasHoverInput,
    getServerHoverInputSnapshot
  );

export default function useDropActionInteractionMode(): DropActionInteractionMode {
  const isMobileDevice = useIsMobileDevice();
  const isTouchDevice = useIsTouchDevice();
  const hasTouchInput = useHasTouchInput();
  const hasHoverActionInput = useHasHoverInput();
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  // Raw touch capability only counts when no hover input exists — otherwise
  // hybrid devices (touch-screen laptops) would lose desktop hover actions.
  const hasTouchActionInput =
    isMobileDevice || isTouchDevice || (hasTouchInput && !hasHoverActionInput);
  const canUseTouchActionSheet =
    hasTouchActionInput && (isMobileLayoutViewport || !hasHoverActionInput);

  return {
    hasTouchActionInput,
    hasHoverActionInput,
    canUseDesktopHoverActions: hasHoverActionInput && !canUseTouchActionSheet,
    canUseTouchActionSheet,
  };
}
