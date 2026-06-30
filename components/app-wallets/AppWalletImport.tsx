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
      <div className="tw-mx-auto tw-w-full tw-px-3 min-[576px]:tw-max-w-[540px] min-[768px]:tw-max-w-[720px] min-[992px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1140px] min-[1400px]:tw-max-w-[1320px]">
        <AppWalletsUnsupported />
      </div>
    );
  }

  return (
    <>
      <div className="tw-mx-auto tw-w-full tw-px-3 tw-pt-5 min-[576px]:tw-max-w-[540px] min-[768px]:tw-max-w-[720px] min-[992px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1140px] min-[1400px]:tw-max-w-[1320px]">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
            <Link
              className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-no-underline"
              href="/tools/app-wallets"
            >
              <FontAwesomeIcon icon={faCircleArrowLeft} height={16} />
              Back to App Wallets
            </Link>
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
          <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
            <h1>Import App Wallet</h1>
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
          <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
            <button
              type="button"
              onClick={() => setIsMnemonic(true)}
              className={`tw-inline-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65] ${
                isMnemonic
                  ? "tw-border-[#0dcaf0] tw-bg-[#0dcaf0] tw-text-black enabled:hover:tw-border-[#25cff2] enabled:hover:tw-bg-[#31d2f2]"
                  : "tw-border-[#0dcaf0] tw-bg-transparent tw-text-[#0dcaf0] enabled:hover:tw-bg-[#0dcaf0] enabled:hover:tw-text-black"
              }`}
            >
              Mnemonic
            </button>
          </div>
          <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
            <button
              type="button"
              onClick={() => setIsMnemonic(false)}
              className={`tw-inline-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65] ${
                isMnemonic
                  ? "tw-border-[#0dcaf0] tw-bg-transparent tw-text-[#0dcaf0] enabled:hover:tw-bg-[#0dcaf0] enabled:hover:tw-text-black"
                  : "tw-border-[#0dcaf0] tw-bg-[#0dcaf0] tw-text-black enabled:hover:tw-border-[#25cff2] enabled:hover:tw-bg-[#31d2f2]"
              }`}
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
    <div className="tw-mx-auto tw-w-full tw-px-3 tw-pb-5 tw-pt-3 min-[576px]:tw-max-w-[540px] min-[768px]:tw-max-w-[720px] min-[992px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1140px] min-[1400px]:tw-max-w-[1320px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        {phrase.map((w, i) => (
          <div
            className="tw-relative tw-w-1/2 tw-max-w-full tw-flex-none tw-px-3 tw-pb-2 tw-pt-2 min-[576px]:tw-w-1/3 min-[768px]:tw-w-1/4"
            key={MNEMONIC_WORD_FIELD_IDS[i]}
          >
            <div className={styles["phrase"]}>
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-1 tw-gap-2 tw-px-3">
                  <span className="tw-font-extralight tw-text-iron-400">
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
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <div className="tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-1 tw-items-center tw-justify-between tw-px-3">
          <button
            type="button"
            onClick={clear}
            className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#ffc107] tw-bg-[#ffc107] tw-px-3 tw-py-1.5 tw-text-base tw-font-bold tw-leading-6 tw-text-black tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#ffc720] enabled:hover:tw-bg-[#ffca2c] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
            disabled={!phrase.some(Boolean) && !isCompletePhrase()}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!isCompletePhrase() || isReadonly}
            onClick={validate}
            className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#0d6efd] tw-bg-[#0d6efd] tw-px-3 tw-py-1.5 tw-text-base tw-font-bold tw-leading-6 tw-text-white tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#0a58ca] enabled:hover:tw-bg-[#0b5ed7] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
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
    <div className="tw-mx-auto tw-w-full tw-px-3 tw-pb-5 tw-pt-3 min-[576px]:tw-max-w-[540px] min-[768px]:tw-max-w-[720px] min-[992px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1140px] min-[1400px]:tw-max-w-[1320px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3 tw-pb-2 tw-pt-2">
          <div className={styles["phrase"]}>
            <div className="-tw-mx-3 tw-flex tw-flex-wrap">
              <div className="tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-1 tw-gap-2 tw-px-3">
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
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <div className="tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-1 tw-items-center tw-justify-between tw-px-3">
          <button
            type="button"
            onClick={clear}
            className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#ffc107] tw-bg-[#ffc107] tw-px-3 tw-py-1.5 tw-text-base tw-font-bold tw-leading-6 tw-text-black tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#ffc720] enabled:hover:tw-bg-[#ffca2c] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
            disabled={!privateKey}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!privateKey || isReadonly}
            onClick={validate}
            className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-[#0d6efd] tw-bg-[#0d6efd] tw-px-3 tw-py-1.5 tw-text-base tw-font-bold tw-leading-6 tw-text-white tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#0a58ca] enabled:hover:tw-bg-[#0b5ed7] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
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
    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-3">
      <div className="tw-relative tw-w-full tw-max-w-full tw-flex-none tw-px-3">
        {props.error}
      </div>
      <div className="tw-relative tw-w-full tw-max-w-full tw-flex-none tw-px-3">
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
    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
      <div className="tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-none tw-items-center tw-gap-2 tw-px-3">
        <FontAwesomeIcon icon={faCheckCircle} height={22} color="#00ff00" />
        Private Key is Valid!
      </div>
      <div className="tw-relative tw-w-full tw-max-w-full tw-flex-none tw-px-3 tw-pt-2">
        - Address: {props.wallet.address}
      </div>
      <div className="tw-relative tw-w-full tw-max-w-full tw-flex-none tw-px-3 tw-pt-3">
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
        className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-[#0d6efd] tw-bg-[#0d6efd] tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-text-white tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-border-[#0a58ca] enabled:hover:tw-bg-[#0b5ed7] disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]"
      >
        <FontAwesomeIcon icon={faPlusCircle} height={16} /> Import Wallet
      </button>
    </div>
  );
}
