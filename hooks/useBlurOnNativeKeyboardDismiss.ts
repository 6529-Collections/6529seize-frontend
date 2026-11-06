"use client";

import { useEffect, useRef } from "react";
import { useNativeKeyboard } from "./useNativeKeyboard";

/** Release the native input session after Done or a keyboard-dismiss gesture. */
export function useBlurOnNativeKeyboardDismiss(
  blur: () => void,
  enabled: boolean
) {
  const { isVisible } = useNativeKeyboard();
  const wasVisible = useRef(false);

  useEffect(() => {
    if (!enabled) {
      wasVisible.current = false;
      return;
    }
    if (isVisible) {
      wasVisible.current = true;
      return;
    }
    if (wasVisible.current) {
      wasVisible.current = false;
      blur();
    }
  }, [blur, enabled, isVisible]);
}
