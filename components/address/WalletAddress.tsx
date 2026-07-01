"use client";

import styles from "./Address.module.scss";
import { containsEmojis, formatAddress, parseEmojis } from "@/helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type FocusEvent, useId, useRef, useState } from "react";
import Link from "next/link";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";

export function WalletAddress(props: {
  wallet: string;
  display: string | undefined;
  displayEns?: string | undefined;
  isUserPage?: boolean | undefined;
  disableLink?: boolean | undefined;
  hideCopy?: boolean | undefined;
  setLinkQueryAddress?: boolean | undefined;
}) {
  const reactId = useId();
  const tooltipIdBase = `wallet-address-${reactId.replace(/:/g, "")}`;
  const copyTooltipId = `${tooltipIdBase}-copy`;
  const ensTooltipId = `${tooltipIdBase}-ens`;
  const walletTooltipId = `${tooltipIdBase}-wallet`;
  const copyMenuRef = useRef<HTMLDetailsElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const addressClassName = styles["address"] ?? "";
  const addressUserPageClassName = styles["addressUserPage"] ?? "";
  const copyClassName = styles["copy"] ?? "";
  const copyButtonClassName = styles["copyButton"] ?? "";
  const copyMenuClassName = styles["copyMenu"] ?? "";
  const copyMenuToggleClassName = styles["copyMenuToggle"] ?? "";
  const copyMenuItemsClassName = styles["copyMenuItems"] ?? "";
  const copyMenuItemClassName = styles["copyMenuItem"] ?? "";
  const isUserPage = props.isUserPage === true;
  const disableLink = props.disableLink === true;
  const hideCopy = props.hideCopy === true;
  const setLinkQueryAddress = props.setLinkQueryAddress === true;
  const hasClipboard = Boolean(navigator.clipboard);

  let walletEns: string | null = null;
  if (props.display?.endsWith(".eth")) {
    walletEns = props.display;
  } else if (props.displayEns?.endsWith(".eth")) {
    walletEns = props.displayEns;
  }
  const ensCopyText = props.displayEns ?? props.display;

  function resolveDisplay() {
    if (props.display) {
      if (containsEmojis(props.display)) {
        return parseEmojis(props.display);
      }
      return formatAddress(props.display);
    }

    return formatAddress(props.wallet);
  }

  function resolveAddress() {
    if (props.displayEns) {
      if (containsEmojis(props.displayEns)) {
        return parseEmojis(props.displayEns);
      }
      return formatAddress(props.displayEns);
    }

    return resolveDisplay();
  }

  function getLink() {
    let path = "";
    if (props.display && !containsEmojis(props.display)) {
      path = props.display;
    } else {
      path = props.wallet;
    }
    if (setLinkQueryAddress) {
      return `/${encodeURIComponent(path)}?address=${encodeURIComponent(
        props.displayEns ?? props.wallet
      )}`;
    }

    return `/${encodeURIComponent(path)}`;
  }

  function closeCopyMenu() {
    if (copyMenuRef.current) {
      copyMenuRef.current.open = false;
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error: unknown) {
      console.error("Failed to copy wallet address", error);
    }
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
    closeCopyMenu();
  }

  function handleCopyMenuBlur(event: FocusEvent<HTMLDetailsElement>) {
    const nextFocusedElement = event.relatedTarget;
    if (
      !(nextFocusedElement instanceof Node) ||
      !event.currentTarget.contains(nextFocusedElement)
    ) {
      closeCopyMenu();
    }
  }

  function copyEns() {
    if (typeof ensCopyText !== "string") {
      return;
    }
    void copy(ensCopyText);
  }

  const tooltipLabel = isCopied ? "Copied" : "Copy";

  return (
    <span>
      {(hideCopy || !hasClipboard) &&
        (disableLink ? (
          <span className={addressClassName}>{resolveDisplay()}</span>
        ) : (
          <Link href={getLink()} className={addressClassName}>
            {resolveDisplay()}
          </Link>
        ))}
      {!hideCopy && hasClipboard && (
        <>
          {!isUserPage && (
            <span className={addressClassName}>
              {disableLink ? (
                <span className={addressClassName}>{resolveDisplay()}</span>
              ) : (
                <Link href={getLink()} className={addressClassName}>
                  {resolveDisplay()}
                </Link>
              )}
            </span>
          )}
          {walletEns ? (
            <details
              ref={copyMenuRef}
              className={copyMenuClassName}
              onBlur={handleCopyMenuBlur}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeCopyMenu();
                }
              }}
            >
              <summary
                className={copyMenuToggleClassName}
                data-tooltip-id={copyTooltipId}
                aria-label="Copy wallet options"
              >
                {isUserPage && props.display && (
                  <span
                    className={`${addressClassName} ${addressUserPageClassName}`}
                  >
                    {formatAddress(props.display)}
                  </span>
                )}
                <FontAwesomeIcon
                  icon={faCopy}
                  aria-hidden={true}
                  className={copyClassName}
                />
              </summary>
              <span className={copyMenuItemsClassName}>
                {typeof ensCopyText === "string" && ensCopyText.length > 0 && (
                  <button
                    type="button"
                    data-tooltip-id={ensTooltipId}
                    className={copyMenuItemClassName}
                    aria-label="Copy ENS name"
                    onClick={copyEns}
                    dangerouslySetInnerHTML={{
                      __html: resolveAddress(),
                    }}
                  ></button>
                )}

                <button
                  type="button"
                  data-tooltip-id={walletTooltipId}
                  className={copyMenuItemClassName}
                  aria-label="Copy wallet address"
                  onClick={() => {
                    void copy(props.wallet);
                  }}
                >
                  {formatAddress(props.wallet)}
                </button>
              </span>
            </details>
          ) : (
            <button
              type="button"
              className={copyButtonClassName}
              data-tooltip-id={copyTooltipId}
              aria-label="Copy wallet address"
              onClick={() => {
                void copy(props.wallet);
              }}
            >
              {isUserPage && (
                <span
                  className={`${addressClassName} ${addressUserPageClassName}`}
                  dangerouslySetInnerHTML={{
                    __html: resolveAddress(),
                  }}
                ></span>
              )}
              <FontAwesomeIcon
                icon={faCopy}
                aria-hidden={true}
                className={copyClassName}
              />
            </button>
          )}
          <Tooltip
            id={copyTooltipId}
            delayShow={150}
            place="right"
            opacity={1}
            variant="light"
            className="tw-leading-tight"
          >
            {tooltipLabel}
          </Tooltip>
          <Tooltip
            id={ensTooltipId}
            delayShow={150}
            place="right"
            opacity={1}
            variant="light"
            className="tw-leading-tight"
          >
            {tooltipLabel}
          </Tooltip>
          <Tooltip
            id={walletTooltipId}
            delayShow={150}
            place="right"
            opacity={1}
            variant="light"
            className="tw-leading-tight"
          >
            {tooltipLabel}
          </Tooltip>
        </>
      )}
    </span>
  );
}
