"use client";

import styles from "./Address.module.scss";
import { containsEmojis, formatAddress } from "@/helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  type FocusEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const CODE_POINT_NOTATION = /U\+([\dA-Fa-f]{1,6})/g;
const COPY_OPTIONS_ARIA_LABEL = t(
  DEFAULT_LOCALE,
  "walletAddress.copy.optionsAriaLabel"
);
const COPY_ENS_ARIA_LABEL = t(
  DEFAULT_LOCALE,
  "walletAddress.copy.ensAriaLabel"
);
const COPY_WALLET_ARIA_LABEL = t(
  DEFAULT_LOCALE,
  "walletAddress.copy.walletAriaLabel"
);
const COPY_TOOLTIP_LABEL = t(DEFAULT_LOCALE, "walletAddress.copy.tooltip");
const COPIED_TOOLTIP_LABEL = t(
  DEFAULT_LOCALE,
  "walletAddress.copy.copiedTooltip"
);

function formatDisplayText(value: string) {
  if (!containsEmojis(value)) {
    return formatAddress(value);
  }

  return value.replaceAll(CODE_POINT_NOTATION, (_, hexValue: string) => {
    const codePoint = Number.parseInt(hexValue, 16);
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return `U+${hexValue}`;
    }
  });
}

function subscribeToClipboardAvailability() {
  return () => undefined;
}

function getClipboardWriteText(): ((text: string) => Promise<void>) | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const clipboard = Reflect.get(navigator, "clipboard") as unknown;
  if (typeof clipboard !== "object" || clipboard === null) {
    return null;
  }

  const writeText = Reflect.get(clipboard, "writeText") as unknown;
  if (typeof writeText !== "function") {
    return null;
  }

  return writeText.bind(clipboard) as (text: string) => Promise<void>;
}

function getClipboardAvailabilitySnapshot() {
  return getClipboardWriteText() !== null;
}

function getServerClipboardAvailabilitySnapshot() {
  return false;
}

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
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isMountedRef = useRef(false);
  const [isCopied, setIsCopied] = useState(false);
  const hasClipboard = useSyncExternalStore(
    subscribeToClipboardAvailability,
    getClipboardAvailabilitySnapshot,
    getServerClipboardAvailabilitySnapshot
  );
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

  let walletEns: string | null = null;
  if (props.display?.endsWith(".eth")) {
    walletEns = props.display;
  } else if (props.displayEns?.endsWith(".eth")) {
    walletEns = props.displayEns;
  }

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (copyResetTimeoutRef.current !== null) {
        globalThis.clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = null;
      }
    };
  }, []);

  function resolveDisplay() {
    if (props.display) {
      return formatDisplayText(props.display);
    }

    return formatAddress(props.wallet);
  }

  function resolveAddress() {
    if (props.displayEns) {
      return formatDisplayText(props.displayEns);
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
    const writeText = getClipboardWriteText();
    if (writeText === null) {
      return;
    }

    try {
      await writeText(text);
    } catch (error: unknown) {
      console.error("Failed to copy wallet address", error);
      return;
    }

    if (!isMountedRef.current) {
      return;
    }

    if (copyResetTimeoutRef.current !== null) {
      globalThis.clearTimeout(copyResetTimeoutRef.current);
    }
    setIsCopied(true);
    copyResetTimeoutRef.current = globalThis.setTimeout(() => {
      if (isMountedRef.current) {
        setIsCopied(false);
        copyResetTimeoutRef.current = null;
      }
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
    if (walletEns === null) {
      return;
    }
    void copy(walletEns);
  }

  const tooltipLabel = isCopied ? COPIED_TOOLTIP_LABEL : COPY_TOOLTIP_LABEL;

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
                aria-label={COPY_OPTIONS_ARIA_LABEL}
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
                <button
                  type="button"
                  data-tooltip-id={ensTooltipId}
                  className={copyMenuItemClassName}
                  aria-label={COPY_ENS_ARIA_LABEL}
                  onClick={copyEns}
                >
                  {resolveAddress()}
                </button>

                <button
                  type="button"
                  data-tooltip-id={walletTooltipId}
                  className={copyMenuItemClassName}
                  aria-label={COPY_WALLET_ARIA_LABEL}
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
              aria-label={COPY_WALLET_ARIA_LABEL}
              onClick={() => {
                void copy(props.wallet);
              }}
            >
              {isUserPage && (
                <span
                  className={`${addressClassName} ${addressUserPageClassName}`}
                >
                  {resolveAddress()}
                </span>
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
          <span className="tw-sr-only" role="status" aria-live="polite">
            {isCopied ? COPIED_TOOLTIP_LABEL : ""}
          </span>
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
