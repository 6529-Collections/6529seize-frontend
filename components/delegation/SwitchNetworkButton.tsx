import styles from "./Delegation.module.scss";
import { Web3NetworkSwitch } from "@web3modal/react";
import { Container, Row, Col } from "react-bootstrap";
import { useNetwork } from "wagmi";
import { DELEGATION_CONTRACT } from "../../constants";

export default function SwitchNetworkButton() {
  const networkResolution = useNetwork();

  const clickSwitchNetwork = () => {
    const networkSwitch = document.querySelector("w3m-network-switch");
    const button = networkSwitch?.shadowRoot?.querySelector("w3m-button-big");
    button?.click();
  };

  const currentNetwork = networkResolution.chain;
  const targetNetwork = networkResolution.chains.find(
    (c) => c.id == DELEGATION_CONTRACT.chain_id
  );

  return (
    <Container>
      <Row className="pb-2">
        <Col className="d-flex align-items-center justify-content-center">
          <h5 className="mb-0 text-center">
            Unsupported Network: {currentNetwork?.name} - Switch to{" "}
            {targetNetwork?.name}
          </h5>
        </Col>
      </Row>
      <Row className="pb-2">
        <Col className="d-flex align-items-center justify-content-center">
          <Web3NetworkSwitch id="seize-web3-network-switch" />
          <button
            className={styles.switchNetworkButton}
            onClick={() => clickSwitchNetwork()}>
            Switch Network
          </button>
        </Col>
      </Row>
    </Container>
  );
}
