"use client";

import styles from "./Address.module.scss";
import {
  containsEmojis,
  formatAddress,
  parseEmojis,
} from "@/helpers/Helpers";
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

  const walletEns = props.display?.endsWith(".eth")
    ? props.display
    : props.displayEns?.endsWith(".eth")
      ? props.displayEns
      : null;

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
    if (props.setLinkQueryAddress) {
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

  function copy(text: string) {
    void navigator.clipboard.writeText(text).catch((error: unknown) => {
      console.error("Failed to copy wallet address", error);
    });
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

  const tooltipLabel = isCopied ? "Copied" : "Copy";

  return (
    <span>
      {(props.hideCopy || !navigator.clipboard) &&
        (props.disableLink ? (
          <span className={styles["address"]}>{resolveDisplay()}</span>
        ) : (
          <Link href={getLink()} className={styles["address"]}>
            {resolveDisplay()}
          </Link>
        ))}
      {!props.hideCopy && navigator.clipboard && (
        <>
          {!props.isUserPage && (
            <span
              className={`${styles["address"]} ${
                props.isUserPage ? styles["addressUserPage"] : ""
              }`}>
              {props.disableLink ? (
                <span className={styles["address"]}>{resolveDisplay()}</span>
              ) : (
                <Link href={getLink()} className={styles["address"]}>
                  {resolveDisplay()}
                </Link>
              )}
            </span>
          )}
          {walletEns ? (
            <details
              ref={copyMenuRef}
              className={styles["copyMenu"]}
              onBlur={handleCopyMenuBlur}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeCopyMenu();
                }
              }}>
              <summary
                className={styles["copyMenuToggle"]}
                data-tooltip-id={copyTooltipId}
                aria-label="Copy wallet options">
                {props.isUserPage && props.display && (
                  <span
                    className={`${styles["address"]} ${
                      props.isUserPage ? styles["addressUserPage"] : ""
                    }`}>
                    {formatAddress(props.display)}
                  </span>
                )}
                <FontAwesomeIcon
                  icon={faCopy}
                  aria-hidden={true}
                  className={`${styles["copy"]}`}
                />
              </summary>
              <span className={styles["copyMenuItems"]}>
                {props.display && (
                  <button
                    type="button"
                    data-tooltip-id={ensTooltipId}
                    className={styles["copyMenuItem"]}
                    aria-label="Copy ENS name"
                    onClick={() => copy(props.displayEns ?? props.display)}
                    dangerouslySetInnerHTML={{
                      __html: resolveAddress(),
                    }}></button>
                )}

                <button
                  type="button"
                  data-tooltip-id={walletTooltipId}
                  className={styles["copyMenuItem"]}
                  aria-label="Copy wallet address"
                  onClick={() => copy(props.wallet)}>
                  {formatAddress(props.wallet as string)}
                </button>
              </span>
            </details>
          ) : (
            <button
              type="button"
              className={styles["copyButton"]}
              data-tooltip-id={copyTooltipId}
              aria-label="Copy wallet address"
              onClick={() => copy(props.wallet)}>
              {props.isUserPage && (
                <span
                  className={`${styles["address"]} ${
                    props.isUserPage ? styles["addressUserPage"] : ""
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: resolveAddress(),
                  }}></span>
              )}
              <FontAwesomeIcon
                icon={faCopy}
                aria-hidden={true}
                className={`${styles["copy"]}`}
              />
            </button>
          )}
          <Tooltip
            id={copyTooltipId}
            delayShow={150}
            place="right"
            opacity={1}
            variant="light"
            className="tw-leading-tight">
            {tooltipLabel}
          </Tooltip>
          <Tooltip
            id={ensTooltipId}
            delayShow={150}
            place="right"
            opacity={1}
            variant="light"
            className="tw-leading-tight">
            {tooltipLabel}
          </Tooltip>
          <Tooltip
            id={walletTooltipId}
            delayShow={150}
            place="right"
            opacity={1}
            variant="light"
            className="tw-leading-tight">
            {tooltipLabel}
          </Tooltip>
        </>
      )}
    </span>
  );
}
