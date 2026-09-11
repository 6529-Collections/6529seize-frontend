import { useEffect, useRef } from "react";
import { PROFILE_DOUBLE_ACTIVATE_DELAY_MS } from "./profile-activation.constants";

export function useProfileDoubleActivate({
  canSwitchAccount,
  openMenu,
  closeMenu,
  switchConnectedAccount,
}: {
  readonly canSwitchAccount: boolean;
  readonly openMenu: () => void;
  readonly closeMenu: () => void;
  readonly switchConnectedAccount: () => boolean;
}) {
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureCleanupRef = useRef<(() => void) | null>(null);

  const clearCapture = () => {
    captureCleanupRef.current?.();
    captureCleanupRef.current = null;
  };

  const clearActivationWindow = () => {
    clearCapture();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startCapture = () => {
    const profileButtonRect = profileButtonRef.current?.getBoundingClientRect();
    if (!profileButtonRect) {
      return;
    }

    const captureNextClick = (event: MouseEvent) => {
      if (event.detail === 0) {
        return;
      }

      const isWithinProfileButton =
        event.clientX >= profileButtonRect.left &&
        event.clientX <= profileButtonRect.right &&
        event.clientY >= profileButtonRect.top &&
        event.clientY <= profileButtonRect.bottom;

      clearActivationWindow();
      if (!isWithinProfileButton) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if (switchConnectedAccount()) {
        closeMenu();
      }
    };

    document.addEventListener("click", captureNextClick, true);
    captureCleanupRef.current = () => {
      document.removeEventListener("click", captureNextClick, true);
    };
  };

  const onProfileActivate = () => {
    if (!canSwitchAccount) {
      clearActivationWindow();
      openMenu();
      return;
    }

    if (timeoutRef.current) {
      clearActivationWindow();
      if (switchConnectedAccount()) {
        closeMenu();
      }
      return;
    }

    startCapture();
    openMenu();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      clearCapture();
    }, PROFILE_DOUBLE_ACTIVATE_DELAY_MS);
  };

  useEffect(
    () => () => {
      captureCleanupRef.current?.();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return { onProfileActivate, profileButtonRef };
}
