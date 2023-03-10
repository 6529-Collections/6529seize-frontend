import styles from "./SearchModal.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Modal, InputGroup, Form, Button } from "react-bootstrap";

interface Props {
  show: boolean;
  setShow(show: boolean): any;
  searchWallets: string[];
  addSearchWallet(wallet: string): any;
  removeSearchWallet(wallet: string): any;
  clearSearchWallets(): any;
}

export default function SearchModal(props: Props) {
  const [invalidWalletAdded, setInvalidWalletAdded] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  function addSearchWallet() {
    if (
      (searchValue.startsWith("0x") || searchValue.endsWith(".eth")) &&
      !props.searchWallets.some((sw) => sw == searchValue)
    ) {
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
      <Modal.Header closeButton>
        <Modal.Title>Wallet Search</Modal.Title>
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
              if (target.key == "Enter") {
                addSearchWallet();
              }
            }}
            autoFocus
            className={`${styles.modalInput}`}
            placeholder="Search wallet address or ENS"
          />
          <Button className={styles.modalButton} onClick={addSearchWallet}>
            +
          </Button>
        </InputGroup>
        {props.searchWallets.map((w) => (
          <div key={w} className="pt-1 pb-1">
            <FontAwesomeIcon
              onClick={() => {
                props.removeSearchWallet(w);
              }}
              className={styles.removeWalletBtn}
              icon="square-minus"></FontAwesomeIcon>
            {"  "}
            {w}
          </div>
        ))}
        {props.searchWallets.length > 0 && (
          <Button
            className={`${styles.modalButtonClear} mt-3 mb-2`}
            onClick={() => props.clearSearchWallets()}>
            Clear All
          </Button>
        )}
      </Modal.Body>
    </Modal>
  );
}
