"use client";

import { useSyncExternalStore } from "react";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

const HOVER_INPUT_MEDIA_QUERIES = [
  "(any-hover: hover)",
  "(hover: hover)",
] as const;

interface DropActionInteractionMode {
  readonly hasTouchActionInput: boolean;
  readonly hasHoverActionInput: boolean;
  readonly canUseDesktopHoverActions: boolean;
  readonly canUseTouchActionSheet: boolean;
}

const getHasHoverInput = (): boolean => {
  const win = globalThis as typeof globalThis & {
    matchMedia?: (query: string) => MediaQueryList;
  };

  return HOVER_INPUT_MEDIA_QUERIES.some(
    (query) => win.matchMedia?.(query)?.matches ?? false
  );
};

const subscribeToHoverInput = (onStoreChange: () => void) => {
  const win = globalThis as typeof globalThis & {
    matchMedia?: (query: string) => MediaQueryList;
  };

  const matchMedia = win.matchMedia;
  if (!matchMedia) {
    return () => undefined;
  }

  const mediaQueries = HOVER_INPUT_MEDIA_QUERIES.map((query) =>
    matchMedia(query)
  );

  mediaQueries.forEach((mediaQuery) => {
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onStoreChange);
      return;
    }

    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(onStoreChange);
    }
  });

  return () => {
    mediaQueries.forEach((mediaQuery) => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", onStoreChange);
        return;
      }

      if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(onStoreChange);
      }
    });
  };
};

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
