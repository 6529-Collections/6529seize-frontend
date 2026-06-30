"use client";

import styles from "./AppWallet.module.scss";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import {
  faCircleArrowLeft,
  faCopy,
  faExternalLink,
  faEye,
  faEyeSlash,
  faFileDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBalance, useChainId } from "wagmi";
import { sepolia } from "viem/chains";

import type { AppWallet } from "./AppWalletsContext";
import {
  APP_WALLET_MNEMONIC_UNAVAILABLE,
  useAppWallets,
} from "./AppWalletsContext";

import {
  areEqualAddresses,
  fromGWEI,
  getAddressEtherscanLink,
} from "@/helpers/Helpers";
import { useAuth } from "../auth/Auth";
import DotLoader, { Spinner } from "../dotLoader/DotLoader";
import { UnlockAppWalletModal } from "./AppWalletModal";
import { decryptData } from "./app-wallet-helpers";
import AppWalletAvatar from "./AppWalletAvatar";
import AppWalletsUnsupported from "./AppWalletsUnsupported";
import { Share } from "@capacitor/share";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import {
  appWalletButtonClassName,
  appWalletCol12ClassName,
  appWalletColClassName,
  appWalletContainerClassName,
  appWalletPhraseColClassName,
  appWalletRowClassName,
} from "./app-wallet-tailwind-classes";

const SECRET_REVEAL_TIMEOUT_MS = 60000;
const SECRET_CLIPBOARD_TTL_MS = 30000;

