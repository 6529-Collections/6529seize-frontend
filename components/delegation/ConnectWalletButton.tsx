import styles from "./Delegation.module.scss";
import { useWeb3Modal } from "@web3modal/react";
import { Container, Row, Col } from "react-bootstrap";

export default function ConnectWalletButton() {
  const { isOpen, open, close, setDefaultChain } = useWeb3Modal();

  return (
    <Container>
      <Row className="pt-5 pb-5">
        <Col className="text-center">
          <h3 className="float-none">Connect your wallet</h3>
        </Col>
      </Row>
      <Row>
        <Col className="text-center">
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
            {isOpen ? `Connecting...` : `Connect`}
          </button>
        </Col>
      </Row>
    </Container>
  );
}
