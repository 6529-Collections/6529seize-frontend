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
  setShow(show: boolean): any;
  searchWallets: string[];
  addSearchWallet(wallet: string): any;
  removeSearchWallet(wallet: string): any;
  clearSearchWallets(): any;
}

function SearchModal(props: Readonly<Props>) {
  const [invalidWalletAdded, setInvalidWalletAdded] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  function addSearchWallet() {
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
      onHide={() => props.setShow(false)}>
      <Modal.Header>
        <Modal.Title>Search</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InputGroup
          className={`${
            invalidWalletAdded ? styles.shakeWalletInput : ""
          } mb-3`}>
          <Form.Control
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(target) => {
              if (target.key === "Enter") {
                addSearchWallet();
              }
            }}
            autoFocus
            className={`${styles.modalInput}`}
            placeholder="Search for address, ENS or username"
          />
          <Button
            className={styles.modalButton}
            onClick={addSearchWallet}
            aria-label="Add search wallet">
            +
          </Button>
        </InputGroup>
        {props.searchWallets.map((w) => (
          <div key={w} className="pt-1 pb-1">
            <>
              <FontAwesomeIcon
                onClick={() => {
                  props.removeSearchWallet(w);
                }}
                className={styles.removeWalletBtn}
                icon={faSquareXmark}
                data-tooltip-id={`remove-wallet-${w}`}
              />
              <Tooltip
                id={`remove-wallet-${w}`}
                place="top"
                delayShow={250}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}>
                Clear
              </Tooltip>
            </>
            {"  "}
            {w}
          </div>
        ))}
        {props.searchWallets.length === 0 && (
          <div className={styles.noSearchWalletsText}>
            No search queries added
          </div>
        )}
        <Button
          disabled={props.searchWallets.length === 0}
          className={`${styles.modalButtonClear} mt-3 mb-2`}
          onClick={() => props.clearSearchWallets()}>
          Clear All
        </Button>
        <Button
          className={`${styles.modalButtonDone} mt-3 mb-2`}
          onClick={() => props.setShow(false)}>
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
  }>
) {
  const { searchWallets, setSearchWallets, setShowSearchModal } = props;
  return (
    <span className="d-flex flex-wrap align-items-center justify-content-end">
      {searchWallets.length > 0 &&
        searchWallets.map((sw) => (
          <span className={styles.searchWalletDisplayWrapper} key={sw}>
            <>
              <button
                className={`btn-link ${styles.searchWalletDisplayBtn}`}
                onClick={() =>
                  setSearchWallets(searchWallets.filter((s) => s != sw))
                }
                data-tooltip-id={`clear-wallet-display-${sw}`}>
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
                }}>
                Clear
              </Tooltip>
            </>
            <span className={styles.searchWalletDisplay}>
              {sw.endsWith(".eth") ? sw : formatAddress(sw)}
            </span>
          </span>
        ))}
      {searchWallets.length > 0 && (
        <>
          <FontAwesomeIcon
            onClick={() => setSearchWallets([])}
            className={styles.clearSearchBtnIcon}
            icon={faTimesCircle}
            data-tooltip-id="clear-all-display"
          />
          <Tooltip
            id="clear-all-display"
            place="top"
            delayShow={250}
            style={{
              backgroundColor: "#f8f9fa",
              color: "#212529",
              padding: "4px 8px",
            }}>
            Clear All
          </Tooltip>
        </>
      )}
      <button
        onClick={() => setShowSearchModal(true)}
        className={`btn-link ${styles.searchBtn} ${
          searchWallets.length > 0 ? styles.searchBtnActive : ""
        } d-inline-flex align-items-center justify-content-center`}>
        <FontAwesomeIcon
          style={{
            width: "20px",
            height: "20px",
            color: "#000",
          }}
          icon={faSearch}></FontAwesomeIcon>
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
  }>
) {
  const { show, setShow, searchWallets, setSearchWallets } = props;

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
    />
  );
}