export default function AppWalletComponent(
  props: Readonly<{
    address: string;
  }>
) {
  const {
    appWalletsSupported,
    fetchingAppWallets,
    appWallets,
    deleteAppWallet,
    migrateAppWallet,
  } = useAppWallets();

  const appWallet = appWallets.find((w) =>
    areEqualAddresses(w.address, props.address)
  );

  const router = useRouter();
  const chainId = useChainId();
  const { setToast } = useAuth();
  const account = useSeizeConnectContext();

  const balance = useBalance({
    address: props.address as `0x${string}`,
    chainId: chainId,
  });

  const [mnemonicAvailable, setMnemonicAvailable] = useState(false);

  const [phrase, setPhrase] = useState<string[]>(Array(12).fill(""));
  const [privateKey, setPrivateKey] = useState("");

  const [isRevealingPhrase, setIsRevealingPhrase] = useState(false);
  const [revealPhrase, setRevealPhrase] = useState(false);
  const [isRevealingPrivateKey, setIsRevealingPrivateKey] = useState(false);
  const [revealPrivateKey, setRevealPrivateKey] = useState(false);
  const [isExportingPlaintext, setIsExportingPlaintext] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [mnemonicCopied, setMnemonicCopied] = useState(false);
  const [privateKeyCopied, setPrivateKeyCopied] = useState(false);

  const setEncryptedPhrase = useCallback(() => {
    setPhrase(Array(12).fill("x".repeat(8)));
  }, []);

  const setEncryptedPrivateKey = useCallback(() => {
    setPrivateKey("0x" + "x".repeat(64));
  }, []);

  useEffect(() => {
    setEncryptedPhrase();
    setEncryptedPrivateKey();
    setMnemonicAvailable(
      appWallet
        ? (appWallet.has_mnemonic ??
            appWallet.mnemonic !== APP_WALLET_MNEMONIC_UNAVAILABLE)
        : false
    );
  }, [appWallet, setEncryptedPhrase, setEncryptedPrivateKey]);

  const hidePhrase = useCallback(() => {
    setRevealPhrase(false);
    setEncryptedPhrase();
  }, [setEncryptedPhrase]);

  const hidePrivateKey = useCallback(() => {
    setRevealPrivateKey(false);
    setEncryptedPrivateKey();
  }, [setEncryptedPrivateKey]);

  useEffect(() => {
    if (!revealPhrase) {
      return;
    }

    const timeoutId = setTimeout(hidePhrase, SECRET_REVEAL_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [hidePhrase, revealPhrase]);

  useEffect(() => {
    if (!revealPrivateKey) {
      return;
    }

    const timeoutId = setTimeout(hidePrivateKey, SECRET_REVEAL_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [hidePrivateKey, revealPrivateKey]);

  const writeRecoveryFile = async (
    fileName: string,
    content: string,
    title: string,
    text: string
  ) => {
    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title,
        text,
        url: result.uri,
        dialogTitle: "Share or Save File",
      });
    } catch {
      alert("Unable to write file");
    }
  };

  const doEncryptedDownload = async (wallet: AppWallet) => {
    const fileName = `${wallet.name.replace(/\s+/g, "_")}-${
      wallet.address
    }-encrypted-recovery.json`;
    const recoveryPayload = {
      version: 2,
      type: "6529-app-wallet-encrypted-recovery",
      exported_at: new Date().toISOString(),
      wallet: {
        name: wallet.name,
        created_at: wallet.created_at,
        address: wallet.address,
        imported: wallet.imported,
        encryption_version: wallet.encryption_version ?? 1,
        has_mnemonic:
          wallet.has_mnemonic ??
          wallet.mnemonic !== APP_WALLET_MNEMONIC_UNAVAILABLE,
        address_hashed: wallet.address_hashed,
        mnemonic: wallet.mnemonic,
        private_key: wallet.private_key,
      },
    };

    await writeRecoveryFile(
      fileName,
      JSON.stringify(recoveryPayload, null, 2),
      "Encrypted Wallet Recovery File",
      `${wallet.name} - ${wallet.address}`
    );
  };

  const doPlaintextDownload = async (
    wallet: AppWallet,
    decryptedMnemonic: string,
    decryptedPrivateKey: string
  ) => {
    let content = `Name: ${wallet.name}\n\n`;
    content += `Address: ${wallet.address}\n\n`;
    content += `Mnemonic: ${decryptedMnemonic}\n\n`;
    content += `Private Key: ${decryptedPrivateKey}\n\n`;

    const fileName = `${wallet.name.replace(/\s+/g, "_")}-${
      wallet.address
    }-plaintext-recovery.txt`;

    await writeRecoveryFile(
      fileName,
      content,
      "Plaintext Wallet Recovery File",
      `${wallet.name} - ${wallet.address}`
    );
  };

  const clearClipboardIfUnchanged = useCallback(async (value: string) => {
    const clipboard = navigator.clipboard;
    if (!clipboard?.writeText) {
      return;
    }

    try {
      if (!clipboard.readText) {
        return;
      }

      const currentText = await clipboard.readText();
      if (currentText !== value) {
        return;
      }

      await clipboard.writeText("");
    } catch {
      // Clipboard read/write permissions vary by platform; clearing is best-effort.
    }
  }, []);

  const copySecretToClipboard = useCallback(
    async (value: string, setCopied: Dispatch<SetStateAction<boolean>>) => {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
      setTimeout(() => {
        clearClipboardIfUnchanged(value);
      }, SECRET_CLIPBOARD_TTL_MS);
    },
    [clearClipboardIfUnchanged]
  );

  const doDelete = useCallback(
    async (name: string, address: string) => {
      if (areEqualAddresses(address, account.address)) {
        setToast({
          message: "Disconnect this wallet before deleting it.",
          type: "error",
        });
        return;
      }
      const shouldDelete = window.confirm(
        `Are you sure you want to delete wallet '${name}'?`
      );
      if (!shouldDelete) {
        return;
      }
      const success = await deleteAppWallet(address);
      if (!success) {
        setToast({
          message: `Couldn't delete this wallet. Please try again.`,
          type: "error",
        });
      } else {
        router.push("/tools/app-wallets");
        setToast({
          title: "Wallet deleted.",
          description: `${name} was removed from this app.`,
          type: "success",
        });
      }
    },
    [account.address, deleteAppWallet, router, setToast]
  );

  if (fetchingAppWallets) {
    return (
      <div className={`${appWalletContainerClassName} tw-pb-4 tw-pt-4`}>
        <div className={appWalletRowClassName}>
          <div className={`${appWalletColClassName} tw-flex tw-gap-2`}>
            <span>Fetching wallet</span>
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  if (!appWalletsSupported) {
    return (
      <div className={`${appWalletContainerClassName} tw-pb-4 tw-pt-4`}>
        <AppWalletsUnsupported />
      </div>
    );
  }

  if (!appWallet) {
    return (
      <div className={`${appWalletContainerClassName} tw-pb-4 tw-pt-4`}>
        <div className={appWalletRowClassName}>
          <div className={appWalletColClassName}>
            Wallet with address <b>{props.address}</b> not found.
          </div>
        </div>
      </div>
    );
  }

  function printBalance() {
    let balanceContent: ReactNode;
    if (balance.isFetching) {
      balanceContent = <DotLoader />;
    } else if (balance.data) {
      balanceContent = (
        <>
          {fromGWEI(Number(balance.data.value)).toLocaleString()}{" "}
          {balance.data?.symbol}
          {chainId === sepolia.id && (
            <span className="tw-text-iron-400"> (sepolia)</span>
          )}
        </>
      );
    } else {
      balanceContent = <span>Error</span>;
    }

    return <span>Balance: {balanceContent}</span>;
  }

  return (
    <div className={`${appWalletContainerClassName} tw-pb-4 tw-pt-4`}>
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
        <div
          className={`${appWalletColClassName} tw-flex tw-items-center tw-justify-between`}
        >
          <h3 className="tw-mb-0 tw-flex tw-items-center tw-gap-2">
            <AppWalletAvatar address={appWallet.address} size={50} />
            {appWallet.name}
            {appWallet.imported ? (
              <span className="tw-text-iron-400"> (imported)</span>
            ) : (
              <></>
            )}
          </h3>
          {printBalance()}
        </div>
      </div>
      <div className={`${appWalletRowClassName} tw-pt-4`}>
        <div
          className={`${appWalletColClassName} tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2`}
        >
          <span>
            Wallet Address:{" "}
            <span className="tw-text-lg tw-font-bold">
              {appWallet.address.toLowerCase()}
            </span>
          </span>
          <span className="tw-flex tw-items-center tw-gap-2">
            <>
              <FontAwesomeIcon
                className="tw-cursor-pointer tw-select-none"
                icon={faExternalLink}
                height={22}
                data-tooltip-id={`etherscan-${appWallet.address}`}
                onClick={() =>
                  window.open(
                    getAddressEtherscanLink(chainId, appWallet.address),
                    "_blank"
                  )
                }
              />
              <Tooltip
                id={`etherscan-${appWallet.address}`}
                place="top"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                View on Etherscan
              </Tooltip>
            </>
            <>
              <FontAwesomeIcon
                className="tw-cursor-pointer tw-select-none"
                icon={faFileDownload}
                height={22}
                data-tooltip-id={`download-${appWallet.address}`}
                onClick={() => doEncryptedDownload(appWallet)}
              />
              <Tooltip
                id={`download-${appWallet.address}`}
                place="top"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                Download encrypted recovery file
              </Tooltip>
            </>
            <UnlockAppWalletModal
              address={appWallet.address}
              address_hashed={appWallet.address_hashed}
              show={isExportingPlaintext}
              onHide={() => setIsExportingPlaintext(false)}
              onVerifiedUnlock={migrateAppWallet}
              sensitiveAction={{
                label: "plaintext export",
                warning:
                  "Plaintext recovery files expose the mnemonic and private key without encryption.",
                confirmationText: "EXPORT",
              }}
              onUnlock={(pass: string) => {
                decryptData(
                  appWallet.address,
                  appWallet.private_key,
                  pass
                ).then(async (decryptedPrivateKey) => {
                  let decryptedMnemonic = appWallet.mnemonic;
                  if (
                    appWallet.has_mnemonic ??
                    decryptedMnemonic !== APP_WALLET_MNEMONIC_UNAVAILABLE
                  ) {
                    decryptedMnemonic = await decryptData(
                      appWallet.address,
                      appWallet.mnemonic,
                      pass
                    );
                  } else {
                    decryptedMnemonic = APP_WALLET_MNEMONIC_UNAVAILABLE;
                  }
                  doPlaintextDownload(
                    appWallet,
                    decryptedMnemonic,
                    decryptedPrivateKey
                  );
                });
              }}
            />
            <>
              <FontAwesomeIcon
                className="tw-cursor-pointer tw-select-none"
                icon={faCopy}
                height={22}
                data-tooltip-id={`copy-address-${appWallet.address}`}
                onClick={() => {
                  navigator.clipboard.writeText(appWallet.address);
                  setAddressCopied(true);
                  setTimeout(() => {
                    setAddressCopied(false);
                  }, 1500);
                }}
              />
              <Tooltip
                id={`copy-address-${appWallet.address}`}
                place="top"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                {addressCopied ? "Copied!" : "Copy address to clipboard"}
              </Tooltip>
            </>
          </span>
        </div>
      </div>
      <div className={`${appWalletRowClassName} tw-pt-5`}>
        <div
          className={`${appWalletColClassName} tw-flex tw-items-center tw-justify-between`}
        >
          <span>Mnemonic Phrase</span>
          {mnemonicAvailable && (
            <span className="tw-flex tw-items-center tw-gap-3">
              <>
                <FontAwesomeIcon
                  className="tw-cursor-pointer tw-select-none"
                  icon={revealPhrase ? faEye : faEyeSlash}
                  height={22}
                  data-tooltip-id={`reveal-phrase-${appWallet.address}`}
                  onClick={() => {
                    if (revealPhrase) {
                      setRevealPhrase(false);
                      setEncryptedPhrase();
                    } else {
                      setIsRevealingPhrase(true);
                    }
                  }}
                />
                <Tooltip
                  id={`reveal-phrase-${appWallet.address}`}
                  place="top"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  {revealPhrase ? "Hide" : "Reveal"}
                </Tooltip>
              </>
              <UnlockAppWalletModal
                address={appWallet.address}
                address_hashed={appWallet.address_hashed}
                show={isRevealingPhrase}
                onHide={() => setIsRevealingPhrase(false)}
                onVerifiedUnlock={migrateAppWallet}
                sensitiveAction={{
                  label: "secret reveal",
                  warning:
                    "The recovery phrase will be visible on this device for a short time.",
                  confirmationText: "REVEAL",
                }}
                onUnlock={(pass: string) => {
                  decryptData(appWallet.address, appWallet.mnemonic, pass).then(
                    (decryptedPhrase) => {
                      setPhrase(decryptedPhrase.split(" "));
                      setRevealPhrase(true);
                    }
                  );
                }}
              />
              {revealPhrase && (
                <>
                  <FontAwesomeIcon
                    className="tw-cursor-pointer tw-select-none"
                    icon={faCopy}
                    height={22}
                    data-tooltip-id={`copy-mnemonic-${appWallet.address}`}
                    onClick={() => {
                      copySecretToClipboard(
                        phrase.join(" "),
                        setMnemonicCopied
                      );
                    }}
                  />
                  <Tooltip
                    id={`copy-mnemonic-${appWallet.address}`}
                    place="top"
                    style={{
                      backgroundColor: "#1F2937",
                      color: "white",
                      padding: "4px 8px",
                    }}
                  >
                    {mnemonicCopied ? "Copied!" : "Copy to clipboard"}
                  </Tooltip>
                </>
              )}
            </span>
          )}
        </div>
      </div>
      <div className={`${appWalletRowClassName} tw-pt-2`}>
        {mnemonicAvailable ? (
          phrase.map((w, i) => (
            <AppWalletPhraseWord
              index={i + 1}
              word={w}
              hidden={!revealPhrase}
              key={`${appWallet.address}-mnemonic-${i}`}
            />
          ))
        ) : (
          <div className={`${appWalletColClassName} tw-text-iron-400`}>
            Mnemonic phrase not available for this wallet
          </div>
        )}
      </div>
      <div className={`${appWalletRowClassName} tw-pt-4`}>
        <div
          className={`${appWalletColClassName} tw-flex tw-items-center tw-justify-between`}
        >
          <span>Private Key</span>
          <span className="tw-flex tw-items-center tw-gap-3">
            <>
              <FontAwesomeIcon
                className="tw-cursor-pointer tw-select-none"
                icon={revealPrivateKey ? faEye : faEyeSlash}
                height={22}
                data-tooltip-id={`reveal-private-key-${appWallet.address}`}
                onClick={() => {
                  if (revealPrivateKey) {
                    setRevealPrivateKey(false);
                    setEncryptedPrivateKey();
                  } else {
                    setIsRevealingPrivateKey(true);
                  }
                }}
              />
              <Tooltip
                id={`reveal-private-key-${appWallet.address}`}
                place="top"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                {revealPrivateKey ? "Hide" : "Reveal"}
              </Tooltip>
            </>
            <UnlockAppWalletModal
              address={appWallet.address}
              address_hashed={appWallet.address_hashed}
              show={isRevealingPrivateKey}
              onHide={() => setIsRevealingPrivateKey(false)}
              onVerifiedUnlock={migrateAppWallet}
              sensitiveAction={{
                label: "secret reveal",
                warning:
                  "The private key will be visible on this device for a short time.",
                confirmationText: "REVEAL",
              }}
              onUnlock={(pass: string) => {
                decryptData(
                  appWallet.address,
                  appWallet.private_key,
                  pass
                ).then((decryptedPrivateKey) => {
                  setPrivateKey(decryptedPrivateKey);
                  setRevealPrivateKey(true);
                });
              }}
            />
            {revealPrivateKey && (
              <>
                <FontAwesomeIcon
                  className="tw-cursor-pointer tw-select-none"
                  icon={faCopy}
                  height={22}
                  data-tooltip-id={`copy-private-key-${appWallet.address}`}
                  onClick={() => {
                    copySecretToClipboard(privateKey, setPrivateKeyCopied);
                  }}
                />
                <Tooltip
                  id={`copy-private-key-${appWallet.address}`}
                  place="top"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  {privateKeyCopied ? "Copied!" : "Copy to clipboard"}
                </Tooltip>
              </>
            )}
          </span>
        </div>
      </div>
      <div className={`${appWalletRowClassName} tw-pt-2`}>
        <AppWalletPhraseWord
          word={privateKey}
          hidden={!revealPrivateKey}
          full_width={true}
        />
      </div>
      <div className={`${appWalletRowClassName} tw-pt-5`}>
        <div
          className={`${appWalletColClassName} tw-flex tw-items-center tw-gap-2`}
        >
          <button
            type="button"
            className={appWalletButtonClassName("danger")}
            onClick={() => doDelete(appWallet.name, appWallet.address)}
          >
            Delete
          </button>
          <button
            type="button"
            className={appWalletButtonClassName("outline-danger")}
            onClick={() => setIsExportingPlaintext(true)}
          >
            Export Plaintext Recovery
          </button>
        </div>
      </div>
    </div>
  );
}

function AppWalletPhraseWord(
  props: Readonly<{
    index?: number | undefined;
    word: string;
    hidden: boolean;
    full_width?: boolean | undefined;
  }>
) {
  return (
    <div
      className={`${
        props.full_width ? appWalletCol12ClassName : appWalletPhraseColClassName
      } tw-pb-2 tw-pt-2`}
    >
      <div className={styles["phrase"]}>
        <div className={appWalletRowClassName}>
          <div
            className={`${appWalletColClassName} tw-flex tw-select-none tw-gap-2`}
          >
            {props.index && (
              <span className="tw-font-extralight tw-text-iron-400">
                {props.index}
              </span>
            )}
            <span
              className={`tw-break-words ${
                props.hidden ? styles["blurry"] : ""
              }`}
            >
              {props.word}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
