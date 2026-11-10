"use client";

import Button from "@/components/utils/button/Button";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  decryptData,
  getAppWalletNameError,
  getAppWalletPassphraseError,
  getAppWalletPassphraseWhitespaceError,
} from "./app-wallet-helpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useAuth } from "../auth/Auth";
import { useAppWallets } from "./AppWalletsContext";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DELEGATION_FIELD_CLASS_NAME } from "@/components/delegation/delegation-ui";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";

const LEGACY_UNLOCK_MIN_PASS_LENGTH = 6;
const APP_WALLET_INPUT_CLASS_NAME = DELEGATION_FIELD_CLASS_NAME;
const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

// Events a layered dialog keeps to itself, so modal layers underneath it
// (document key handlers, click-away handlers) never react to it.
const LAYERED_CONTAINED_EVENTS = [
  "mousedown",
  "pointerdown",
  "touchstart",
] as const;

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

export function AppWalletModalShell(
  props: Readonly<{
    show: boolean;
    title: string;
    onHide: () => void;
    dismissDisabled?: boolean;
    /**
     * Opens above any other modal layer: other focus traps pause while it is
     * open, key and pointer events stay inside it, and Escape closes only it.
     * Key handlers inside a layered dialog must not rely on React keydown.
     */
    layered?: boolean;
    children: ReactNode;
    footer: ReactNode;
  }>
) {
  const titleId = useId();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const {
    children,
    dismissDisabled = false,
    footer,
    layered = false,
    onHide,
    show,
    title,
  } = props;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const requestHide = useEffectEvent(() => {
    if (!dismissDisabled) onHide();
  });
  useAndroidBackLayer(show && isHydrated, dialogRef, () => {
    if (!dismissDisabled) onHide();
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    if (!show) {
      closeDialog(dialog);
      return undefined;
    }

    previouslyFocusedElementRef.current =
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
    // Start on the first field, otherwise on the heading: never on a control
    // that dismisses or confirms the dialog.
    const initialFocus =
      dialog.querySelector<HTMLElement>("[autofocus], input:not([disabled])") ??
      titleRef.current;
    initialFocus?.focus();

    return () => {
      closeDialog(dialog);
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [isHydrated, show]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!layered || !show || !dialog) {
      return undefined;
    }

    const keepInside = (event: Event) => {
      event.stopPropagation();
    };
    const onKeyDown = (event: Event) => {
      event.stopPropagation();
      if ("key" in event && event.key === "Escape") {
        event.preventDefault();
        requestHide();
      }
    };
    dialog.addEventListener("keydown", onKeyDown);
    for (const type of LAYERED_CONTAINED_EVENTS) {
      dialog.addEventListener(type, keepInside);
    }
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      for (const type of LAYERED_CONTAINED_EVENTS) {
        dialog.removeEventListener(type, keepInside);
      }
    };
  }, [isHydrated, layered, show]);

  if (!isHydrated) {
    return null;
  }

  const dialogElement = (
    <dialog
      ref={dialogRef}
      data-modal-layer={layered ? "top" : undefined}
      aria-modal="true"
      aria-labelledby={titleId}
      className="tailwind-scope tw-relative tw-m-0 tw-h-[100dvh] tw-max-h-none tw-w-screen tw-max-w-none tw-overflow-y-auto tw-border-none tw-bg-transparent tw-p-0 tw-text-inherit backdrop:tw-bg-black/75 backdrop:tw-backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        if (!dismissDisabled) {
          onHide();
        }
      }}
    >
      <button
        type="button"
        aria-label={t(DEFAULT_LOCALE, "appWallet.modal.close")}
        className="tw-absolute tw-inset-0 tw-cursor-default tw-appearance-none tw-border-0 tw-bg-transparent tw-p-0"
        onClick={onHide}
        disabled={dismissDisabled}
        tabIndex={-1}
      />
      <div className="tw-relative tw-z-10 tw-flex tw-min-h-full tw-w-full tw-items-center tw-justify-center tw-px-4 tw-pb-[max(1rem,env(safe-area-inset-bottom,0px))] tw-pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <section className="tw-my-auto tw-w-full tw-max-w-md tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-50 tw-shadow-2xl tw-shadow-black/60 tw-ring-1 tw-ring-white/5">
          <header className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-5 tw-py-4 sm:tw-px-6">
            <h2
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 focus:tw-outline-none"
            >
              {title}
            </h2>
            <button
              type="button"
              aria-label={t(DEFAULT_LOCALE, "appWallet.modal.close")}
              onClick={onHide}
              disabled={dismissDisabled}
              className="tw--mr-2 tw-inline-flex tw-size-11 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-bg-white/5 active:tw-text-iron-100 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-100"
            >
              <XMarkIcon className="tw-size-5" aria-hidden="true" />
            </button>
          </header>
          <div className="tw-px-5 tw-py-5 sm:tw-px-6">{children}</div>
          <div
            data-testid="app-wallet-modal-actions"
            className="tw-flex tw-flex-col tw-justify-end tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-5 tw-py-4 sm:tw-flex-row sm:tw-px-6 [&>button]:tw-w-full sm:[&>button]:tw-w-auto"
          >
            {footer}
          </div>
        </section>
      </div>
    </dialog>
  );

  return createPortal(
    layered ? (
      <FocusTrap
        active={show}
        focusTrapOptions={{
          // The dialog moves focus itself; this trap exists so that any
          // focus trap already active underneath pauses while it is open.
          initialFocus: false,
          fallbackFocus: () => dialogRef.current ?? document.body,
          allowOutsideClick: true,
          clickOutsideDeactivates: false,
          escapeDeactivates: false,
          returnFocusOnDeactivate: false,
        }}
      >
        {dialogElement}
      </FocusTrap>
    ) : (
      dialogElement
    ),
    document.body
  );
}

