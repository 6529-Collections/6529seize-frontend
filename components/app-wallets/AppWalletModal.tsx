"use client";
import styles from "./AppWallet.module.scss";
import type { RefObject } from "react";
import { useCallback, useRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { decryptData, getAppWalletPassphraseError } from "./app-wallet-helpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useAuth } from "../auth/Auth";
import { useAppWallets } from "./AppWalletsContext";

const LEGACY_UNLOCK_MIN_PASS_LENGTH = 6;

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
    <Modal
      show={show}
      onHide={() => handleHide()}
      backdrop
      keyboard={false}
      centered
    >
      <Modal.Header className={styles["modalHeader"]}>
        <Modal.Title>{importData ? `Import` : `Create New`} Wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles["modalContent"]}>
        <label className="pb-1" htmlFor="walletName">
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
              showAppWalletError(
                timeoutRef,
                setError,
                "Name can only contain alphanumeric characters and spaces"
              );
            }
          }}
        />
        <label className="pt-3 pb-1 d-flex align-items-center justify-content-between">
          <span className="unselectable">Wallet Password</span>
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
                "Password must not contain any whitespace characters"
              );
            }
          }}
        />
        <p className="mt-4 mb-1">
          {error ? (
            <span className="text-danger">{error}</span>
          ) : (
            <>Provide a name and password for your new wallet</>
          )}
        </p>
      </Modal.Body>
      <Modal.Footer className={styles["modalContent"]}>
        <Button variant="secondary" onClick={() => handleHide()}>
          Cancel
        </Button>
        {importData ? (
          <Button
            variant="primary"
            disabled={!walletName || !walletPass || isAdding}
            onClick={handleImport}
          >
            {isAdding ? "Importing..." : "Import"}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={!walletName || !walletPass || isAdding}
            onClick={handleCreate}
          >
            {isAdding ? "Creating..." : "Create"}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export function UnlockAppWalletModal(
  props: Readonly<{
    show: boolean;
    address: string;
    address_hashed: string;
    onUnlock: (pass: string) => void;
    onVerifiedUnlock?:
      | ((address: string, pass: string) => Promise<unknown> | unknown)
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

  const handleHide = useCallback(() => {
    setWalletPass("");
    setConfirmation("");
    setError("");
    setUnlocking(false);
    onHide();
  }, [onHide]);

  const handleKeyPress = (e: any) => {
    if (
      e.key === "Enter" &&
      walletPass &&
      (!sensitiveAction || confirmation === sensitiveAction.confirmationText)
    ) {
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

  const sensitiveActionConfirmed =
    !sensitiveAction || confirmation === sensitiveAction.confirmationText;

  return (
    <Modal
      show={show}
      onHide={() => handleHide()}
      backdrop
      keyboard={false}
      centered
    >
      <Modal.Header className={styles["modalHeader"]}>
        <Modal.Title>Unlock Wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles["modalContent"]}>
        <label className="pb-1 d-flex align-items-center justify-content-between">
          <span className="unselectable">Wallet Password</span>
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
                "Password must not contain any whitespace characters"
              );
            }
          }}
          onKeyDown={handleKeyPress}
        />
        {sensitiveAction && (
          <div className="pt-3">
            <p className="mb-2 text-warning">{sensitiveAction.warning}</p>
            <label className="pb-1" htmlFor="sensitiveActionConfirmation">
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
        <p className="mt-4 mb-1">
          {error ? (
            <span className="text-danger">{error}</span>
          ) : (
            <>Provide wallet password to continue</>
          )}
        </p>
      </Modal.Body>
      <Modal.Footer className={styles["modalContent"]}>
        <Button variant="secondary" onClick={() => handleHide()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={
            unlocking ||
            !walletPass ||
            walletPass.length < LEGACY_UNLOCK_MIN_PASS_LENGTH ||
            !sensitiveActionConfirmed
          }
          onClick={handleUnlock}
        >
          {unlocking ? "Unlocking..." : "Unlock"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
