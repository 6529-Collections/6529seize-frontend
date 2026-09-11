"use client";

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
import Button from "@/components/utils/button/Button";
import { useAuth } from "../auth/Auth";
import DotLoader, { Spinner } from "../dotLoader/DotLoader";
import { UnlockAppWalletModal } from "./AppWalletModal";
import { decryptData } from "./app-wallet-helpers";
import AppWalletAvatar from "./AppWalletAvatar";
import AppWalletsUnsupported from "./AppWalletsUnsupported";
import { Share } from "@capacitor/share";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import {
  DELEGATION_CARD_CLASS_NAME,
  DELEGATION_PAGE_CONTAINER_CLASS_NAME,
  DELEGATION_PAGE_TITLE_CLASS_NAME,
  DELEGATION_SECTION_TITLE_CLASS_NAME,
} from "@/components/delegation/delegation-ui";

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
      <div className={DELEGATION_PAGE_CONTAINER_CLASS_NAME}>
        <div
          className={`${DELEGATION_CARD_CLASS_NAME} tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-gap-2 tw-p-5 tw-text-sm tw-text-iron-400`}
        >
          <span>Fetching wallet</span>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!appWalletsSupported) {
    return (
      <div className={DELEGATION_PAGE_CONTAINER_CLASS_NAME}>
        <AppWalletsUnsupported />
      </div>
    );
  }

  if (!appWallet) {
    return (
      <div className={DELEGATION_PAGE_CONTAINER_CLASS_NAME}>
        <div className={`${DELEGATION_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}>
          Wallet with address <b>{props.address}</b> not found.
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

    return (
      <span className="tw-text-sm tw-leading-6 tw-text-iron-400">
        Balance: {balanceContent}
      </span>
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

      <header className="tw-mt-5 tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
          <AppWalletAvatar address={appWallet.address} size={50} />
          <div className="tw-min-w-0">
            <h1 className={DELEGATION_PAGE_TITLE_CLASS_NAME}>
              {appWallet.name}
            </h1>
            {appWallet.imported && (
              <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-500">
                (imported)
              </p>
            )}
          </div>
        </div>
        {printBalance()}
      </header>

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
          void (async () => {
            const decryptedPrivateKey = await decryptData(
              appWallet.address,
              appWallet.private_key,
              pass
            );
            let decryptedMnemonic: string;
            if (
              (appWallet.has_mnemonic ?? true) &&
              appWallet.mnemonic !== APP_WALLET_MNEMONIC_UNAVAILABLE
            ) {
              decryptedMnemonic = await decryptData(
                appWallet.address,
                appWallet.mnemonic,
                pass
              );
            } else {
              decryptedMnemonic = APP_WALLET_MNEMONIC_UNAVAILABLE;
            }
            await doPlaintextDownload(
              appWallet,
              decryptedMnemonic,
              decryptedPrivateKey
            );
          })().catch(() => {
            setToast({
              message: "Unable to export wallet recovery.",
              type: "error",
            });
          });
        }}
      />

      <section
        className={`${DELEGATION_CARD_CLASS_NAME} tw-mt-8 tw-flex tw-flex-col tw-gap-4 tw-p-5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-p-6`}
      >
        <div className="tw-min-w-0">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-widest tw-text-iron-500">
            Wallet Address:
          </p>
          <p className="tw-m-0 tw-mt-1 tw-break-all tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {appWallet.address.toLowerCase()}
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <TooltipIconButton
            icon={faExternalLink}
            tooltipText="View on Etherscan"
            buttonSizeClassName="tw-size-9"
            buttonShapeClassName="tw-rounded-lg"
            className="tw-bg-white/[0.04] tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.07] hover:tw-text-iron-100"
            iconClassName="tw-size-4 tw-text-current"
            onClick={() =>
              window.open(
                getAddressEtherscanLink(chainId, appWallet.address),
                "_blank",
                "noopener,noreferrer"
              )
            }
          />
          <TooltipIconButton
            icon={faFileDownload}
            tooltipText="Download encrypted recovery file"
            buttonSizeClassName="tw-size-9"
            buttonShapeClassName="tw-rounded-lg"
            className="tw-bg-white/[0.04] tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.07] hover:tw-text-iron-100"
            iconClassName="tw-size-4 tw-text-current"
            onClick={() => doEncryptedDownload(appWallet)}
          />
          <TooltipIconButton
            icon={faCopy}
            tooltipText={
              addressCopied ? "Copied!" : "Copy address to clipboard"
            }
            buttonSizeClassName="tw-size-9"
            buttonShapeClassName="tw-rounded-lg"
            className="tw-bg-white/[0.04] tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.07] hover:tw-text-iron-100"
            iconClassName="tw-size-4 tw-text-current"
            onClick={() => {
              void navigator.clipboard
                .writeText(appWallet.address)
                .then(() => {
                  setAddressCopied(true);
                  setTimeout(() => setAddressCopied(false), 1500);
                })
                .catch(() => {
                  setToast({
                    message: "Unable to copy wallet address.",
                    type: "error",
                  });
                });
            }}
          />
        </div>
      </section>

      <section
        className={`${DELEGATION_CARD_CLASS_NAME} tw-mt-4 tw-p-5 sm:tw-p-6`}
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <h2 className={DELEGATION_SECTION_TITLE_CLASS_NAME}>
            Mnemonic Phrase
          </h2>
          {mnemonicAvailable && (
            <div className="tw-flex tw-items-center tw-gap-2">
              <TooltipIconButton
                icon={revealPhrase ? faEye : faEyeSlash}
                tooltipText={revealPhrase ? "Hide" : "Reveal"}
                buttonSizeClassName="tw-size-9"
                buttonShapeClassName="tw-rounded-lg"
                className="tw-bg-white/[0.04] tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.07] hover:tw-text-iron-100"
                iconClassName="tw-size-4 tw-text-current"
                onClick={() => {
                  if (revealPhrase) {
                    setRevealPhrase(false);
                    setEncryptedPhrase();
                  } else {
                    setIsRevealingPhrase(true);
                  }
                }}
              />
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
                  void decryptData(
                    appWallet.address,
                    appWallet.mnemonic,
                    pass
                  )
                    .then((decryptedPhrase) => {
                      setPhrase(decryptedPhrase.split(" "));
                      setRevealPhrase(true);
                    })
                    .catch(() => {
                      setToast({
                        message: "Unable to reveal recovery phrase.",
                        type: "error",
                      });
                    });
                }}
              />
              {revealPhrase && (
                <TooltipIconButton
                  icon={faCopy}
                  tooltipText={mnemonicCopied ? "Copied!" : "Copy to clipboard"}
                  buttonSizeClassName="tw-size-9"
                  buttonShapeClassName="tw-rounded-lg"
                  className="tw-bg-white/[0.04] tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.07] hover:tw-text-iron-100"
                  iconClassName="tw-size-4 tw-text-current"
                  onClick={() => {
                    void copySecretToClipboard(
                      phrase.join(" "),
                      setMnemonicCopied
                    ).catch(() => {
                      setToast({
                        message: "Unable to copy recovery phrase.",
                        type: "error",
                      });
                    });
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-3 md:tw-grid-cols-4">
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
            <p className="tw-col-span-full tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
              Mnemonic phrase not available for this wallet
            </p>
          )}
        </div>
      </section>

      <section
        className={`${DELEGATION_CARD_CLASS_NAME} tw-mt-4 tw-p-5 sm:tw-p-6`}
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <h2 className={DELEGATION_SECTION_TITLE_CLASS_NAME}>Private Key</h2>
          <div className="tw-flex tw-items-center tw-gap-2">
            <TooltipIconButton
              icon={revealPrivateKey ? faEye : faEyeSlash}
              tooltipText={revealPrivateKey ? "Hide" : "Reveal"}
              buttonSizeClassName="tw-size-9"
              buttonShapeClassName="tw-rounded-lg"
              className="tw-bg-white/[0.04] tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.07] hover:tw-text-iron-100"
              iconClassName="tw-size-4 tw-text-current"
              onClick={() => {
                if (revealPrivateKey) {
                  setRevealPrivateKey(false);
                  setEncryptedPrivateKey();
                } else {
                  setIsRevealingPrivateKey(true);
                }
              }}
            />
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
                void decryptData(
                  appWallet.address,
                  appWallet.private_key,
                  pass
                )
                  .then((decryptedPrivateKey) => {
                    setPrivateKey(decryptedPrivateKey);
                    setRevealPrivateKey(true);
                  })
                  .catch(() => {
                    setToast({
                      message: "Unable to reveal private key.",
                      type: "error",
                    });
                  });
              }}
            />
            {revealPrivateKey && (
              <TooltipIconButton
                icon={faCopy}
                tooltipText={privateKeyCopied ? "Copied!" : "Copy to clipboard"}
                buttonSizeClassName="tw-size-9"
                buttonShapeClassName="tw-rounded-lg"
                className="tw-bg-white/[0.04] tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.07] hover:tw-text-iron-100"
                iconClassName="tw-size-4 tw-text-current"
                onClick={() => {
                  void copySecretToClipboard(
                    privateKey,
                    setPrivateKeyCopied
                  ).catch(() => {
                    setToast({
                      message: "Unable to copy private key.",
                      type: "error",
                    });
                  });
                }}
              />
            )}
          </div>
        </div>
        <div className="tw-mt-4 tw-grid tw-grid-cols-1">
          <AppWalletPhraseWord
            word={privateKey}
            hidden={!revealPrivateKey}
            full_width
          />
        </div>
      </section>

      <section
        className={`${DELEGATION_CARD_CLASS_NAME} tw-mt-4 tw-p-5 sm:tw-p-6`}
      >
        <h2 className={DELEGATION_SECTION_TITLE_CLASS_NAME}>Wallet Actions</h2>
        <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <Button
            type="button"
            onClick={() => doDelete(appWallet.name, appWallet.address)}
            variant="destructive"
            size="md"
          >
            Delete
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setIsExportingPlaintext(true)}
          >
            Export Plaintext Recovery
          </Button>
        </div>
      </section>
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
      className={`tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-black/25 tw-p-3 ${
        props.full_width ? "tw-col-span-full" : ""
      }`}
    >
      <div className="tw-flex tw-select-none tw-gap-2 tw-text-sm tw-leading-6">
        {props.index !== undefined && (
          <span className="tw-shrink-0 tw-text-iron-500">{props.index}</span>
        )}
        <span
          className={`tw-min-w-0 tw-break-all tw-text-iron-200 ${
            props.hidden ? "tw-text-iron-500 tw-blur-sm" : ""
          }`}
        >
          {props.word}
        </span>
      </div>
    </div>
  );
}
