"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { t } from "@/i18n/messages";
import DotLoader from "../dotLoader/DotLoader";
import {
  AUTH_MODAL_LOCALE,
  formatSessionUpgradeTimeLeft,
} from "./authSessionUpgrade";
import styles from "./Auth.module.css";

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

export function AuthSignModal({
  enableWalletAuthentication,
  isConnectionShareUpgradePrompt,
  isDisconnectedWebSessionUpgradePrompt,
  isSessionUpgradePrompt,
  isSigningPending,
  isSignRequestInProgress,
  onCancelSignRequest,
  onConfirmSignRequest,
  onSessionUpgradeLearnMore,
  sessionUpgradeCanDismiss,
  sessionUpgradeHasDeadline,
  sessionUpgradeTimeLeftMs,
  shouldShowSignModal,
}: {
  readonly enableWalletAuthentication: boolean;
  readonly isConnectionShareUpgradePrompt: boolean;
  readonly isDisconnectedWebSessionUpgradePrompt: boolean;
  readonly isSessionUpgradePrompt: boolean;
  readonly isSigningPending: boolean;
  readonly isSignRequestInProgress: boolean;
  readonly onCancelSignRequest: () => void;
  readonly onConfirmSignRequest: () => void;
  readonly onSessionUpgradeLearnMore: (
    event: MouseEvent<HTMLAnchorElement>
  ) => void;
  readonly sessionUpgradeCanDismiss: boolean;
  readonly sessionUpgradeHasDeadline: boolean;
  readonly sessionUpgradeTimeLeftMs: number;
  readonly shouldShowSignModal: boolean;
}) {
  const sessionUpgradeTimeLeftText = useMemo(
    () => formatSessionUpgradeTimeLeft(sessionUpgradeTimeLeftMs),
    [sessionUpgradeTimeLeftMs]
  );
  const signModalTitleId = useId();
  const signDialogRef = useRef<HTMLDialogElement>(null);
  const signModalPreviouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const signModalTitle = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.connectionUpdateRequired");
    }
    if (isSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.upgradeAuthentication");
    }
    return t(AUTH_MODAL_LOCALE, "auth.signModal.authenticationRequest");
  })();
  const signModalLead = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.connectionShareLead");
    }
    if (isSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.sessionUpgradeLead");
    }
    return t(AUTH_MODAL_LOCALE, "auth.signModal.authLead");
  })();
  const signModalPrimaryListItem = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.connectionSharePrimary");
    }
    if (isDisconnectedWebSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.disconnectedUpgradePrimary");
    }
    if (isSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.sessionUpgradePrimary");
    }
    return t(AUTH_MODAL_LOCALE, "auth.signModal.authPrimary");
  })();
  const signModalSharedConnectionListItem = t(
    AUTH_MODAL_LOCALE,
    "auth.signModal.sharedConnection"
  );
  const signModalSecondaryListItem = (() => {
    if (!isSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.noGas");
    }

    if (!sessionUpgradeHasDeadline) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.manualUpgrade");
    }

    return t(AUTH_MODAL_LOCALE, "auth.signModal.timeLeft", {
      timeLeft: sessionUpgradeTimeLeftText,
    });
  })();
  const signModalConfirmText = isDisconnectedWebSessionUpgradePrompt
    ? t(AUTH_MODAL_LOCALE, "auth.signModal.connect")
    : t(AUTH_MODAL_LOCALE, "auth.signModal.sign");

  useEffect(() => {
    if (!enableWalletAuthentication || typeof document === "undefined") {
      return undefined;
    }

    const dialog = signDialogRef.current;
    if (!dialog) {
      return undefined;
    }

    if (!shouldShowSignModal) {
      closeDialog(dialog);
      return undefined;
    }

    signModalPreviouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.setAttribute("open", "");
    }
    dialog
      .querySelector<HTMLElement>(
        "[data-auth-sign-primary]:not([disabled]), button:not([disabled]), a[href]"
      )
      ?.focus();

    return () => {
      closeDialog(dialog);
      signModalPreviouslyFocusedElementRef.current?.focus();
      signModalPreviouslyFocusedElementRef.current = null;
    };
  }, [enableWalletAuthentication, shouldShowSignModal]);

  if (
    !enableWalletAuthentication ||
    !shouldShowSignModal ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <dialog
      ref={signDialogRef}
      aria-modal="true"
      aria-labelledby={signModalTitleId}
      className="tailwind-scope tw-m-auto tw-max-h-[calc(100dvh-2rem)] tw-w-[min(32rem,calc(100vw-2rem))] tw-max-w-[min(32rem,calc(100vw-2rem))] tw-overflow-y-auto tw-border-none tw-bg-transparent tw-p-0 tw-text-left backdrop:tw-bg-black/50"
      onCancel={(event) => event.preventDefault()}
      tabIndex={-1}
    >
      <div className={styles["signModalSurface"]}>
        <div className={styles["signModalHeader"]}>
          <h2 id={signModalTitleId} className={styles["signModalTitle"]}>
            {signModalTitle}
          </h2>
        </div>
        <div className={styles["signModalBody"]}>
          <p className={styles["signModalLead"]}>{signModalLead}</p>

          <ul className={styles["signModalList"]}>
            <li>{signModalPrimaryListItem}</li>
            {isDisconnectedWebSessionUpgradePrompt && (
              <li>{signModalSharedConnectionListItem}</li>
            )}
            <li>{signModalSecondaryListItem}</li>
          </ul>
          {isSessionUpgradePrompt && (
            <p className={styles["signModalLearnMore"]}>
              <Link
                href="/about/tech/wallet-authentication"
                onClick={onSessionUpgradeLearnMore}
              >
                {t(AUTH_MODAL_LOCALE, "auth.signModal.learnMore")}
              </Link>
            </p>
          )}
        </div>
        <div className={styles["signModalFooter"]}>
          {!isSignRequestInProgress &&
            (!isSessionUpgradePrompt || sessionUpgradeCanDismiss) && (
              <button
                type="button"
                className={styles["signModalCancelButton"]}
                onClick={onCancelSignRequest}
              >
                {isSessionUpgradePrompt && sessionUpgradeHasDeadline
                  ? t(AUTH_MODAL_LOCALE, "auth.signModal.remindLater")
                  : t(AUTH_MODAL_LOCALE, "auth.signModal.cancel")}
              </button>
            )}
          {!isConnectionShareUpgradePrompt && (
            <button
              type="button"
              className={styles["signModalConfirmButton"]}
              data-auth-sign-primary
              onClick={onConfirmSignRequest}
              disabled={isSignRequestInProgress}
            >
              {isSigningPending ? (
                <span className={styles["signModalButtonContent"]}>
                  {t(AUTH_MODAL_LOCALE, "auth.signModal.confirmInWallet")}{" "}
                  <DotLoader />
                </span>
              ) : (
                signModalConfirmText
              )}
            </button>
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
