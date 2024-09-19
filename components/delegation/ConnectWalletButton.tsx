import { useSeizeConnect } from "../../hooks/useSeizeConnect";
import styles from "./Delegation.module.scss";
import { Container, Row, Col } from "react-bootstrap";

interface Props {
  chain_id: number;
}

export default function ConnectWalletButton(props: Readonly<Props>) {
  const { seizeConnect, seizeConnectOpen } = useSeizeConnect();
  return (
    <Container>
      <Row className="pb-2">
        <Col className="d-flex align-items-center justify-content-center">
          <button
            disabled={seizeConnectOpen}
            className={styles.connectWalletButton}
            onClick={() => seizeConnect()}>
            {seizeConnectOpen && (
              <div className="d-inline">
                <div
                  className={`spinner-border ${styles.loader}`}
                  role="status">
                  <span className="sr-only"></span>
                </div>
              </div>
            )}{" "}
            {seizeConnectOpen ? `Connecting...` : `Connect Wallet`}
          </button>
        </Col>
      </Row>
    </Container>
  );
}
