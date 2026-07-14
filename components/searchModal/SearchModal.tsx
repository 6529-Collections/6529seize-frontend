"use client";

import {
  faSearch,
  faSquareXmark,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { useClickAway, useKeyPressEvent } from "react-use";
import { formatAddress } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import styles from "./SearchModal.module.css";

interface Props {
  show: boolean;
  setShow(show: boolean): void;
  searchWallets: string[];
  addSearchWallet(wallet: string): void;
  removeSearchWallet(wallet: string): void;
  clearSearchWallets(): void;
  variant?: "default" | "dark";
}

const searchModalPanelClass =
  "tw-relative tw-m-0 tw-flex tw-w-full tw-max-w-lg tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-iron-200 tw-bg-white tw-text-iron-950 tw-shadow-2xl";

const searchModalInputClass =
  "tw-form-input tw-block tw-min-w-0 tw-flex-1 tw-rounded-l-lg tw-rounded-r-none tw-border-0 tw-bg-white tw-px-3 tw-py-2 tw-text-base tw-text-iron-950 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-300 tw-transition placeholder:tw-text-iron-500 focus:tw-bg-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-iron-950";

const searchModalAddButtonClass =
  "tw-inline-flex tw-min-w-20 tw-items-center tw-justify-center tw-rounded-l-none tw-rounded-r-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-leading-none tw-text-white tw-transition hover:tw-bg-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-bg-black disabled:tw-cursor-not-allowed disabled:tw-bg-iron-300 disabled:tw-text-iron-500";

const searchModalSecondaryButtonClass =
  "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-300 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-600 tw-transition hover:tw-border-iron-950 hover:tw-bg-white hover:tw-text-iron-950 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-border-iron-200 disabled:tw-bg-iron-100 disabled:tw-text-iron-500 disabled:tw-opacity-100";

const searchModalPrimaryButtonClass =
  "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-border-black hover:tw-bg-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-border-black active:tw-bg-black";

function getEmptySearchButtonClass(isDark: boolean): string {
  if (isDark) {
    return "tw-border-white/10 tw-bg-white/[0.04] tw-text-iron-300 hover:tw-border-white/20 hover:tw-bg-white/[0.08] hover:tw-text-white";
  }

  return "tw-border-iron-800 tw-bg-iron-900 tw-text-iron-400 hover:tw-border-iron-700 hover:tw-bg-iron-800 hover:tw-text-iron-100";
}

function SearchModal(props: Readonly<Props>) {
  const [invalidWalletAdded, setInvalidWalletAdded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();
  const isDark = props.variant === "dark";
  const locale = useBrowserLocale();

  const closeModal = () => {
    props.setShow(false);
  };

  useClickAway(modalRef, () => {
    if (props.show) {
      closeModal();
    }
  });
  useKeyPressEvent("Escape", () => {
    if (props.show) {
      closeModal();
    }
  });

  useEffect(() => {
    if (!props.show || typeof document === "undefined") {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = globalThis.setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = originalOverflow;
      globalThis.clearTimeout(timer);
    };
  }, [props.show]);

  function addSearchWallet(): void {
    const normalizedSearchValue = searchValue.trim();
    if (!normalizedSearchValue) return;
    if (
      !props.searchWallets.some(
        (wallet) =>
          wallet.toLocaleLowerCase(locale) ===
          normalizedSearchValue.toLocaleLowerCase(locale)
      )
    ) {
      props.addSearchWallet(normalizedSearchValue);
      setSearchValue("");
    } else {
      setInvalidWalletAdded(true);
      setTimeout(() => {
        setInvalidWalletAdded(false);
      }, 200);
    }
  }

  if (!props.show || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1055] tw-cursor-default">
      <div className="tw-absolute tw-inset-0 tw-bg-black/50" />
      <div className="tw-relative tw-flex tw-min-h-full tw-items-center tw-justify-center tw-overflow-y-auto tw-p-4">
        <dialog
          ref={modalRef}
          open
          aria-modal="true"
          aria-labelledby={titleId}
          className={searchModalPanelClass}
        >
          <div className="tw-px-6 tw-pb-3 tw-pt-6">
            <h2
              id={titleId}
              className={`tw-m-0 tw-font-semibold tw-leading-tight tw-text-iron-950 ${
                isDark ? "tw-text-3xl" : "tw-text-2xl"
              }`}
            >
              {t(locale, "identityFilter.title")}
            </h2>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-500">
              {t(locale, "identityFilter.description")}
            </p>
          </div>
          <div className="tw-px-6 tw-pb-6 tw-pt-4">
            <form
              className={`tw-mb-3 tw-flex tw-w-full tw-items-stretch ${
                invalidWalletAdded ? (styles["shakeWalletInput"] ?? "") : ""
              }`}
              onSubmit={(event) => {
                event.preventDefault();
                addSearchWallet();
              }}
            >
              <label className="tw-sr-only" htmlFor={inputId}>
                {t(locale, "identityFilter.inputLabel")}
              </label>
              <input
                id={inputId}
                ref={inputRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
                data-autofocus
                className={`${searchModalInputClass} ${
                  invalidWalletAdded ? "tw-ring-error" : ""
                }`}
                placeholder={t(locale, "identityFilter.placeholder")}
                type="text"
              />
              <button
                className={`${searchModalAddButtonClass} ${
                  invalidWalletAdded ? "tw-bg-error hover:tw-bg-error" : ""
                }`}
                type="submit"
                aria-label={t(locale, "identityFilter.addAriaLabel")}
                disabled={!searchValue.trim()}
              >
                {t(locale, "identityFilter.add")}
              </button>
            </form>
            {invalidWalletAdded && (
              <p
                role="alert"
                className="-tw-mt-1 tw-mb-3 tw-text-sm tw-text-error"
              >
                {t(locale, "identityFilter.duplicate")}
              </p>
            )}
            {props.searchWallets.length > 0 && (
              <p className="tw-mb-2 tw-mt-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                {t(
                  locale,
                  props.searchWallets.length === 1
                    ? "identityFilter.selected.one"
                    : "identityFilter.selected.other",
                  {
                    count: formatInteger(locale, props.searchWallets.length),
                  }
                )}
              </p>
            )}
            <div className="tw-space-y-1">
              {props.searchWallets.map((w) => (
                <div
                  key={w}
                  className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-200 tw-bg-iron-50 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-950"
                >
                  <>
                    <button
                      aria-label={t(locale, "identityFilter.remove", {
                        identity: w,
                      })}
                      onClick={() => {
                        props.removeSearchWallet(w);
                      }}
                      className="tw-inline-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-900 tw-transition hover:tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                      data-tooltip-id={`remove-wallet-${w}`}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faSquareXmark} />
                    </button>
                    <Tooltip
                      id={`remove-wallet-${w}`}
                      place="top"
                      delayShow={250}
                      style={{
                        backgroundColor: "#1F2937",
                        color: "white",
                        padding: "4px 8px",
                      }}
                    >
                      Clear
                    </Tooltip>
                  </>
                  <span className="tw-min-w-0 tw-break-all">{w}</span>
                </div>
              ))}
            </div>
            {props.searchWallets.length === 0 && (
              <div className="tw-text-sm tw-text-iron-500">
                {t(locale, "identityFilter.empty")}
              </div>
            )}
            <div className="tw-mb-2 tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
              <button
                disabled={props.searchWallets.length === 0}
                className={searchModalSecondaryButtonClass}
                onClick={() => {
                  props.clearSearchWallets();
                }}
                type="button"
              >
                {t(locale, "identityFilter.clearAll")}
              </button>
              <button
                className={searchModalPrimaryButtonClass}
                onClick={closeModal}
                type="button"
              >
                {t(locale, "identityFilter.apply")}
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </div>,
    document.body
  );
}

