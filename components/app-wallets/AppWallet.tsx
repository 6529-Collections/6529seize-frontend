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
import { Container, Row, Col, Button } from "react-bootstrap";
import type { ReactNode} from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBalance, useChainId } from "wagmi";
import { sepolia } from "viem/chains";

import type { AppWallet } from "./AppWalletsContext";
import { useAppWallets } from "./AppWalletsContext";

import {
  areEqualAddresses,
  fromGWEI,
  getAddressEtherscanLink,
} from "@/helpers/Helpers";
import { useAuth } from "../auth/Auth";
import DotLoader, { Spinner } from "../dotLoader/DotLoader";
import { UnlockAppWalletModal } from "./AppWalletModal";
import { decryptData } from "./app-wallet-helpers";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import AppWalletAvatar from "./AppWalletAvatar";
import AppWalletsUnsupported from "./AppWalletsUnsupported";
import { Share } from "@capacitor/share";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";

const MNEMONIC_NA = "N/A";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [mnemonicCopied, setMnemonicCopied] = useState(false);
  const [privateKeyCopied, setPrivateKeyCopied] = useState(false);
  const [mnemonicCopyArmed, setMnemonicCopyArmed] = useState(false);
  const [privateKeyCopyArmed, setPrivateKeyCopyArmed] = useState(false);

  function setEncryptedPhrase() {
    setPhrase(Array(12).fill("x".repeat(8)));
  }

  function setEncryptedPrivateKey() {
    setPrivateKey("0x" + "x".repeat(64));
  }

  useEffect(() => {
    setEncryptedPhrase();
    setEncryptedPrivateKey();
    setMnemonicAvailable(appWallet?.mnemonic !== MNEMONIC_NA);
  }, [appWallet]);

  const doDownload = async (
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
    }.txt`;
    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: "Wallet Recovery File",
        text: `${wallet.name} - ${wallet.address}`,
        url: result.uri,
        dialogTitle: "Share or Save File",
      });
    } catch {
      alert("Unable to write file");
    }
  };

  const doDelete = useCallback(
    async (name: string, address: string) => {
      if (areEqualAddresses(address, account.address)) {
        setToast({
          message:
            "You are currently connected with this wallet - Disconnect first!",
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
          message: `Error deleting wallet`,
          type: "error",
        });
      } else {
        router.push("/tools/app-wallets");
        setToast({
          message: `Wallet '${name}' deleted successfully`,
          type: "success",
        });
      }
    },
    [account.address, deleteAppWallet, router, setToast]
  );

  if (fetchingAppWallets) {
    return (
      <Container className="pt-4 pb-4">
        <Row>
          <Col className="d-flex gap-2">
            <span>Fetching wallet</span>
            <Spinner />
          </Col>
        </Row>
      </Container>
    );
  }

  if (!appWalletsSupported) {
    return (
      <Container className="pt-4 pb-4">
        <AppWalletsUnsupported />
      </Container>
    );
  }

  if (!appWallet) {
    return (
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            Wallet with address <b>{props.address}</b> not found.
          </Col>
        </Row>
      </Container>
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
            <span className="font-color-h"> (sepolia)</span>
          )}
        </>
      );
    } else {
      balanceContent = <span>Error</span>;
    }

    return <span>Balance: {balanceContent}</span>;
  }

  return (
    <Container className="pt-4 pb-4">
      <Row>
        <Col>
          <Link
            className="font-smaller d-flex align-items-center gap-2 decoration-none"
            href="/tools/app-wallets">
            <FontAwesomeIcon icon={faCircleArrowLeft} height={16} />
            Back to App Wallets
          </Link>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col className="d-flex align-items-center justify-content-between">
          <h3 className="mb-0 d-flex align-items-center gap-2">
            <AppWalletAvatar address={appWallet.address} size={50} />
            {appWallet.name}
            {appWallet.imported ? (
              <span className="font-color-h"> (imported)</span>
            ) : (
              <></>
            )}
          </h3>
          {printBalance()}
        </Col>
      </Row>
      <Row className="pt-4">
        <Col className="d-flex align-items-center gap-2 justify-content-between flex-wrap">
          <span>
            Wallet Address:{" "}
            <span className="font-larger font-bolder">
              {appWallet.address.toLowerCase()}
            </span>
          </span>
          <span className="d-flex align-items-center gap-2">
            <>
              <FontAwesomeIcon
                className="cursor-pointer unselectable"
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
                className="cursor-pointer unselectable"
                icon={faFileDownload}
                height={22}
                data-tooltip-id={`download-${appWallet.address}`}
                onClick={() => setIsDownloading(true)}
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
                Download Recovery File
              </Tooltip>
            </>
            <UnlockAppWalletModal
              address={appWallet.address}
              address_hashed={appWallet.address_hashed}
              show={isDownloading}
              onHide={() => setIsDownloading(false)}
              onUnlock={(pass: string) => {
                decryptData(
                  appWallet.address,
                  appWallet.private_key,
                  pass
                ).then(async (decryptedPrivateKey) => {
                  let decryptedMnemonic = appWallet.mnemonic;
                  if (decryptedMnemonic !== MNEMONIC_NA) {
                    decryptedMnemonic = await decryptData(
                      appWallet.address,
                      appWallet.mnemonic,
                      pass
                    );
                  }
                  doDownload(appWallet, decryptedMnemonic, decryptedPrivateKey);
                });
              }}
            />
            <>
              <FontAwesomeIcon
                className="cursor-pointer unselectable"
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
        </Col>
      </Row>
      <Row className="pt-5">
        <Col className="d-flex align-items-center justify-content-between">
          <span>Mnemonic Phrase</span>
          {mnemonicAvailable && (
            <span className="d-flex gap-3 align-items-center">
              <>
                <FontAwesomeIcon
                  className="cursor-pointer unselectable"
                  icon={revealPhrase ? faEye : faEyeSlash}
                  height={22}
                  data-tooltip-id={`reveal-phrase-${appWallet.address}`}
                  onClick={() => {
                    if (revealPhrase) {
                      setRevealPhrase(false);
                      setEncryptedPhrase();
                      setMnemonicCopyArmed(false);
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
                    className="cursor-pointer unselectable"
                  icon={faCopy}
                  height={22}
                  data-tooltip-id={`copy-mnemonic-${appWallet.address}`}
                  onClick={() => {
                    if (!mnemonicCopyArmed) {
                      setMnemonicCopyArmed(true);
                      setTimeout(() => {
                        setMnemonicCopyArmed(false);
                      }, 2500);
                      return;
                    }
                    setMnemonicCopyArmed(false);
                    navigator.clipboard.writeText(phrase.join(" "));
                    setMnemonicCopied(true);
                    setTimeout(() => {
                      setMnemonicCopied(false);
                    }, 1500);
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
                  {mnemonicCopied
                    ? "Copied!"
                    : mnemonicCopyArmed
                      ? "Click again to copy"
                      : "Copy to clipboard"}
                </Tooltip>
              </>
            )}
          </span>
        )}
        </Col>
      </Row>
      <Row className="pt-2">
        {mnemonicAvailable ? (
          phrase.map((w, i) => (
            <AppWalletPhraseWord
              index={i + 1}
              word={w}
              hidden={!revealPhrase}
              key={getRandomObjectId()}
            />
          ))
        ) : (
          <Col className="font-color-h">
            Mnemonic phrase not available for this wallet
          </Col>
        )}
      </Row>
      <Row className="pt-4">
        <Col className="d-flex align-items-center justify-content-between">
          <span>Private Key</span>
          <span className="d-flex gap-3 align-items-center">
            <>
              <FontAwesomeIcon
                className="cursor-pointer unselectable"
                icon={revealPrivateKey ? faEye : faEyeSlash}
                height={22}
                data-tooltip-id={`reveal-private-key-${appWallet.address}`}
                onClick={() => {
                  if (revealPrivateKey) {
                    setRevealPrivateKey(false);
                    setEncryptedPrivateKey();
                    setPrivateKeyCopyArmed(false);
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
                  className="cursor-pointer unselectable"
                  icon={faCopy}
                  height={22}
                  data-tooltip-id={`copy-private-key-${appWallet.address}`}
                  onClick={() => {
                    if (!privateKeyCopyArmed) {
                      setPrivateKeyCopyArmed(true);
                      setTimeout(() => {
                        setPrivateKeyCopyArmed(false);
                      }, 2500);
                      return;
                    }
                    setPrivateKeyCopyArmed(false);
                    navigator.clipboard.writeText(privateKey);
                    setPrivateKeyCopied(true);
                    setTimeout(() => {
                      setPrivateKeyCopied(false);
                    }, 1500);
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
                  {privateKeyCopied
                    ? "Copied!"
                    : privateKeyCopyArmed
                      ? "Click again to copy"
                      : "Copy to clipboard"}
                </Tooltip>
              </>
            )}
          </span>
        </Col>
      </Row>
      <Row className="pt-2">
        <AppWalletPhraseWord
          word={privateKey}
          hidden={!revealPrivateKey}
          full_width={true}
        />
      </Row>
      <Row className="pt-5">
        <Col className="d-flex align-items-center gap-2">
          <Button
            variant="danger"
            onClick={() => doDelete(appWallet.name, appWallet.address)}>
            Delete
          </Button>
        </Col>
      </Row>
    </Container>
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
    <Col
      xs={props.full_width ? 12 : 6}
      sm={props.full_width ? 12 : 4}
      md={props.full_width ? 12 : 3}
      className="pt-2 pb-2">
      <Container className={styles["phrase"]}>
        <Row>
          <Col className="d-flex gap-2 unselectable">
            {props.index && (
              <span className="font-color-h font-lighter">{props.index}</span>
            )}
            <span className={`text-break ${props.hidden ? styles["blurry"] : ""}`}>
              {props.word}
            </span>
          </Col>
        </Row>
      </Container>
    </Col>
  );
}
