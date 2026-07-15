"use client";

import { containsEmojis, formatAddress } from "@/helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
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

const ADDRESS_CLASS_NAME =
  "tw-text-base tw-font-semibold tw-text-[#dbe7ff] tw-no-underline tw-transition-colors hover:tw-text-[#bcd0ff]";
const USER_PAGE_ADDRESS_CLASS_NAME = "tw-text-3xl";
const COPY_ICON_CLASS_NAME =
  "tw-mx-1.5 tw-w-2.5 tw-text-[10px] tw-text-[#dbe7ff] tw-transition-colors hover:tw-text-[#bcd0ff] lg:tw-w-3 lg:tw-text-xs xl:tw-w-[15px] xl:tw-text-[15px]";
const COPY_CONTROL_CLASS_NAME =
  "tw-m-0 tw-inline-flex tw-min-h-6 tw-min-w-6 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-leading-none tw-text-inherit focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const COPY_MENU_ITEM_CLASS_NAME =
  "tw-flex tw-min-h-10 tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-black hover:tw-bg-[#b8ccf4] hover:tw-text-black focus:tw-bg-[#b8ccf4] focus:tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const FOCUSABLE_ELEMENT_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type CopyTarget = "trigger" | "ens" | "wallet";

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

function getWalletEns(
  display: string | undefined,
  displayEns: string | undefined
) {
  if (display?.endsWith(".eth")) {
    return display;
  }

  return displayEns?.endsWith(".eth") ? displayEns : null;
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
  const copyMenuId = `${tooltipIdBase}-menu`;
  const copyMenuRef = useRef<HTMLSpanElement>(null);
  const copyMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const copyMenuItemsRef = useRef<HTMLDivElement>(null);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const copyMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isMountedRef = useRef(false);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);
  const [isCopyTooltipSuppressed, setIsCopyTooltipSuppressed] = useState(false);
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
  const [copyMenuPosition, setCopyMenuPosition] = useState({ left: 0, top: 0 });
  const hasClipboard = useSyncExternalStore(
    subscribeToClipboardAvailability,
    getClipboardAvailabilitySnapshot,
    getServerClipboardAvailabilitySnapshot
  );
  const isUserPage = props.isUserPage === true;
  const disableLink = props.disableLink === true;
  const hideCopy = props.hideCopy === true;
  const setLinkQueryAddress = props.setLinkQueryAddress === true;

  const walletEns = getWalletEns(props.display, props.displayEns);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (copyResetTimeoutRef.current !== null) {
        globalThis.clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = null;
      }
      if (copyMenuCloseTimeoutRef.current !== null) {
        globalThis.clearTimeout(copyMenuCloseTimeoutRef.current);
        copyMenuCloseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isCopyMenuOpen) {
      return;
    }

    function updateCopyMenuPosition() {
      const trigger = copyMenuTriggerRef.current;
      if (!trigger) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = copyMenuItemsRef.current?.getBoundingClientRect();
      const menuWidth = menuRect?.width ?? 180;
      const menuHeight = menuRect?.height ?? 64;
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const top =
        spaceBelow >= menuHeight + viewportPadding
          ? triggerRect.bottom + 2
          : Math.max(viewportPadding, triggerRect.top - menuHeight - 2);
      const left = Math.min(
        Math.max(viewportPadding, triggerRect.left),
        window.innerWidth - menuWidth - viewportPadding
      );

      setCopyMenuPosition({ left, top });
    }

    function handleInteractionOutside(event: Event) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        !copyMenuRef.current?.contains(target) &&
        !copyMenuItemsRef.current?.contains(target)
      ) {
        closeCopyMenu();
      }
    }

    updateCopyMenuPosition();
    copyMenuItemsRef.current
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus();
    window.addEventListener("resize", updateCopyMenuPosition);
    window.addEventListener("scroll", updateCopyMenuPosition, true);
    document.addEventListener("pointerdown", handleInteractionOutside);
    document.addEventListener("focusin", handleInteractionOutside);

    return () => {
      window.removeEventListener("resize", updateCopyMenuPosition);
      window.removeEventListener("scroll", updateCopyMenuPosition, true);
      document.removeEventListener("pointerdown", handleInteractionOutside);
      document.removeEventListener("focusin", handleInteractionOutside);
    };
  }, [isCopyMenuOpen]);

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

  function closeCopyMenu(restoreTriggerFocus = false) {
    setIsCopyMenuOpen(false);
    if (restoreTriggerFocus) {
      copyMenuTriggerRef.current?.focus();
    }
  }

  function focusAfterCopyMenuTrigger() {
    const trigger = copyMenuTriggerRef.current;
    if (!trigger) {
      return;
    }

    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR)
    ).filter((element) => !copyMenuItemsRef.current?.contains(element));
    const triggerIndex = focusableElements.indexOf(trigger);
    focusableElements[triggerIndex + 1]?.focus();
  }

  async function copy(text: string, target: CopyTarget) {
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
    setCopiedTarget(target);
    setIsCopyTooltipSuppressed(false);
    copyResetTimeoutRef.current = globalThis.setTimeout(() => {
      if (isMountedRef.current) {
        setIsCopied(false);
        setCopiedTarget(null);
        setIsCopyTooltipSuppressed(true);
        copyResetTimeoutRef.current = null;
      }
    }, 1200);

    if (isCopyMenuOpen) {
      copyMenuCloseTimeoutRef.current = globalThis.setTimeout(() => {
        closeCopyMenu(true);
        copyMenuCloseTimeoutRef.current = null;
      }, 300);
    } else {
      closeCopyMenu();
    }
  }

  function copyEns() {
    if (walletEns === null) {
      return;
    }
    void copy(walletEns, "ens");
  }

  function handleCopyMenuKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    position: "first" | "last"
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeCopyMenu(true);
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    if (position === "first" && event.shiftKey) {
      event.preventDefault();
      closeCopyMenu(true);
    } else if (position === "last" && !event.shiftKey) {
      event.preventDefault();
      closeCopyMenu();
      focusAfterCopyMenuTrigger();
    }
  }

  const tooltipLabel = isCopied ? COPIED_TOOLTIP_LABEL : COPY_TOOLTIP_LABEL;

  return (
    <span className="tw-inline-flex tw-items-center tw-align-middle">
      {(hideCopy || !hasClipboard) &&
        (disableLink ? (
          <span className={ADDRESS_CLASS_NAME}>{resolveDisplay()}</span>
        ) : (
          <Link href={getLink()} className={ADDRESS_CLASS_NAME}>
            {resolveDisplay()}
          </Link>
        ))}
      {!hideCopy && hasClipboard && (
        <>
          {!isUserPage && (
            <span className={ADDRESS_CLASS_NAME}>
              {disableLink ? (
                <span className={ADDRESS_CLASS_NAME}>{resolveDisplay()}</span>
              ) : (
                <Link href={getLink()} className={ADDRESS_CLASS_NAME}>
                  {resolveDisplay()}
                </Link>
              )}
            </span>
          )}
          {walletEns ? (
            <span ref={copyMenuRef} className="tw-relative tw-inline-block">
              <button
                ref={copyMenuTriggerRef}
                type="button"
                className={COPY_CONTROL_CLASS_NAME}
                data-tooltip-id={copyTooltipId}
                aria-label={COPY_OPTIONS_ARIA_LABEL}
                aria-controls={copyMenuId}
                aria-expanded={isCopyMenuOpen}
                onMouseEnter={() => setIsCopyTooltipSuppressed(false)}
                onFocus={() => setIsCopyTooltipSuppressed(false)}
                onClick={() => setIsCopyMenuOpen((current) => !current)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeCopyMenu(true);
                  }
                }}
              >
                {isUserPage && props.display && (
                  <span
                    className={`${ADDRESS_CLASS_NAME} ${USER_PAGE_ADDRESS_CLASS_NAME}`}
                  >
                    {formatAddress(props.display)}
                  </span>
                )}
                <FontAwesomeIcon
                  icon={faCopy}
                  aria-hidden={true}
                  className={COPY_ICON_CLASS_NAME}
                />
              </button>
              {isCopyMenuOpen &&
                createPortal(
                  <div
                    ref={copyMenuItemsRef}
                    id={copyMenuId}
                    className="tw-fixed tw-z-[1000] tw-flex tw-w-max tw-min-w-36 tw-flex-col tw-rounded-md tw-border tw-border-black/15 tw-bg-[#dbe7ff] tw-py-1 tw-shadow-lg"
                    style={copyMenuPosition}
                  >
                    <button
                      type="button"
                      data-tooltip-id={ensTooltipId}
                      className={COPY_MENU_ITEM_CLASS_NAME}
                      aria-label={COPY_ENS_ARIA_LABEL}
                      onClick={copyEns}
                      onKeyDown={(event) =>
                        handleCopyMenuKeyDown(event, "first")
                      }
                    >
                      <span>{resolveAddress()}</span>
                      <FontAwesomeIcon
                        icon={faCopy}
                        aria-hidden={true}
                        className="tw-w-3.5 tw-flex-none tw-text-sm tw-text-iron-700"
                      />
                    </button>

                    <button
                      type="button"
                      data-tooltip-id={walletTooltipId}
                      className={COPY_MENU_ITEM_CLASS_NAME}
                      aria-label={COPY_WALLET_ARIA_LABEL}
                      onClick={() => {
                        void copy(props.wallet, "wallet");
                      }}
                      onKeyDown={(event) =>
                        handleCopyMenuKeyDown(event, "last")
                      }
                    >
                      <span>{formatAddress(props.wallet)}</span>
                      <FontAwesomeIcon
                        icon={faCopy}
                        aria-hidden={true}
                        className="tw-w-3.5 tw-flex-none tw-text-sm tw-text-iron-700"
                      />
                    </button>
                  </div>,
                  document.body
                )}
            </span>
          ) : (
            <button
              type="button"
              className={COPY_CONTROL_CLASS_NAME}
              data-tooltip-id={copyTooltipId}
              aria-label={COPY_WALLET_ARIA_LABEL}
              onMouseEnter={() => setIsCopyTooltipSuppressed(false)}
              onFocus={() => setIsCopyTooltipSuppressed(false)}
              onClick={() => {
                void copy(props.wallet, "trigger");
              }}
            >
              {isUserPage && (
                <span
                  className={`${ADDRESS_CLASS_NAME} ${USER_PAGE_ADDRESS_CLASS_NAME}`}
                >
                  {resolveAddress()}
                </span>
              )}
              <FontAwesomeIcon
                icon={faCopy}
                aria-hidden={true}
                className={COPY_ICON_CLASS_NAME}
              />
            </button>
          )}
          <Tooltip
            id={copyTooltipId}
            delayShow={150}
            place="right"
            opacity={1}
            variant="light"
            hidden={
              isCopyMenuOpen ||
              isCopyTooltipSuppressed ||
              (isCopied && copiedTarget !== "trigger")
            }
            className="tw-leading-tight"
          >
            {tooltipLabel}
          </Tooltip>
          <span className="tw-sr-only" role="status" aria-live="polite">
            {isCopied ? COPIED_TOOLTIP_LABEL : ""}
          </span>
          {isCopyMenuOpen && (
            <>
              <Tooltip
                id={ensTooltipId}
                delayShow={150}
                place="right"
                opacity={1}
                variant="light"
                {...(isCopied && copiedTarget === "ens"
                  ? { isOpen: true }
                  : {})}
                className="tw-leading-tight"
              >
                {isCopied && copiedTarget === "ens"
                  ? COPIED_TOOLTIP_LABEL
                  : COPY_TOOLTIP_LABEL}
              </Tooltip>
              <Tooltip
                id={walletTooltipId}
                delayShow={150}
                place="right"
                opacity={1}
                variant="light"
                {...(isCopied && copiedTarget === "wallet"
                  ? { isOpen: true }
                  : {})}
                className="tw-leading-tight"
              >
                {isCopied && copiedTarget === "wallet"
                  ? COPIED_TOOLTIP_LABEL
                  : COPY_TOOLTIP_LABEL}
              </Tooltip>
            </>
          )}
        </>
      )}
    </span>
  );
}
