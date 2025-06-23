"use client";

import styles from "./Address.module.scss";
import {
  containsEmojis,
  formatAddress,
  parseEmojis,
} from "../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";
import { Dropdown } from "react-bootstrap";
import Link from "next/link";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";

export function WalletAddress(props: {
  wallet: string;
  display: string | undefined;
  displayEns?: string | undefined;
  isUserPage?: boolean;
  disableLink?: boolean;
  hideCopy?: boolean;
  setLinkQueryAddress?: boolean;
}) {
  const uniqueId = getRandomObjectId();
  const uniqueIdEns = getRandomObjectId();
  const uniqueIdWallet = getRandomObjectId();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

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

  function copy(text: any) {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  const [walletEns] = useState(
    props.display?.endsWith(".eth")
      ? props.display
      : props.displayEns?.endsWith(".eth")
      ? props.displayEns
      : null
  );

  return (
    <span>
      {(props.hideCopy || !navigator.clipboard) &&
        (props.disableLink ? (
          <span className={styles.address}>{resolveDisplay()}</span>
        ) : (
          <Link href={getLink()} className={styles.address}>
            {resolveDisplay()}
          </Link>
        ))}
      {!props.hideCopy && navigator.clipboard && (
        <>
          {!props.isUserPage && (
            <span
              className={`${styles.address} ${
                props.isUserPage ? styles.addressUserPage : ""
              }`}>
              {props.disableLink ? (
                <span className={styles.address}>{resolveDisplay()}</span>
              ) : (
                <Link href={getLink()} className={styles.address}>
                  {resolveDisplay()}
                </Link>
              )}
            </span>
          )}
          {walletEns ? (
            <Dropdown
              ref={dropdownRef}
              className={`${styles.copyDropdown}`}
              autoClose="outside"
              data-tooltip-id={uniqueId}
              onToggle={(nextShow: boolean) => {
                setIsDropdownOpen(nextShow);
              }}>
              <Dropdown.Toggle name={`copy-toggle`} aria-label={`copy-toggle`}>
                {props.isUserPage && props.display && (
                  <span
                    className={`${styles.address} ${
                      props.isUserPage ? styles.addressUserPage : ""
                    }`}>
                    {formatAddress(props.display)}
                  </span>
                )}
                <FontAwesomeIcon
                  icon={faCopy}
                  name={`copy-btn`}
                  aria-label={`copy-btn`}
                  className={`${styles.copy}`}
                />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {props.display && (
                  <Dropdown.Item
                    data-tooltip-id={uniqueIdEns}
                    aria-label={`copy-ens-btn`}
                    onClick={() => copy(props.displayEns ?? props.display)}
                    dangerouslySetInnerHTML={{
                      __html: resolveAddress(),
                    }}></Dropdown.Item>
                )}

                <Dropdown.Item
                  data-tooltip-id={uniqueIdWallet}
                  className={styles.copyDropdownItem}
                  aria-label={`copy-address-btn`}
                  onClick={() => copy(props.wallet)}>
                  {formatAddress(props.wallet as string)}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <Dropdown
              ref={dropdownRef}
              className={`${styles.copyDropdown}`}
              autoClose="outside"
              data-tooltip-id={uniqueId}
              onToggle={(nextShow: boolean) => {
                setIsDropdownOpen(nextShow);
              }}>
              <Dropdown.Toggle
                name={`copy-toggle`}
                aria-label={`copy-toggle`}
                onClick={() => copy(props.wallet)}>
                {props.isUserPage && (
                  <span
                    className={`${styles.address} ${
                      props.isUserPage ? styles.addressUserPage : ""
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: resolveAddress(),
                    }}></span>
                )}
                <FontAwesomeIcon
                  icon={faCopy}
                  name={`copy-btn`}
                  aria-label={`copy-btn`}
                  className={`${styles.copy}`}
                />
              </Dropdown.Toggle>
            </Dropdown>
          )}
          {!isDropdownOpen ? (
            <Tooltip
              id={uniqueId}
              delayShow={150}
              place="right"
              opacity={1}
              variant="light"
              className="tw-leading-tight">
              {isCopied ? "Copied" : "Copy"}
            </Tooltip>
          ) : (
            <>
              <Tooltip
                id={uniqueIdEns}
                delayShow={150}
                place="right"
                opacity={1}
                variant="light"
                className="tw-leading-tight">
                {isCopied ? "Copied" : "Copy"}
              </Tooltip>
              <Tooltip
                id={uniqueIdWallet}
                delayShow={150}
                place="right"
                opacity={1}
                variant="light"
                className="tw-leading-tight">
                {isCopied ? "Copied" : "Copy"}
              </Tooltip>
            </>
          )}
        </>
      )}
    </span>
  );
}
