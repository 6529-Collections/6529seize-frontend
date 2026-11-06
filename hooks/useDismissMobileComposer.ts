"use client";

import { useCallback } from "react";
import useDeviceInfo from "./useDeviceInfo";

/** Android can retain its soft keyboard after the web input loses focus. */
export async function hideAndroidComposerKeyboard(): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.getPlatform() !== "android") {
    return;
  }

  const { Keyboard } = await import("@capacitor/keyboard");
  await Keyboard.hide();
}

/** End mobile composition after an accepted send without changing desktop focus. */
export function useDismissMobileComposer() {
  const { isApp, isMobileDevice, hasTouchScreen } = useDeviceInfo();

  return useCallback(
    (input: Pick<HTMLElement, "blur"> | null) => {
      if (!input || !(isApp || isMobileDevice || hasTouchScreen)) {
        return;
      }

      input.blur();
      if (isApp) {
        // Keyboard cleanup must never turn an accepted send into a failure.
        hideAndroidComposerKeyboard().catch(() => {});
      }
    },
    [hasTouchScreen, isApp, isMobileDevice]
  );
}
