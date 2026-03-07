"use client";
import styles from "./AppWallet.module.scss";
import type { RefObject } from "react";
import { useCallback, useRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { decryptData } from "./app-wallet-helpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useAuth } from "../auth/Auth";
import { useAppWallets } from "./AppWalletsContext";

const WALLET_CREATE_MIN_PASS_LENGTH = 12;

type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Weak" | "Fair" | "Good" | "Strong";
  percent: number;
  variant: "danger" | "warning" | "info" | "success";
  hasLeadingOrTrailingWhitespace: boolean;
};

function getPasswordStrength(password: string): PasswordStrength {
  const hasLeadingOrTrailingWhitespace = /^\s|\s$/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 24) score += 1;

  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(
    Boolean
  ).length;
  if (variety >= 2) score += 1;
  if (variety >= 3) score += 1;

  score = Math.max(0, Math.min(4, score));

  const scoreTyped = score as 0 | 1 | 2 | 3 | 4;
  const labelByScore: Record<PasswordStrength["score"], PasswordStrength["label"]> =
    {
      0: "Weak",
      1: "Weak",
      2: "Fair",
      3: "Good",
      4: "Strong",
    };
  const variantByScore: Record<
    PasswordStrength["score"],
    PasswordStrength["variant"]
  > = {
    0: "danger",
    1: "danger",
    2: "warning",
    3: "info",
    4: "success",
  };

  return {
    score: scoreTyped,
    label: labelByScore[scoreTyped],
    percent: (scoreTyped / 4) * 100,
    variant: variantByScore[scoreTyped],
    hasLeadingOrTrailingWhitespace,
  };
}

function validateNewWalletPassword(password: string): string | null {
  if (password.length < WALLET_CREATE_MIN_PASS_LENGTH) {
    return `Password must be at least ${WALLET_CREATE_MIN_PASS_LENGTH} characters long`;
  }

  const strength = getPasswordStrength(password);
  if (strength.hasLeadingOrTrailingWhitespace) {
    return "Password must not start or end with whitespace";
  }
  if (strength.score < 3 && password.length < 16) {
    return "Password is too weak. Use a longer passphrase or add more character variety.";
  }
  return null;
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
    import?: {
      address: string;
      mnemonic: string;
      privateKey: string;
    } | undefined;
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
  const passStrength = getPasswordStrength(walletPass);
  const passError = validateNewWalletPassword(walletPass);

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
    const validationError = validateNewWalletPassword(walletPass);
    if (validationError) {
      showAppWalletError(
        timeoutRef,
        setError,
        validationError
      );
      return;
    } else {
      setError("");
    }

    setIsAdding(true);

    const success = await createAppWallet(walletName, walletPass);
    if (!success) {
      setToast({
        message: `Error creating wallet`,
        type: "error",
      });
    } else {
      setToast({
        message: `Wallet '${walletName}' created successfully - Download Recovery File immediately!`,
        type: "success",
      });
      handleHide(true);
    }
    setIsAdding(false);
  }, [createAppWallet, handleHide, setToast, walletName, walletPass]);

  const handleImport = useCallback(async () => {
    if (!importData) return;

    const validationError = validateNewWalletPassword(walletPass);
    if (validationError) {
      showAppWalletError(
        timeoutRef,
        setError,
        validationError
      );
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
        message: `Error importing wallet`,
        type: "error",
      });
    } else {
      setToast({ message: "Wallet imported successfully!", type: "success" });
      handleHide(true);
    }
    setIsAdding(false);
  }, [handleHide, importAppWallet, importData, setToast, walletName, walletPass]);

  return (
    <Modal
      show={show}
      onHide={() => handleHide()}
      backdrop
      keyboard={false}
      centered>
      <Modal.Header className={styles["modalHeader"]}>
        <Modal.Title>
          {importData ? `Import` : `Create New`} Wallet
        </Modal.Title>
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
          autoComplete="new-password"
          spellCheck={false}
          autoCapitalize="none"
          onChange={(e: any) => setWalletPass(e.target.value)}
        />
        {walletPass && (
          <div className="pt-2">
            <div className="progress" style={{ height: 8 }}>
              <div
                className={`progress-bar bg-${passStrength.variant}`}
                role="progressbar"
                style={{ width: `${passStrength.percent}%` }}
                aria-valuenow={passStrength.percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="pt-1 font-smaller font-color-h">
              Strength: {passStrength.label}
              {passError ? ` • ${passError}` : ""}
            </div>
          </div>
        )}
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
            disabled={!walletName || !walletPass || Boolean(passError) || isAdding}
            onClick={handleImport}>
            {isAdding ? "Importing..." : "Import"}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={!walletName || !walletPass || Boolean(passError) || isAdding}
            onClick={handleCreate}>
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
    onHide: () => void;
  }>
) {
  const [walletPass, setWalletPass] = useState("");
  const [passHidden, setPassHidden] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");

  const { show, address, address_hashed, onUnlock, onHide } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHide = useCallback(() => {
    setWalletPass("");
    setError("");
    setUnlocking(false);
    onHide();
  }, [onHide]);

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && walletPass) {
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
  }, [address, address_hashed, handleHide, onUnlock, showUnlockError, walletPass]);

  return (
    <Modal
      show={show}
      onHide={() => handleHide()}
      backdrop
      keyboard={false}
      centered>
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
          autoComplete="current-password"
          spellCheck={false}
          autoCapitalize="none"
          onChange={(e) => {
            const value = e.target.value;
            setWalletPass(value);
          }}
          onKeyDown={handleKeyPress}
        />
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
          disabled={unlocking || !walletPass}
          onClick={handleUnlock}>
          {unlocking ? "Unlocking..." : "Unlock"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
