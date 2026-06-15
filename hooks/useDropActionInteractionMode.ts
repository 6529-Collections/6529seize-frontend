"use client";

import { useEffect, useState } from "react";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

const HOVER_INPUT_MEDIA_QUERIES = [
  "(any-hover: hover)",
  "(hover: hover)",
] as const;

export interface DropActionInteractionMode {
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

const useHasHoverInput = (): boolean => {
  const [hasHoverInput, setHasHoverInput] = useState(getHasHoverInput);

  useEffect(() => {
    const win = globalThis as typeof globalThis & {
      matchMedia?: (query: string) => MediaQueryList;
    };

    const matchMedia = win.matchMedia;
    if (!matchMedia) {
      setHasHoverInput(false);
      return;
    }

    const mediaQueries = HOVER_INPUT_MEDIA_QUERIES.map((query) =>
      matchMedia(query)
    );
    const updateHasHoverInput = () => setHasHoverInput(getHasHoverInput());

    updateHasHoverInput();

    mediaQueries.forEach((mediaQuery) => {
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", updateHasHoverInput);
        return;
      }

      if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(updateHasHoverInput);
      }
    });

    return () => {
      mediaQueries.forEach((mediaQuery) => {
        if (typeof mediaQuery.removeEventListener === "function") {
          mediaQuery.removeEventListener("change", updateHasHoverInput);
          return;
        }

        if (typeof mediaQuery.removeListener === "function") {
          mediaQuery.removeListener(updateHasHoverInput);
        }
      });
    };
  }, []);

  return hasHoverInput;
};

export default function useDropActionInteractionMode(): DropActionInteractionMode {
  const isMobileDevice = useIsMobileDevice();
  const isTouchDevice = useIsTouchDevice();
  const hasTouchInput = useHasTouchInput();
  const hasHoverActionInput = useHasHoverInput();
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const hasTouchActionInput = isMobileDevice || isTouchDevice || hasTouchInput;
  const canUseTouchActionSheet =
    hasTouchActionInput && (isMobileLayoutViewport || !hasHoverActionInput);

  return {
    hasTouchActionInput,
    hasHoverActionInput,
    canUseDesktopHoverActions: hasHoverActionInput && !canUseTouchActionSheet,
    canUseTouchActionSheet,
  };
}