const showAppWalletError = (
  timeoutRef: RefObject<NodeJS.Timeout | null>,
  setError: React.Dispatch<React.SetStateAction<string>>,
  message: string
) => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  setError(message);

  timeoutRef.current = setTimeout(() => {
    setError("");
    timeoutRef.current = null;
  }, 5000);
};

export function CreateAppWalletModal(
  props: Readonly<{
    show: boolean;
    import?:
      | {
          address: string;
          mnemonic: string;
          privateKey: string;
        }
      | undefined;
    onHide: (isSuccess?: boolean) => void;
  }>
) {
  const { show, import: importData, onHide } = props;
  const { createAppWallet, importAppWallet } = useAppWallets();
  const { setToast } = useAuth();
  const [walletName, setWalletName] = useState("");
  const [walletPass, setWalletPass] = useState("");
  const [passHidden, setPassHidden] = useState(true);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"name" | "password" | null>(
    null
  );

  const [isAdding, setIsAdding] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const walletNameId = useId();
  const walletPasswordId = useId();
  const feedbackId = useId();

  const handleHide = useCallback(
    (isSuccess?: boolean) => {
      setWalletName("");
      setWalletPass("");
      setPassHidden(true);
      setError("");
      setErrorField(null);
      setIsAdding(false);
      onHide(isSuccess);
    },
    [onHide]
  );

  const handleCreate = useCallback(async () => {
    const passphraseError = getAppWalletPassphraseError(walletPass);
    if (passphraseError) {
      setErrorField("password");
      showAppWalletError(timeoutRef, setError, passphraseError);
      return;
    } else {
      setError("");
    }

    setIsAdding(true);
    try {
      const success = await createAppWallet(walletName, walletPass);
      if (!success) {
        setToast({
          message: t(DEFAULT_LOCALE, "appWallet.modal.createFailed"),
          type: "error",
        });
        return;
      }

      setToast({
        title: t(DEFAULT_LOCALE, "appWallet.modal.createSuccess"),
        description: t(
          DEFAULT_LOCALE,
          "appWallet.modal.recoveryDownloadPrompt",
          { walletName }
        ),
        type: "success",
      });
      handleHide(true);
    } catch {
      setToast({
        message: t(DEFAULT_LOCALE, "appWallet.modal.createFailed"),
        type: "error",
      });
    } finally {
      setIsAdding(false);
    }
  }, [createAppWallet, handleHide, setToast, walletName, walletPass]);

  const handleImport = useCallback(async () => {
    if (!importData) return;

    const passphraseError = getAppWalletPassphraseError(walletPass);
    if (passphraseError) {
      setErrorField("password");
      showAppWalletError(timeoutRef, setError, passphraseError);
      return;
    } else {
      setError("");
    }

    setIsAdding(true);
    try {
      const success = await importAppWallet(
        walletName,
        walletPass,
        importData.address,
        importData.mnemonic,
        importData.privateKey
      );
      if (!success) {
        setToast({
          message: t(DEFAULT_LOCALE, "appWallet.modal.importFailed"),
          type: "error",
        });
        return;
      }

      setToast({
        message: t(DEFAULT_LOCALE, "appWallet.modal.importSuccess"),
        type: "success",
      });
      handleHide(true);
    } catch {
      setToast({
        message: t(DEFAULT_LOCALE, "appWallet.modal.importFailed"),
        type: "error",
      });
    } finally {
      setIsAdding(false);
    }
  }, [
    handleHide,
    importAppWallet,
    importData,
    setToast,
    walletName,
    walletPass,
  ]);

  return (
    <AppWalletModalShell
      show={show}
      onHide={() => handleHide()}
      dismissDisabled={isAdding}
      title={t(
        DEFAULT_LOCALE,
        importData
          ? "appWallet.modal.importTitle"
          : "appWallet.modal.createTitle"
      )}
      footer={
        <>
          <Button
            type="button"
            onClick={() => handleHide()}
            disabled={isAdding}
            variant="secondary"
            size="md"
          >
            {t(DEFAULT_LOCALE, "appWallet.modal.cancel")}
          </Button>
          {importData ? (
            <Button
              type="button"
              disabled={!walletName || !walletPass}
              loading={isAdding}
              onClick={handleImport}
              variant="action"
              size="md"
            >
              {t(
                DEFAULT_LOCALE,
                isAdding
                  ? "appWallet.modal.importing"
                  : "appWallet.modal.import"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!walletName || !walletPass}
              loading={isAdding}
              onClick={handleCreate}
              variant="action"
              size="md"
            >
              {t(
                DEFAULT_LOCALE,
                isAdding ? "appWallet.modal.creating" : "appWallet.modal.create"
              )}
            </Button>
          )}
        </>
      }
    >
      <div className="tw-space-y-5">
        <div>
          <label
            className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            htmlFor={walletNameId}
          >
            {t(DEFAULT_LOCALE, "appWallet.modal.walletName")}
          </label>
          <input
            id={walletNameId}
            autoComplete="off"
            type="text"
            placeholder={t(
              DEFAULT_LOCALE,
              "appWallet.modal.walletNamePlaceholder"
            )}
            value={walletName}
            aria-invalid={Boolean(error && errorField === "name") || undefined}
            aria-describedby={feedbackId}
            className={APP_WALLET_INPUT_CLASS_NAME}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z0-9 ]*$/.test(value)) {
                setWalletName(value);
              } else {
                setErrorField("name");
                showAppWalletError(
                  timeoutRef,
                  setError,
                  getAppWalletNameError()
                );
              }
            }}
          />
        </div>
        <div>
          <label
            className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            htmlFor={walletPasswordId}
          >
            {t(DEFAULT_LOCALE, "appWallet.modal.walletPassword")}
          </label>
          <div className="tw-relative">
            <input
              id={walletPasswordId}
              type={passHidden ? "password" : "text"}
              autoComplete="new-password"
              placeholder={t(
                DEFAULT_LOCALE,
                "appWallet.modal.passwordPlaceholder"
              )}
              value={walletPass}
              aria-invalid={
                Boolean(error && errorField === "password") || undefined
              }
              aria-describedby={feedbackId}
              className={`${APP_WALLET_INPUT_CLASS_NAME} tw-pr-12`}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\S*$/.test(value)) {
                  setWalletPass(value);
                } else {
                  setErrorField("password");
                  showAppWalletError(
                    timeoutRef,
                    setError,
                    getAppWalletPassphraseWhitespaceError()
                  );
                }
              }}
            />
            <button
              type="button"
              onClick={() => setPassHidden((current) => !current)}
              aria-label={t(
                DEFAULT_LOCALE,
                passHidden
                  ? "appWallet.modal.showPassword"
                  : "appWallet.modal.hidePassword"
              )}
              className="tw-absolute tw-right-1 tw-top-1/2 tw-flex tw-size-10 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-bg-white/5 active:tw-text-iron-100 desktop-hover:hover:tw-text-iron-100"
            >
              {passHidden ? (
                <EyeSlashIcon className="tw-size-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="tw-size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <p
          id={feedbackId}
          role={error ? "alert" : undefined}
          className={`tw-m-0 tw-text-sm tw-leading-5 ${
            error ? "tw-text-error" : "tw-text-iron-400"
          }`}
        >
          {error || t(DEFAULT_LOCALE, "appWallet.modal.createHelp")}
        </p>
      </div>
    </AppWalletModalShell>
  );
}

