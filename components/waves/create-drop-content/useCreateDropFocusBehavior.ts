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

      // iOS needs focus during the reply gesture's activation. Deferring it
      // until after the reply animation can select the editor without an IME.
      createDropInputRef.current?.focus();
      return;
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
  }, [activeDrop, isApp, createDropInputRef, focusOnInitialActiveDrop]);
}
