"use client";

import styles from "./AppWallet.module.scss";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  faCheckCircle,
  faCircleArrowLeft,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ethers } from "ethers";
import { CreateAppWalletModal } from "./AppWalletModal";
import { useAuth } from "../auth/Auth";
import {
  APP_WALLET_MNEMONIC_UNAVAILABLE,
  useAppWallets,
} from "./AppWalletsContext";
import AppWalletsUnsupported from "./AppWalletsUnsupported";
import {
  appWalletButtonClassName,
  appWalletCol12ClassName,
  appWalletColClassName,
  appWalletContainerClassName,
  appWalletPhraseColClassName,
  appWalletRowClassName,
} from "./app-wallet-tailwind-classes";

const MNEMONIC_UNAVAILABLE = APP_WALLET_MNEMONIC_UNAVAILABLE;
const MNEMONIC_WORD_FIELD_IDS = Array.from(
  { length: 12 },
  (_, index) => `mnemonic-word-${index + 1}`
);

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export default function AppWalletImport() {
  const [isMnemonic, setIsMnemonic] = useState(true);

  const { appWalletsSupported } = useAppWallets();

  if (!appWalletsSupported) {
    return (
      <div className={appWalletContainerClassName}>
        <AppWalletsUnsupported />
      </div>
    );
  }

  return (
    <>
      <div className={`${appWalletContainerClassName} tw-pt-5`}>
        <div className={appWalletRowClassName}>
          <div className={appWalletColClassName}>
            <Link
              className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-no-underline"
              href="/tools/app-wallets"
            >
              <FontAwesomeIcon icon={faCircleArrowLeft} height={16} />
              Back to App Wallets
            </Link>
          </div>
        </div>
        <div className={`${appWalletRowClassName} tw-pt-4`}>
          <div className={appWalletColClassName}>
            <h1>Import App Wallet</h1>
          </div>
        </div>
        <div className={`${appWalletRowClassName} tw-pt-4`}>
          <div className={appWalletColClassName}>
            <button
              type="button"
              onClick={() => setIsMnemonic(true)}
              className={appWalletButtonClassName(
                isMnemonic ? "info" : "outline-info",
                "tw-w-full"
              )}
            >
              Mnemonic
            </button>
          </div>
          <div className={appWalletColClassName}>
            <button
              type="button"
              onClick={() => setIsMnemonic(false)}
              className={appWalletButtonClassName(
                !isMnemonic ? "info" : "outline-info",
                "tw-w-full"
              )}
            >
              Private Key
            </button>
          </div>
        </div>
      </div>
      {isMnemonic ? <AppWalletImportMnemonic /> : <AppWalletImportPrivateKey />}
    </>
  );
}

