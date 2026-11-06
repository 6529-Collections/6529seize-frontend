"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { useBlurOnNativeKeyboardDismiss } from "@/hooks/useBlurOnNativeKeyboardDismiss";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { CreateDropInputHandles } from "../CreateDropInput";

interface UseCreateDropFocusBehaviorParams {
  readonly activeDrop: ActiveDropState | null;
  readonly isApp: boolean;
  readonly focusOnInitialActiveDrop: boolean;
  readonly createDropInputRef: MutableRefObject<CreateDropInputHandles | null>;
}

export function useCreateDropFocusBehavior({
  activeDrop,
  isApp,
  focusOnInitialActiveDrop,
  createDropInputRef,
}: UseCreateDropFocusBehaviorParams) {
  const blurInput = useCallback(
    () => createDropInputRef.current?.blur(),
    [createDropInputRef]
  );
  useBlurOnNativeKeyboardDismiss(blurInput, isApp && activeDrop !== null);
  const isInitialMountRef = useRef(true);

  const scheduleMobileInputFocus = useCallback(
    (delayMs: number) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const frameId = requestAnimationFrame(() => {
        if (delayMs <= 0) {
          createDropInputRef.current?.focus();
          return;
        }

        timeoutId = setTimeout(() => {
          createDropInputRef.current?.focus();
        }, delayMs);
      });

      return () => {
        cancelAnimationFrame(frameId);
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      };
    },
    [createDropInputRef]
  );

  useLayoutEffect(() => {
    const isInitialMount = isInitialMountRef.current;

    if (!activeDrop) {
      isInitialMountRef.current = false;
      return;
    }

    // Most app composers should not open the keyboard on page load. Surfaces
    // that mount only after a user reply action can opt into initial focus.
    if (isApp && isInitialMount && !focusOnInitialActiveDrop) {
      const timer = setTimeout(() => {
        isInitialMountRef.current = false;
      }, 0);
      return () => clearTimeout(timer);
    }

    isInitialMountRef.current = false;
    const shouldFocusInitialActiveDrop =
      focusOnInitialActiveDrop && isInitialMount;

    if (isApp) {
      if (shouldFocusInitialActiveDrop) {
        createDropInputRef.current?.focus();
        return;
      }

      if (focusOnInitialActiveDrop) {
        return;
      }

      let cancelScheduledFocus: (() => void) | undefined;
      const timer = setTimeout(() => {
        cancelScheduledFocus = scheduleMobileInputFocus(300);
      }, 200);

      return () => {
        clearTimeout(timer);
        cancelScheduledFocus?.();
      };
    }

    if (shouldFocusInitialActiveDrop) {
      createDropInputRef.current?.focus();
      return;
    }

    if (focusOnInitialActiveDrop) {
      return;
    }

    const timer = setTimeout(() => {
      createDropInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeDrop, isApp, scheduleMobileInputFocus, focusOnInitialActiveDrop]);
}
