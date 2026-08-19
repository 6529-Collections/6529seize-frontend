"use client";

import Button from "@/components/utils/button/Button";
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
  DELEGATION_CARD_CLASS_NAME,
  DELEGATION_FIELD_CLASS_NAME,
  DELEGATION_PAGE_CONTAINER_CLASS_NAME,
  DELEGATION_PAGE_TITLE_CLASS_NAME,
} from "@/components/delegation/delegation-ui";

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
      <div className={DELEGATION_PAGE_CONTAINER_CLASS_NAME}>
        <AppWalletsUnsupported />
      </div>
    );
  }

  return (
    <div className={DELEGATION_PAGE_CONTAINER_CLASS_NAME}>
      <Link
        className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline tw-transition-colors"
        href="/tools/app-wallets"
      >
        <FontAwesomeIcon icon={faCircleArrowLeft} height={16} />
        Back to App Wallets
      </Link>
      <h1 className={`${DELEGATION_PAGE_TITLE_CLASS_NAME} tw-mt-5`}>
        Import App Wallet
      </h1>
      <div className="tw-mt-6 tw-grid tw-grid-cols-2 tw-gap-3">
        <Button
          type="button"
          onClick={() => setIsMnemonic(true)}
          variant={isMnemonic ? "action" : "secondary"}
          size="lg"
          fullWidth
        >
          Mnemonic
        </Button>
        <Button
          type="button"
          onClick={() => setIsMnemonic(false)}
          variant={isMnemonic ? "secondary" : "action"}
          size="lg"
          fullWidth
        >
          Private Key
        </Button>
      </div>
      <div className="tw-mt-4">
        {isMnemonic ? (
          <AppWalletImportMnemonic />
        ) : (
          <AppWalletImportPrivateKey />
        )}
      </div>
    </div>
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
    <section className={`${DELEGATION_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}>
      <div className="tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-3 md:tw-grid-cols-4">
        {phrase.map((w, i) => (
          <label
            className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/25 tw-px-3 tw-transition-colors focus-within:tw-border-primary-400/70 focus-within:tw-ring-2 focus-within:tw-ring-primary-400/20"
            key={MNEMONIC_WORD_FIELD_IDS[i]}
            htmlFor={MNEMONIC_WORD_FIELD_IDS[i]}
          >
            <span className="tw-shrink-0 tw-text-xs tw-text-iron-500">
              {i + 1}
            </span>
            <input
              id={MNEMONIC_WORD_FIELD_IDS[i]}
              ref={i === 0 ? inputRef : undefined}
              autoFocus={i === currentFocus}
              type="password"
              autoComplete="off"
              placeholder={`word ${i + 1}`}
              value={w}
              className="tw-h-11 tw-min-w-0 tw-flex-1 tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-text-iron-100 tw-outline-none placeholder:tw-text-iron-600"
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
                    message: "Mnemonic words can only use lowercase letters.",
                    type: "error",
                  });
                }
              }}
              onFocus={() => setCurrentFocus(i)}
            />
          </label>
        ))}
      </div>
      <div className="tw-mt-5 tw-flex tw-items-center tw-justify-between tw-gap-3">
        <Button
          type="button"
          onClick={clear}
          disabled={!phrase.some(Boolean) && !isCompletePhrase()}
          variant="secondary"
          size="md"
        >
          Clear
        </Button>
        <Button
          type="button"
          disabled={!isCompletePhrase() || isReadonly}
          onClick={validate}
          variant="action"
          size="md"
        >
          Validate
        </Button>
      </div>
      {error && <ValidationError error={error} />}
      {validatedWallet && (
        <ValidatedWallet wallet={validatedWallet} mnemonic={phrase.join(" ")} />
      )}
    </section>
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
    <section className={`${DELEGATION_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}>
      <label
        htmlFor="app-wallet-private-key"
        className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-200"
      >
        Private Key
      </label>
      <input
        id="app-wallet-private-key"
        ref={inputRef}
        autoFocus
        disabled={isReadonly}
        type="password"
        autoComplete="off"
        placeholder="private key"
        value={privateKey}
        className={DELEGATION_FIELD_CLASS_NAME}
        onChange={(e) => setPrivateKey(e.target.value)}
      />
      <div className="tw-mt-5 tw-flex tw-items-center tw-justify-between tw-gap-3">
        <Button
          type="button"
          onClick={clear}
          disabled={!privateKey}
          variant="secondary"
          size="md"
        >
          Clear
        </Button>
        <Button
          type="button"
          disabled={!privateKey || isReadonly}
          onClick={validate}
          variant="action"
          size="md"
        >
          Validate
        </Button>
      </div>
      {error && <ValidationError error={error} />}
      {validatedWallet && (
        <ValidatedWallet
          wallet={validatedWallet}
          mnemonic={MNEMONIC_UNAVAILABLE}
        />
      )}
    </section>
  );
}

function ValidationError(props: Readonly<{ error: string }>) {
  return (
    <div
      className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-red/30 tw-bg-red/10 tw-p-4 tw-text-sm tw-leading-6 tw-text-red"
      role="alert"
    >
      <div>{props.error}</div>
      <div>- Clear the form and try again</div>
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
    <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-emerald-500/25 tw-bg-emerald-500/10 tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-200">
      <div className="tw-flex tw-items-center tw-gap-2 tw-font-semibold tw-text-emerald-300">
        <FontAwesomeIcon icon={faCheckCircle} height={20} />
        Private Key is Valid!
      </div>
      <div className="tw-mt-2 tw-break-all">
        - Address: {props.wallet.address}
      </div>
      <div className="tw-mt-3">
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
      <Button
        type="button"
        onClick={() => setShowImportModal(true)}
        variant="action"
        size="md"
      >
        <FontAwesomeIcon icon={faPlusCircle} height={16} /> Import Wallet
      </Button>
    </div>
  );
}
