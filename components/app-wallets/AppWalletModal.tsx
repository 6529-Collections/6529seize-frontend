"use client";
import styles from "./AppWallet.module.css";
import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import {
  decryptData,
  getAppWalletNameError,
  getAppWalletPassphraseError,
  getAppWalletPassphraseWhitespaceError,
} from "./app-wallet-helpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useAuth } from "../auth/Auth";
import { useAppWallets } from "./AppWalletsContext";

const LEGACY_UNLOCK_MIN_PASS_LENGTH = 6;

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

function AppWalletModalShell(
  props: Readonly<{
    show: boolean;
    title: string;
    onHide: () => void;
    children: ReactNode;
    footer: ReactNode;
  }>
) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const { children, footer, onHide, show, title } = props;

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
    dialog
      .querySelector<HTMLElement>(
        "[autofocus], input:not([disabled]), button:not([disabled])"
      )
      ?.focus();

    return () => {
      closeDialog(dialog);
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [show]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      className="tailwind-scope tw-relative tw-m-0 tw-h-[100dvh] tw-max-h-none tw-w-screen tw-max-w-none tw-border-none tw-bg-transparent tw-p-0 tw-text-inherit backdrop:tw-bg-black/50"
      onCancel={(event) => event.preventDefault()}
    >
      <button
        type="button"
        aria-label={`Close ${title}`}
        className="tw-absolute tw-inset-0 tw-cursor-default tw-appearance-none tw-border-0 tw-bg-transparent tw-p-0"
        onClick={onHide}
        tabIndex={-1}
      />
      <div className="tw-relative tw-z-10 tw-flex tw-min-h-full tw-w-full tw-items-center tw-justify-center tw-p-4">
        <div className="tw-w-full tw-max-w-[500px]">
          <div className={styles["modalHeader"]}>
            <h2
              id={titleId}
              className="tw-m-0 tw-text-xl tw-font-medium tw-leading-[1.2]"
            >
              {title}
            </h2>
          </div>
          <div className={styles["modalContent"]}>{children}</div>
          <div
            className={clsx(
              styles["modalContent"],
              "tw-flex tw-justify-end tw-gap-2"
            )}
          >
            {footer}
          </div>
        </div>
      </div>
    </dialog>,
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

  const [isAdding, setIsAdding] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHide = useCallback(
    (isSuccess?: boolean) => {
      setWalletName("");
      setWalletPass("");
      setError("");
      onHide(isSuccess);
    },
    [onHide]
  );

  const handleCreate = useCallback(async () => {
    const passphraseError = getAppWalletPassphraseError(walletPass);
    if (passphraseError) {
      showAppWalletError(timeoutRef, setError, passphraseError);
      return;
    } else {
      setError("");
    }

    setIsAdding(true);

    const success = await createAppWallet(walletName, walletPass);
    if (!success) {
      setToast({
        message: `Couldn't create this wallet. Check the details and try again.`,
        type: "error",
      });
    } else {
      setToast({
        title: "Wallet created.",
        description: `Download the recovery file now to keep access to ${walletName}.`,
        type: "success",
      });
      handleHide(true);
    }
    setIsAdding(false);
  }, [createAppWallet, handleHide, setToast, walletName, walletPass]);

  const handleImport = useCallback(async () => {
    if (!importData) return;

    const passphraseError = getAppWalletPassphraseError(walletPass);
    if (passphraseError) {
      showAppWalletError(timeoutRef, setError, passphraseError);
      return;
    } else {
      setError("");
    }

    setIsAdding(true);

    const success = await importAppWallet(
      walletName,
      walletPass,
      importData.address,
      importData.mnemonic,
      importData.privateKey
    );
    if (!success) {
      setToast({
        message: `Couldn't import this wallet. Check the file and try again.`,
        type: "error",
      });
    } else {
      setToast({ message: "Wallet imported.", type: "success" });
      handleHide(true);
    }
    setIsAdding(false);
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
      title={`${importData ? "Import" : "Create New"} Wallet`}
      footer={
        <>
          <button
            type="button"
            className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#6c757d] tw-bg-[#6c757d] tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-text-white tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#565e64] enabled:hover:tw-bg-[#5c636a] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
            onClick={() => handleHide()}
          >
            Cancel
          </button>
          {importData ? (
            <button
              type="button"
              className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#0d6efd] tw-bg-[#0d6efd] tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-text-white tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#0a58ca] enabled:hover:tw-bg-[#0b5ed7] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
              disabled={!walletName || !walletPass || isAdding}
              onClick={handleImport}
            >
              {isAdding ? "Importing..." : "Import"}
            </button>
          ) : (
            <button
              type="button"
              className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#0d6efd] tw-bg-[#0d6efd] tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-text-white tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#0a58ca] enabled:hover:tw-bg-[#0b5ed7] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
              disabled={!walletName || !walletPass || isAdding}
              onClick={handleCreate}
            >
              {isAdding ? "Creating..." : "Create"}
            </button>
          )}
        </>
      }
    >
      <label className="tw-pb-1" htmlFor="walletName">
        Wallet Name
      </label>
      <input
        id="walletName"
        autoFocus
        type="text"
        placeholder="My Wallet..."
        value={walletName}
        className={styles["newWalletInput"]}
        onChange={(e) => {
          const value = e.target.value;
          if (/^[a-zA-Z0-9 ]*$/.test(value)) {
            setWalletName(value);
          } else {
            showAppWalletError(timeoutRef, setError, getAppWalletNameError());
          }
        }}
      />
      <label className="tw-flex tw-items-center tw-justify-between tw-pb-1 tw-pt-3">
        <span className="tw-select-none">Wallet Password</span>
        <FontAwesomeIcon
          icon={passHidden ? faEyeSlash : faEye}
          height={18}
          onClick={() => setPassHidden(!passHidden)}
          style={{
            cursor: "pointer",
          }}
        />
      </label>
      <input
        type={passHidden ? "password" : "text"}
        placeholder="******"
        value={walletPass}
        className={styles["newWalletInput"]}
        onChange={(e: any) => {
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
      />
      <p className="tw-mb-1 tw-mt-4">
        {error ? (
          <span className="tw-text-[#dc3545]">{error}</span>
        ) : (
          <>Provide a name and password for your new wallet</>
        )}
      </p>
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

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensitiveActionConfirmed =
    !sensitiveAction || confirmation === sensitiveAction.confirmationText;

  const canUnlock =
    !unlocking &&
    walletPass.length >= LEGACY_UNLOCK_MIN_PASS_LENGTH &&
    sensitiveActionConfirmed;

  const handleHide = useCallback(() => {
    setWalletPass("");
    setConfirmation("");
    setError("");
    setUnlocking(false);
    onHide();
  }, [onHide]);

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && canUnlock) {
      handleUnlock();
    }
  };

  const showUnlockError = useCallback(() => {
    setUnlocking(false);
    showAppWalletError(timeoutRef, setError, "Failed to unlock wallet");
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
      title="Unlock Wallet"
      footer={
        <>
          <button
            type="button"
            className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#6c757d] tw-bg-[#6c757d] tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-text-white tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#565e64] enabled:hover:tw-bg-[#5c636a] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
            onClick={() => handleHide()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#0d6efd] tw-bg-[#0d6efd] tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-text-white tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#0a58ca] enabled:hover:tw-bg-[#0b5ed7] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
            disabled={!canUnlock}
            onClick={handleUnlock}
          >
            {unlocking ? "Unlocking..." : "Unlock"}
          </button>
        </>
      }
    >
      <label className="tw-flex tw-items-center tw-justify-between tw-pb-1">
        <span className="tw-select-none">Wallet Password</span>
        <FontAwesomeIcon
          icon={passHidden ? faEyeSlash : faEye}
          height={18}
          onClick={() => setPassHidden(!passHidden)}
          style={{
            cursor: "pointer",
          }}
        />
      </label>
      <input
        ref={inputRef}
        autoFocus
        type={passHidden ? "password" : "text"}
        placeholder="******"
        value={walletPass}
        className={styles["newWalletInput"]}
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
      {sensitiveAction && (
        <div className="tw-pt-3">
          <p className="tw-mb-2 tw-text-[#ffc107]">{sensitiveAction.warning}</p>
          <label className="tw-pb-1" htmlFor="sensitiveActionConfirmation">
            Type {sensitiveAction.confirmationText} to confirm{" "}
            {sensitiveAction.label}
          </label>
          <input
            id="sensitiveActionConfirmation"
            type="text"
            value={confirmation}
            className={styles["newWalletInput"]}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>
      )}
      <p className="tw-mb-1 tw-mt-4">
        {error ? (
          <span className="tw-text-[#dc3545]">{error}</span>
        ) : (
          <>Provide wallet password to continue</>
        )}
      </p>
    </AppWalletModalShell>
  );
}