export function SearchWalletsDisplay(
  props: Readonly<{
    searchWallets: string[];
    setSearchWallets(wallets: string[]): void;
    setShowSearchModal(show: boolean): void;
    variant?: "default" | "dark";
  }>
) {
  const { searchWallets, setSearchWallets, setShowSearchModal, variant } =
    props;
  const locale = useBrowserLocale();
  const isDark = variant === "dark";
  const hasSearchWallets = searchWallets.length > 0;
  const searchButtonClass = hasSearchWallets
    ? "hover:tw-text-primary-200 tw-border-primary-500/30 tw-bg-primary-500/10 tw-text-primary-300 hover:tw-border-primary-500/50 hover:tw-bg-primary-500/20"
    : getEmptySearchButtonClass(isDark);

  return (
    <span
      className={`tailwind-scope tw-inline-flex tw-flex-wrap tw-items-center tw-justify-end ${
        isDark ? "tw-gap-2" : "tw-gap-0"
      }`}
    >
      {hasSearchWallets &&
        searchWallets.map((sw) => (
          <span
            className={`tw-inline-flex tw-items-stretch tw-py-1 ${
              isDark ? "tw-mr-0" : "tw-mr-2"
            }`}
            key={sw}
          >
            <>
              <button
                className={`tw-inline-flex tw-w-[30px] tw-items-center tw-justify-center tw-rounded-l-[5px] tw-border-0 tw-border-r tw-border-solid tw-border-[#999] tw-bg-[#333] tw-px-[5px] tw-py-[3px] tw-text-inherit tw-no-underline tw-transition hover:tw-bg-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
                  isDark
                    ? "tw-border-white/15 tw-bg-white/[0.08] tw-text-iron-300 hover:tw-bg-white/[0.14] hover:tw-text-white"
                    : ""
                }`}
                aria-label={`Remove ${sw} from search`}
                onClick={() =>
                  setSearchWallets(searchWallets.filter((s) => s !== sw))
                }
                data-tooltip-id={`clear-wallet-display-${sw}`}
                type="button"
              >
                x
              </button>
              <Tooltip
                id={`clear-wallet-display-${sw}`}
                place="top"
                delayShow={250}
                style={{
                  backgroundColor: "#f8f9fa",
                  color: "#212529",
                  padding: "4px 8px",
                }}
              >
                Clear
              </Tooltip>
            </>
            <span
              className={`tw-mr-2 tw-inline-flex tw-items-center tw-rounded-r-[5px] tw-bg-[#333] tw-px-2.5 tw-py-[5px] ${
                isDark ? "tw-mr-0 tw-bg-white/[0.08] tw-text-iron-100" : ""
              }`}
            >
              {sw.endsWith(".eth") ? sw : formatAddress(sw)}
            </span>
          </span>
        ))}
      {hasSearchWallets && (
        <>
          <button
            aria-label="Clear all search wallets"
            onClick={() => setSearchWallets([])}
            className={`tw-mr-2.5 tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-transition hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
              isDark ? "tw-mr-0 tw-size-9 tw-rounded-full" : ""
            }`}
            data-tooltip-id="clear-all-display"
            type="button"
          >
            <FontAwesomeIcon icon={faTimesCircle} />
          </button>
          <Tooltip
            id="clear-all-display"
            place="top"
            delayShow={250}
            style={{
              backgroundColor: "#f8f9fa",
              color: "#212529",
              padding: "4px 8px",
            }}
          >
            Clear All
          </Tooltip>
        </>
      )}
      <button
        aria-label={t(locale, "identityFilter.open")}
        onClick={() => setShowSearchModal(true)}
        className={`tw-inline-flex ${
          isDark ? "tw-size-9" : "tw-size-10"
        } tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-p-0 tw-transition-colors focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
          searchButtonClass
        }`}
        type="button"
      >
        <FontAwesomeIcon
          className={isDark ? "tw-size-3.5" : "tw-size-4"}
          style={{
            color: "currentColor",
          }}
          icon={faSearch}
        ></FontAwesomeIcon>
      </button>
    </span>
  );
}

export function SearchModalDisplay(
  props: Readonly<{
    show: boolean;
    setShow(show: boolean): void;
    searchWallets: string[];
    setSearchWallets(wallets: string[]): void;
    variant?: "default" | "dark";
  }>
) {
  const { show, setShow, searchWallets, setSearchWallets, variant } = props;
  const variantProps = variant ? { variant } : {};

  return (
    <SearchModal
      show={show}
      searchWallets={searchWallets}
      setShow={setShow}
      addSearchWallet={function (newW: string) {
        setSearchWallets([...searchWallets, newW]);
      }}
      removeSearchWallet={function (removeW: string) {
        setSearchWallets([...searchWallets].filter((sw) => sw !== removeW));
      }}
      clearSearchWallets={function () {
        setSearchWallets([]);
      }}
      {...variantProps}
    />
  );
}