export function UnlockAppWalletModal(
  props: Readonly<{
    show: boolean;
    address: string;
    address_hashed: string;
    onUnlock: (pass: string) => void;
    onVerifiedUnlock?:
      | ((address: string, pass: string) => Promise<unknown> | void)
      | undefined;
    onHide: () => void;
    sensitiveAction?: {
      label: string;
      warning: string;
      confirmationText: string;
    };
  }>
) {
  const [walletPass, setWalletPass] = useState("");
  const [passHidden, setPassHidden] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const {
    show,
    address,
    address_hashed,
    onUnlock,
    onVerifiedUnlock,
    onHide,
    sensitiveAction,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const walletPasswordId = useId();
  const feedbackId = useId();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensitiveActionConfirmed =
    !sensitiveAction || confirmation === sensitiveAction.confirmationText;

  const canUnlock =
    !unlocking &&
    walletPass.length >= LEGACY_UNLOCK_MIN_PASS_LENGTH &&
    sensitiveActionConfirmed;

  const handleHide = useCallback(() => {
    setWalletPass("");
    setPassHidden(true);
    setConfirmation("");
    setError("");
    setUnlocking(false);
    onHide();
  }, [onHide]);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canUnlock) {
      handleUnlock();
    }
  };

  const showUnlockError = useCallback(() => {
    setUnlocking(false);
    showAppWalletError(
      timeoutRef,
      setError,
      t(DEFAULT_LOCALE, "appWallet.modal.unlockFailed")
    );
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleUnlock = useCallback(async () => {
    if (sensitiveAction && confirmation !== sensitiveAction.confirmationText) {
      return;
    }

    setError("");
    setUnlocking(true);

    const doUnlock = async () => {
      try {
        const decryptedAddress = await decryptData(
          address,
          address_hashed,
          walletPass
        );
        if (areEqualAddresses(address, decryptedAddress)) {
          try {
            await onVerifiedUnlock?.(address, walletPass);
          } catch (error) {
            console.error("App wallet unlock migration failed:", error);
          }
          onUnlock(walletPass);
          handleHide();
        } else {
          showUnlockError();
        }
      } catch (e) {
        console.error("unlock error", e);
        showUnlockError();
      }
    };

    setTimeout(doUnlock, 0);
  }, [
    address,
    address_hashed,
    handleHide,
    onUnlock,
    onVerifiedUnlock,
    confirmation,
    sensitiveAction,
    showUnlockError,
    walletPass,
  ]);

  return (
    <AppWalletModalShell
      show={show}
      onHide={() => handleHide()}
      dismissDisabled={unlocking}
      title={t(DEFAULT_LOCALE, "appWallet.modal.unlockTitle")}
      footer={
        <>
          <Button
            type="button"
            onClick={() => handleHide()}
            disabled={unlocking}
            variant="secondary"
            size="md"
          >
            {t(DEFAULT_LOCALE, "appWallet.modal.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!canUnlock}
            loading={unlocking}
            onClick={handleUnlock}
            variant="action"
            size="md"
          >
            {t(
              DEFAULT_LOCALE,
              unlocking ? "appWallet.modal.unlocking" : "appWallet.modal.unlock"
            )}
          </Button>
        </>
      }
    >
      <div className="tw-space-y-5">
        <div>
          <label
            className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            htmlFor={walletPasswordId}
          >
            {t(DEFAULT_LOCALE, "appWallet.modal.walletPassword")}
          </label>
          <div className="tw-relative">
            <input
              ref={inputRef}
              id={walletPasswordId}
              autoComplete="current-password"
              type={passHidden ? "password" : "text"}
              placeholder={t(
                DEFAULT_LOCALE,
                "appWallet.modal.passwordPlaceholder"
              )}
              value={walletPass}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={feedbackId}
              className={`${APP_WALLET_INPUT_CLASS_NAME} tw-pr-12`}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\S*$/.test(value)) {
                  setWalletPass(value);
                } else {
                  showAppWalletError(
                    timeoutRef,
                    setError,
                    getAppWalletPassphraseWhitespaceError()
                  );
                }
              }}
              onKeyDown={handleKeyPress}
            />
            <button
              type="button"
              onClick={() => setPassHidden((current) => !current)}
              aria-label={t(
                DEFAULT_LOCALE,
                passHidden
                  ? "appWallet.modal.showPassword"
                  : "appWallet.modal.hidePassword"
              )}
              className="tw-absolute tw-right-1 tw-top-1/2 tw-flex tw-size-10 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-bg-white/5 active:tw-text-iron-100 desktop-hover:hover:tw-text-iron-100"
            >
              {passHidden ? (
                <EyeSlashIcon className="tw-size-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="tw-size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {sensitiveAction && (
          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/20 tw-bg-amber-400/5 tw-p-3">
            <p className="tw-mb-3 tw-mt-0 tw-text-sm tw-leading-5 tw-text-amber-200">
              {sensitiveAction.warning}
            </p>
            <label
              className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
              htmlFor="sensitiveActionConfirmation"
            >
              {t(DEFAULT_LOCALE, "appWallet.modal.sensitiveConfirmation", {
                confirmation: sensitiveAction.confirmationText,
                action: sensitiveAction.label,
              })}
            </label>
            <input
              id="sensitiveActionConfirmation"
              type="text"
              value={confirmation}
              className={APP_WALLET_INPUT_CLASS_NAME}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
        )}
        <p
          id={feedbackId}
          role={error ? "alert" : undefined}
          className={`tw-m-0 tw-text-sm tw-leading-5 ${
            error ? "tw-text-error" : "tw-text-iron-400"
          }`}
        >
          {error || t(DEFAULT_LOCALE, "appWallet.modal.unlockHelp")}
        </p>
      </div>
    </AppWalletModalShell>
  );
}
