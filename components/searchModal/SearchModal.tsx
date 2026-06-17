"use client";

import {
  faSearch,
  faSquareXmark,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import { formatAddress } from "@/helpers/Helpers";
import styles from "./SearchModal.module.scss";

interface Props {
  show: boolean;
  setShow(show: boolean): void;
  searchWallets: string[];
  addSearchWallet(wallet: string): void;
  removeSearchWallet(wallet: string): void;
  clearSearchWallets(): void;
  variant?: "default" | "dark";
}

function getEmptySearchButtonClass(isDark: boolean): string {
  if (isDark) {
    return "tw-border-white/10 tw-bg-white/[0.04] tw-text-iron-300 hover:tw-border-white/20 hover:tw-bg-white/[0.08] hover:tw-text-white";
  }

  return "tw-border-iron-800 tw-bg-iron-900 tw-text-iron-400 hover:tw-border-iron-700 hover:tw-bg-iron-800 hover:tw-text-iron-100";
}

function SearchModal(props: Readonly<Props>) {
  const [invalidWalletAdded, setInvalidWalletAdded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const isDark = props.variant === "dark";
  const darkModalProps = isDark
    ? {
        backdropClassName: "tw-bg-black !tw-opacity-50",
        contentClassName:
          "!tw-rounded-xl tw-border tw-border-solid !tw-border-iron-200 !tw-bg-white !tw-text-iron-950 tw-shadow-2xl",
      }
    : {};

  function addSearchWallet(): void {
    if (!props.searchWallets.some((sw) => sw === searchValue)) {
      props.addSearchWallet(searchValue);
      setSearchValue("");
    } else {
      setInvalidWalletAdded(true);
      setTimeout(() => {
        setInvalidWalletAdded(false);
      }, 200);
    }
  }

  return (
    <Modal
      show={props.show}
      centered={true}
      {...darkModalProps}
      onHide={() => {
        props.setShow(false);
      }}
    >
      <Modal.Header
        className={
          isDark
            ? "!tw-border-b-0 !tw-bg-white tw-px-6 tw-pb-3 tw-pt-6"
            : undefined
        }
      >
        <Modal.Title
          className={
            isDark
              ? "tw-text-3xl tw-font-semibold tw-leading-tight !tw-text-iron-950"
              : undefined
          }
        >
          Search
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        className={
          isDark
            ? "!tw-bg-white tw-px-6 tw-pb-6 tw-pt-4 !tw-text-iron-950"
            : undefined
        }
      >
        <InputGroup
          className={`${
            invalidWalletAdded ? styles["shakeWalletInput"] : ""
          } mb-3`}
        >
          <Form.Control
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(target) => {
              if (target.key === "Enter") {
                addSearchWallet();
              }
            }}
            autoFocus
            className={`${styles["modalInput"]} ${
              isDark
                ? "!tw-rounded-l-lg !tw-border-iron-300 !tw-bg-white !tw-text-iron-950 placeholder:tw-text-iron-500 focus:!tw-border-iron-950 focus:tw-shadow-none"
                : ""
            }`}
            placeholder="Search for address, ENS or username"
          />
          <Button
            className={`${styles["modalButton"]} ${
              isDark
                ? "!tw-rounded-r-lg !tw-bg-iron-900 !tw-text-white hover:!tw-bg-black active:!tw-bg-black"
                : ""
            }`}
            onClick={addSearchWallet}
            aria-label="Add search wallet"
          >
            +
          </Button>
        </InputGroup>
        {props.searchWallets.map((w) => (
          <div key={w} className="pt-1 pb-1">
            <>
              <button
                aria-label={`Remove ${w} from search`}
                onClick={() => {
                  props.removeSearchWallet(w);
                }}
                className={`${styles["removeWalletBtn"]} ${
                  isDark ? "!tw-text-iron-900 hover:!tw-text-black" : ""
                }`}
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
            {"  "}
            {w}
          </div>
        ))}
        {props.searchWallets.length === 0 && (
          <div
            className={`${styles["noSearchWalletsText"]} ${
              isDark ? "!tw-text-iron-500" : ""
            }`}
          >
            No search queries added
          </div>
        )}
        <Button
          disabled={props.searchWallets.length === 0}
          className={`${styles["modalButtonClear"]} ${
            isDark
              ? "!tw-rounded-lg !tw-border-iron-300 !tw-text-iron-600 hover:!tw-border-iron-950 hover:!tw-bg-white hover:!tw-text-iron-950 disabled:!tw-border-iron-200 disabled:!tw-bg-iron-100 disabled:!tw-text-iron-500 disabled:!tw-opacity-100"
              : ""
          } mt-3 mb-2`}
          onClick={() => {
            props.clearSearchWallets();
          }}
        >
          Clear All
        </Button>
        <Button
          className={`${styles["modalButtonDone"]} ${
            isDark
              ? "!tw-rounded-lg !tw-border-iron-900 !tw-bg-iron-900 !tw-font-semibold !tw-text-white hover:!tw-border-black hover:!tw-bg-black active:!tw-border-black active:!tw-bg-black"
              : ""
          } mt-3 mb-2`}
          onClick={() => {
            props.setShow(false);
          }}
        >
          Done
        </Button>
      </Modal.Body>
    </Modal>
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
  const isDark = variant === "dark";
  const hasSearchWallets = searchWallets.length > 0;
  const searchButtonClass = hasSearchWallets
    ? "hover:tw-text-primary-200 tw-border-primary-500/30 tw-bg-primary-500/10 tw-text-primary-300 hover:tw-border-primary-500/50 hover:tw-bg-primary-500/20"
    : getEmptySearchButtonClass(isDark);

  return (
    <span
      className={`d-flex flex-wrap align-items-center justify-content-end ${
        isDark ? "tw-gap-2" : ""
      }`}
    >
      {hasSearchWallets &&
        searchWallets.map((sw) => (
          <span
            className={`${styles["searchWalletDisplayWrapper"]} ${
              isDark ? "tw-mr-0 tw-inline-flex" : ""
            }`}
            key={sw}
          >
            <>
              <button
                className={`btn-link ${styles["searchWalletDisplayBtn"]} ${
                  isDark
                    ? "!tw-border-white/15 !tw-bg-white/[0.08] !tw-text-iron-300 hover:!tw-bg-white/[0.14] hover:!tw-text-white"
                    : ""
                }`}
                onClick={() =>
                  setSearchWallets(searchWallets.filter((s) => s != sw))
                }
                data-tooltip-id={`clear-wallet-display-${sw}`}
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
              className={`${styles["searchWalletDisplay"]} ${
                isDark ? "tw-mr-0 !tw-bg-white/[0.08] tw-text-iron-100" : ""
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
            className={`${styles["clearSearchBtnIcon"]} ${
              isDark ? "!tw-size-9 tw-rounded-full" : ""
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
        aria-label="Open search modal"
        onClick={() => setShowSearchModal(true)}
        className={`tw-inline-flex ${
          isDark ? "tw-size-9" : "tw-size-10"
        } tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-p-0 tw-transition-colors focus:tw-outline-none ${
          searchButtonClass
        }`}
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
        setSearchWallets([...searchWallets].filter((sw) => sw != removeW));
      }}
      clearSearchWallets={function () {
        setSearchWallets([]);
      }}
      {...variantProps}
    />
  );
}
