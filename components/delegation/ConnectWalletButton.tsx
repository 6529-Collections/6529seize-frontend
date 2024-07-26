import styles from "./Delegation.module.scss";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";
import { Container, Row, Col } from "react-bootstrap";

interface Props {
  chain_id: number;
}

export default function ConnectWalletButton(props: Readonly<Props>) {
  const { open } = useWeb3Modal();
  const { open: isOpen } = useWeb3ModalState();

  return (
    <Container>
      <Row className="pb-2">
        <Col className="d-flex align-items-center justify-content-center">
          <button
            disabled={isOpen}
            className={styles.connectWalletButton}
            onClick={() => open()}>
            {isOpen && (
              <div className="d-inline">
                <div
                  className={`spinner-border ${styles.loader}`}
                  role="status">
                  <span className="sr-only"></span>
                </div>
              </div>
            )}{" "}
            {isOpen ? `Connecting...` : `Connect Wallet`}
          </button>
        </Col>
      </Row>
    </Container>
  );
}