function AppWalletImportMnemonic() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setToast } = useAuth();
  const [phrase, setPhrase] = useState<string[]>(Array(12).fill(""));
  const [isReadonly, setIsReadonly] = useState(false);

  const [currentFocus, setCurrentFocus] = useState(0);

  const [error, setError] = useState("");
  const [validatedWallet, setValidatedWallet] = useState<
    ethers.Wallet | ethers.HDNodeWallet
  >();

  const clear = () => {
    setPhrase(Array(12).fill(""));
    setError("");
    setIsReadonly(false);
    setValidatedWallet(undefined);
    setCurrentFocus(0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const validate = () => {
    setIsReadonly(true);
    try {
      const wallet = ethers.Wallet.fromPhrase(phrase.join(" "));
      setValidatedWallet(wallet);
    } catch (error: unknown) {
      setError(`Error: ${getErrorMessage(error)}`);
    }
  };

  function isCompletePhrase() {
    return phrase.every((w) => w);
  }

  return (
    <div className={`${appWalletContainerClassName} tw-pb-5 tw-pt-3`}>
      <div className={appWalletRowClassName}>
        {phrase.map((w, i) => (
          <div
            className={`${appWalletPhraseColClassName} tw-pb-2 tw-pt-2`}
            key={MNEMONIC_WORD_FIELD_IDS[i]}
          >
            <div className={styles["phrase"]}>
              <div className={appWalletRowClassName}>
                <div className={`${appWalletColClassName} tw-flex tw-gap-2`}>
                  <span className="tw-text-iron-400 tw-font-extralight">
                    {i + 1}
                  </span>
                  <span>
                    <input
                      autoFocus={i === currentFocus}
                      type="text"
                      placeholder={`word ${i + 1}`}
                      value={w}
                      className={styles["importWalletWordInput"]}
                      onChange={(e) => {
                        const newPhrase = e.target.value;
                        if (/^[a-z]*$/.test(newPhrase)) {
                          setPhrase((prev) => {
                            const currentPhrase = [...prev];
                            currentPhrase[i] = newPhrase;
                            return currentPhrase;
                          });
                        } else {
                          setToast({
                            message:
                              "Mnemonic words can only use lowercase letters.",
                            type: "error",
                          });
                        }
                      }}
                      onFocus={() => setCurrentFocus(i)}
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={`${appWalletRowClassName} tw-pt-4`}>
        <div
          className={`${appWalletColClassName} tw-flex tw-items-center tw-justify-between`}>
          <button
            type="button"
            onClick={clear}
            className={appWalletButtonClassName("warning", "tw-font-bold")}
            disabled={!phrase.some(Boolean) && !isCompletePhrase()}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!isCompletePhrase() || isReadonly}
            onClick={validate}
            className={appWalletButtonClassName("primary", "tw-font-bold")}
          >
            Validate
          </button>
        </div>
      </div>
      {error && <ValidationError error={error} />}
      {validatedWallet && (
        <ValidatedWallet wallet={validatedWallet} mnemonic={phrase.join(" ")} />
      )}
    </div>
  );
}

function AppWalletImportPrivateKey() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [privateKey, setPrivateKey] = useState("");
  const [isReadonly, setIsReadonly] = useState(false);

  const [error, setError] = useState("");
  const [validatedWallet, setValidatedWallet] = useState<
    ethers.Wallet | ethers.HDNodeWallet
  >();

  const clear = () => {
    setPrivateKey("");
    setError("");
    setIsReadonly(false);
    setValidatedWallet(undefined);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const validate = () => {
    setIsReadonly(true);
    try {
      const wallet = new ethers.Wallet(privateKey);
      setValidatedWallet(wallet);
    } catch (error: unknown) {
      setError(`Error: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className={`${appWalletContainerClassName} tw-pb-5 tw-pt-3`}>
      <div className={appWalletRowClassName}>
        <div className={`${appWalletColClassName} tw-pb-2 tw-pt-2`}>
          <div className={styles["phrase"]}>
            <div className={appWalletRowClassName}>
              <div className={`${appWalletColClassName} tw-flex tw-gap-2`}>
                <input
                  ref={inputRef}
                  autoFocus
                  disabled={isReadonly}
                  type="text"
                  placeholder="private key"
                  value={privateKey}
                  className={styles["importWalletWordInput"]}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`${appWalletRowClassName} tw-pt-4`}>
        <div
          className={`${appWalletColClassName} tw-flex tw-items-center tw-justify-between`}>
          <button
            type="button"
            onClick={clear}
            className={appWalletButtonClassName("warning", "tw-font-bold")}
            disabled={!privateKey}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!privateKey || isReadonly}
            onClick={validate}
            className={appWalletButtonClassName("primary", "tw-font-bold")}
          >
            Validate
          </button>
        </div>
      </div>
      {error && <ValidationError error={error} />}
      {validatedWallet && (
        <ValidatedWallet
          wallet={validatedWallet}
          mnemonic={MNEMONIC_UNAVAILABLE}
        />
      )}
    </div>
  );
}

function ValidationError(props: Readonly<{ error: string }>) {
  return (
    <div className={`${appWalletRowClassName} tw-pt-3`}>
      <div className={appWalletCol12ClassName}>{props.error}</div>
      <div className={appWalletCol12ClassName}>
        - Clear the form and try again
      </div>
    </div>
  );
}

function ValidatedWallet(
  props: Readonly<{
    wallet: ethers.Wallet | ethers.HDNodeWallet;
    mnemonic: string;
  }>
) {
  return (
    <div className={`${appWalletRowClassName} tw-pt-4`}>
      <div
        className={`${appWalletCol12ClassName} tw-flex tw-items-center tw-gap-2`}>
        <FontAwesomeIcon icon={faCheckCircle} height={22} color="#00ff00" />
        Private Key is Valid!
      </div>
      <div className={`${appWalletCol12ClassName} tw-pt-2`}>
        - Address: {props.wallet.address}
      </div>
      <div className={`${appWalletCol12ClassName} tw-pt-3`}>
        <ImportWallet wallet={props.wallet} mnemonic={props.mnemonic} />
      </div>
    </div>
  );
}

function ImportWallet(
  props: Readonly<{
    wallet: ethers.Wallet | ethers.HDNodeWallet;
    mnemonic: string;
  }>
) {
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <div className="tw-flex tw-gap-2">
      <CreateAppWalletModal
        show={showImportModal}
        onHide={(isSuccess?: boolean) => {
          setShowImportModal(false);
          if (isSuccess) {
            router.push("/tools/app-wallets");
          }
        }}
        import={{
          address: props.wallet.address,
          mnemonic: props.mnemonic,
          privateKey: props.wallet.privateKey,
        }}
      />
      <button
        type="button"
        onClick={() => setShowImportModal(true)}
        className={appWalletButtonClassName("primary", "tw-gap-2")}
      >
        <FontAwesomeIcon icon={faPlusCircle} height={16} /> Import Wallet
      </button>
    </div>
  );
}
