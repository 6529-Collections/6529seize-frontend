import styles from "./AppWallet.module.scss";
import { MutableRefObject, useCallback, useRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { decryptData } from "./app-wallet-helpers";
import { areEqualAddresses } from "../../helpers/Helpers";
import { useAuth } from "../auth/Auth";
import { useAppWallets } from "./AppWalletsContext";

export const SEED_MIN_PASS_LENGTH = 6;

const showAppWalletError = (
  timeoutRef: MutableRefObject<NodeJS.Timeout | null>,
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
    };
    onHide: (isSuccess?: boolean) => void;
  }>
) {
  const { createAppWallet, importAppWallet } = useAppWallets();
  const { setToast } = useAuth();
  const [walletName, setWalletName] = useState("");
  const [walletPass, setWalletPass] = useState("");
  const [passHidden, setPassHidden] = useState(true);
  const [error, setError] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHide = (isSuccess?: boolean) => {
    setWalletName("");
    setWalletPass("");
    setError("");
    props.onHide(isSuccess);
  };

  const handleCreate = useCallback(async () => {
    if (walletPass.length < SEED_MIN_PASS_LENGTH) {
      showAppWalletError(
        timeoutRef,
        setError,
        `Password must be at least ${SEED_MIN_PASS_LENGTH} characters long`
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
  }, [walletName, walletPass, isAdding]);

  const handleImport = useCallback(async () => {
    if (!props.import) return;

    if (walletPass.length < SEED_MIN_PASS_LENGTH) {
      showAppWalletError(
        timeoutRef,
        setError,
        `Password must be at least ${SEED_MIN_PASS_LENGTH} characters long`
      );
      return;
    } else {
      setError("");
    }

    setIsAdding(true);

    const success = await importAppWallet(
      walletName,
      walletPass,
      props.import.address,
      props.import.mnemonic,
      props.import.privateKey
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
  }, [walletName, walletPass, isAdding]);

  return (
    <Modal
      show={props.show}
      onHide={() => handleHide()}
      backdrop
      keyboard={false}
      centered>
      <Modal.Header className={styles.modalHeader}>
        <Modal.Title>
          {props.import ? `Import` : `Create New`} Wallet
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalContent}>
        <label className="pb-1" htmlFor="walletName">
          Wallet Name
        </label>
        <input
          id="walletName"
          autoFocus
          type="text"
          placeholder="My Wallet..."
          value={walletName}
          className={styles.newWalletInput}
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
          className={styles.newWalletInput}
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
      <Modal.Footer className={styles.modalContent}>
        <Button variant="secondary" onClick={() => handleHide()}>
          Cancel
        </Button>
        {props.import ? (
          <Button
            variant="primary"
            disabled={!walletName || !walletPass || isAdding}
            onClick={handleImport}>
            {isAdding ? "Importing..." : "Import"}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={!walletName || !walletPass || isAdding}
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

  const inputRef = useRef<HTMLInputElement>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHide = () => {
    setWalletPass("");
    setError("");
    setUnlocking(false);
    props.onHide();
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && walletPass) {
      handleUnlock();
    }
  };

  const showUnlockError = () => {
    setUnlocking(false);
    showAppWalletError(timeoutRef, setError, "Failed to unlock wallet");
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleUnlock = useCallback(async () => {
    setError("");
    setUnlocking(true);

    const doUnlock = async () => {
      try {
        const decryptedAddress = await decryptData(
          props.address,
          props.address_hashed,
          walletPass
        );
        if (areEqualAddresses(props.address, decryptedAddress)) {
          props.onUnlock(walletPass);
          handleHide();
        } else {
          showUnlockError();
        }
      } catch (e) {
        console.log("unlock error", e);
        showUnlockError();
      }
    };

    setTimeout(doUnlock, 0);
  }, [walletPass, unlocking]);

  return (
    <Modal
      show={props.show}
      onHide={() => handleHide()}
      backdrop
      keyboard={false}
      centered>
      <Modal.Header className={styles.modalHeader}>
        <Modal.Title>Unlock Wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalContent}>
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
          className={styles.newWalletInput}
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
        <p className="mt-4 mb-1">
          {error ? (
            <span className="text-danger">{error}</span>
          ) : (
            <>Provide wallet password to continue</>
          )}
        </p>
      </Modal.Body>
      <Modal.Footer className={styles.modalContent}>
        <Button variant="secondary" onClick={() => handleHide()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={
            unlocking || !walletPass || walletPass.length < SEED_MIN_PASS_LENGTH
          }
          onClick={handleUnlock}>
          {unlocking ? "Unlocking..." : "Unlock"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
