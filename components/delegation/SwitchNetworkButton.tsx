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
      <Row className="pt-5 pb-5">
        <Col xs={12} className="text-center">
          <h3 className="float-none">
            Unsupported Network: {currentNetwork?.name}
          </h3>
        </Col>
        <Col xs={12} className="text-center pt-4">
          <h3 className="float-none">Switch to {targetNetwork?.name}</h3>
        </Col>
      </Row>
      <Row>
        <Col className="text-center">
          <Web3NetworkSwitch id="seize-web3-network-switch" />
          <button
            className={styles.connectWalletButton}
            onClick={() => clickSwitchNetwork()}>
            Switch Network
          </button>
        </Col>
      </Row>
    </Container>
  );
}
