import styles from "./HeaderUserConnectAppWalletModal.module.scss";
import { Button, Collapse, Form, InputGroup, Modal } from "react-bootstrap";
import { APP_WALLET_CONNECTOR_TYPE } from "../../../../wagmiConfig/wagmiAppWalletConnector";
import { Connector, useConnect, useConnectors } from "wagmi";
import { formatAddress } from "../../../../helpers/Helpers";
import AppWalletAvatar from "../../../app-wallets/AppWalletAvatar";
import { useRef, useState } from "react";
import Link from "next/link";

export default function HeaderUserConnectAppWalletModal(
  props: Readonly<{
    open: boolean;
    onClose: () => void;
  }>
) {
  const connectors = useConnectors();

  const appConnectors = connectors
    .flat()
    .filter((connector) => connector.type === APP_WALLET_CONNECTOR_TYPE);

  return (
    <Modal
      show={props.open}
      onHide={props.onClose}
      keyboard
      centered
      backdrop
      contentClassName={styles.modalContent}>
      <Modal.Body>
        <div className={styles.modalTitle}>Connect App Wallet</div>
        {appConnectors.map((connector) => (
          <AppWalletConnector
            key={connector.id}
            connector={connector}
            onClose={props.onClose}
          />
        ))}
        {appConnectors.length === 0 && (
          <div className="d-flex justify-content-center mt-4">
            <Button
              variant="outline-secondary"
              disabled
              className="btn-block btn-lg">
              No App Wallets Found
            </Button>
          </div>
        )}
        <div className="d-flex justify-content-center mt-4">
          <Link href="/tools/app-wallets" onClick={props.onClose}>
            <Button variant="link" className="btn-block btn-lg">
              Manage App Wallets
            </Button>
          </Link>
        </div>
      </Modal.Body>
    </Modal>
  );
}

function AppWalletConnector(
  props: Readonly<{
    connector: Connector;
    onClose: () => void;
  }>
) {
  const { connect } = useConnect();

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    const success = await (props.connector as any).setPassword(password);
    if (!success) {
      setIsError(true);
      setPassword("");
      setIsConnecting(false);
    } else {
      connect({ connector: props.connector });
      props.onClose();
    }
  };

  return (
    <Button
      onClick={() => setShowPassword(true)}
      variant="outline-secondary"
      className={`btn-block btn-lg d-flex align-items-center justify-content-start gap-3 mb-3 ${styles.appWalletConnectorButton}`}>
      <AppWalletAvatar address={props.connector.id} />
      <div className="d-flex flex-column align-items-start w-100">
        <span className="font-color font-bolder">{props.connector.name}</span>
        <span className="font-color font-smaller font-lighter">
          {formatAddress(props.connector.id)}
        </span>
        <Collapse
          in={showPassword}
          onEntered={() => {
            passwordInputRef.current?.focus();
          }}>
          <div className="w-100">
            <InputGroup className="mt-2 mb-2">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                ref={passwordInputRef}
                onChange={(e) => setPassword(e.target.value)}
              />
            </InputGroup>
            <div className="d-flex mt-2 mb-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(false);
                  setPassword("");
                  setIsError(false);
                }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!password || isConnecting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsConnecting(true);
                  handleConnect();
                }}>
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            </div>
            {isError && (
              <div className="text-danger d-flex w-100">
                Password is incorrect
              </div>
            )}
          </div>
        </Collapse>
      </div>
    </Button>
  );
}
