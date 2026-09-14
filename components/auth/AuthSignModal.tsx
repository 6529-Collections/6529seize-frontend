"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/utils/button/Button";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { WalletIcon, XMarkIcon } from "@heroicons/react/24/outline";
import DotLoader from "../dotLoader/DotLoader";
import { formatSessionUpgradeTimeLeft } from "./authSessionUpgrade";
import styles from "./Auth.module.css";
import { useSeizeConnectContext } from "./SeizeConnectContext";

const SIGN_IN_CLASSES = {
  signModalSurface:
    "tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-shadow-2xl",
  signModalHeader:
    "tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-5 tw-pb-0 tw-pt-5",
  signModalTitle:
    "tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-text-iron-50",
  signModalBody: "tw-px-5 tw-pb-5 tw-pt-3",
  signModalLead: "tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300",
  signModalFooter:
    "tw-flex tw-flex-wrap tw-justify-end tw-gap-3 tw-px-5 tw-pb-5",
};

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
  const locale = useBrowserLocale();
  const modalStyles = isSessionUpgradePrompt ? styles : SIGN_IN_CLASSES;
  const { address } = useSeizeConnectContext();
  const sessionUpgradeTimeLeftText = useMemo(
    () => formatSessionUpgradeTimeLeft(sessionUpgradeTimeLeftMs, locale),
    [sessionUpgradeTimeLeftMs, locale]
  );
  const signModalTitleId = useId();
  const signModalDescriptionId = useId();
  const signDialogRef = useRef<HTMLDialogElement>(null);
  const signModalPreviouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const signModalTitle = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(locale, "auth.signModal.connectionUpdateRequired");
    }
    if (isSessionUpgradePrompt) {
      return t(locale, "auth.signModal.upgradeAuthentication");
    }
    return t(locale, "auth.signModal.authenticationRequest");
  })();
  const signModalLead = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(locale, "auth.signModal.connectionShareLead");
    }
    if (isSessionUpgradePrompt) {
      return t(locale, "auth.signModal.sessionUpgradeLead");
    }
    return t(locale, "auth.signModal.authLead");
  })();
  const signModalPrimaryListItem = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(locale, "auth.signModal.connectionSharePrimary");
    }
    if (isDisconnectedWebSessionUpgradePrompt) {
      return t(locale, "auth.signModal.disconnectedUpgradePrimary");
    }
    if (isSessionUpgradePrompt) {
      return t(locale, "auth.signModal.sessionUpgradePrimary");
    }
    return t(locale, "auth.signModal.authPrimary");
  })();
  const signModalSharedConnectionListItem = t(
    locale,
    "auth.signModal.sharedConnection"
  );
  const signModalSecondaryListItem = (() => {
    if (!isSessionUpgradePrompt) {
      return t(locale, "auth.signModal.noGas");
    }

    if (!sessionUpgradeHasDeadline) {
      return t(locale, "auth.signModal.manualUpgrade");
    }

    return t(locale, "auth.signModal.timeLeft", {
      timeLeft: sessionUpgradeTimeLeftText,
    });
  })();
  const signModalConfirmText = isDisconnectedWebSessionUpgradePrompt
    ? t(locale, "auth.signModal.connect")
    : t(locale, "auth.signModal.sign");

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
    const initialFocus =
      dialog.querySelector<HTMLElement>(
        "[data-auth-sign-primary]:not([disabled])"
      ) ?? dialog.querySelector<HTMLElement>("button:not([disabled]), a[href]");
    initialFocus?.focus();

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
      aria-describedby={signModalDescriptionId}
      className="tailwind-scope tw-m-auto tw-max-h-[calc(100dvh-2rem)] tw-w-[min(32rem,calc(100vw-2rem))] tw-max-w-[min(32rem,calc(100vw-2rem))] tw-overflow-y-auto tw-border-none tw-bg-transparent tw-p-0 tw-text-left backdrop:tw-bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        if (
          !isSignRequestInProgress &&
          (!isSessionUpgradePrompt || sessionUpgradeCanDismiss)
        ) {
          onCancelSignRequest();
        }
      }}
      tabIndex={-1}
    >
      <div className={modalStyles["signModalSurface"]}>
        <div className={modalStyles["signModalHeader"]}>
          <h2 id={signModalTitleId} className={modalStyles["signModalTitle"]}>
            {signModalTitle}
          </h2>
          {!isSessionUpgradePrompt && !isSignRequestInProgress && (
            <Button
              variant="secondary"
              size="lg"
              className="tw-size-11 tw-min-w-11 tw-p-0"
              aria-label={t(locale, "auth.signModal.cancelSignIn")}
              onClick={onCancelSignRequest}
            >
              <XMarkIcon className="tw-size-5" aria-hidden="true" />
            </Button>
          )}
        </div>
        <div className={modalStyles["signModalBody"]}>
          <p
            id={signModalDescriptionId}
            className={modalStyles["signModalLead"]}
          >
            {signModalLead}
          </p>

          {isSessionUpgradePrompt ? (
            <ul className={styles["signModalList"]}>
              <li>{signModalPrimaryListItem}</li>
              {isDisconnectedWebSessionUpgradePrompt && (
                <li>{signModalSharedConnectionListItem}</li>
              )}
              <li>{signModalSecondaryListItem}</li>
            </ul>
          ) : (
            <>
              {address && (
                <div className="tw-mt-5 tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-3">
                  <WalletIcon
                    className="tw-size-5 tw-shrink-0 tw-text-iron-400"
                    aria-hidden="true"
                  />
                  <div className="tw-min-w-0">
                    <span className="tw-block tw-text-xs tw-text-iron-400">
                      {t(locale, "auth.signModal.walletAddress")}
                    </span>
                    <span className="tw-break-all tw-font-mono tw-text-sm tw-text-iron-100">
                      {address}
                    </span>
                  </div>
                </div>
              )}
              <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(locale, "auth.signModal.noTransaction")}
              </p>
            </>
          )}
          {isSessionUpgradePrompt && (
            <p className={styles["signModalLearnMore"]}>
              <Link
                href="/about/tech/wallet-authentication"
                onClick={onSessionUpgradeLearnMore}
              >
                {t(locale, "auth.signModal.learnMore")}
              </Link>
            </p>
          )}
        </div>
        <div className={modalStyles["signModalFooter"]}>
          {!isSignRequestInProgress &&
            (!isSessionUpgradePrompt || sessionUpgradeCanDismiss) && (
              <Button
                type="button"
                onClick={onCancelSignRequest}
                variant="secondary"
                size="lg"
                className="tw-min-w-32 max-[576px]:tw-min-w-0 max-[576px]:tw-flex-1"
              >
                {isSessionUpgradePrompt && sessionUpgradeHasDeadline
                  ? t(locale, "auth.signModal.remindLater")
                  : t(locale, "auth.signModal.cancel")}
              </Button>
            )}
          <output className="tw-sr-only">
            {isSigningPending
              ? t(locale, "auth.signModal.confirmInWallet")
              : ""}
          </output>
          {!isConnectionShareUpgradePrompt && (
            <Button
              type="button"
              data-auth-sign-primary
              onClick={onConfirmSignRequest}
              disabled={isSignRequestInProgress}
              aria-busy={isSignRequestInProgress}
              aria-label={
                isSigningPending
                  ? t(locale, "auth.signModal.confirmInWallet")
                  : signModalConfirmText
              }
              variant="action"
              size="lg"
              className="tw-min-w-32 max-[576px]:tw-min-w-0 max-[576px]:tw-flex-1"
            >
              {isSigningPending ? (
                <span className={styles["signModalButtonContent"]}>
                  {t(locale, "auth.signModal.confirmInWallet")} <DotLoader />
                </span>
              ) : (
                signModalConfirmText
              )}
            </Button>
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
