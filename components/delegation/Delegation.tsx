import styles from "./Delegation.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useAccount, useConnect, useEnsName } from "wagmi";
import { formatAddress } from "../../helpers/Helpers";
import { useState } from "react";
import Image from "next/image";

import { SUPPORTED_COLLECTIONS } from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";

const NewDelegationComponent = dynamic(() => import("./NewDelegation"), {
  ssr: false,
});

export default function DelegationComponent() {
  const accountResolution = useAccount();
  const ensResolution = useEnsName({
    address: accountResolution.address,
  });
  const connectResolution = useConnect();

  function printWalletActions() {
    return (
      <Container>
        <Row>
          <Col>
            <h4>Actions</h4>
          </Col>
        </Row>
        <Row className="pt-2 pb-3">
          <Col>
            <span className={styles.addNewDelegationBtn}>
              <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
              Bulk Delegations
            </span>
            <span className={styles.lockDelegationBtn}>
              <FontAwesomeIcon icon="lock" className={styles.buttonIcon} />
              Lock Wallet
            </span>
          </Col>
        </Row>
      </Container>
    );
  }
  function printCollectionSelection() {
    return (
      <Container>
        <Row>
          <Col className="pt-3 pb-3">
            <h4>Manage Delegations by Collection</h4>
          </Col>
        </Row>
        <Row>
          {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
            <Col
              key={c.contract}
              xs={12}
              xm={12}
              md={6}
              onClick={() => {
                window.location.href = `/delegations/${c.contract}`;
              }}
              className={styles.collectionSelectionWrapper}>
              <Container className="pb-4">
                <Row>
                  <Col>
                    <h4 className="font-color float-none">{c.display}</h4>
                  </Col>
                </Row>
                <Row>
                  <Col className={styles.collectionSelectionImage}>
                    <Image
                      loading="eager"
                      priority
                      width={0}
                      height={0}
                      src={c.preview}
                      alt={c.display}
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
          ))}
        </Row>
      </Container>
    );
  }

  function printConnect() {
    return (
      <Container className={styles.mainContainer}>
        <Row className="pt-5 pb-3">
          <Col className="text-center">
            <h3 className="float-none">Connect your wallet</h3>
          </Col>
        </Row>
        <Row className="pt-5">
          {connectResolution.connectors.map((connector) => (
            <Col
              key={`${connector.name}`}
              xs={12}
              xm={12}
              md={4}
              className="pt-3 pb-3 d-flex justify-content-center">
              <div
                className={styles.connectBtn}
                onClick={() => {
                  if (connector.ready) {
                    connectResolution.connect({ connector });
                  } else if (connector.name == "MetaMask") {
                    window.open("https://metamask.io/download/", "_blank");
                  }
                }}>
                {connector.name}
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          {accountResolution.isConnected && accountResolution.address && (
            <Container>
              <Row>
                <Col xs={12} sm={12} md={6} className="pt-3 pb-3">
                  <NewDelegationComponent
                    address={accountResolution.address}
                    ens={ensResolution.data}
                    showCancel={false}
                    showAddMore={false}
                  />
                </Col>
                <Col xs={12} sm={12} md={6} className={`pt-3 pb-3`}>
                  {/* {printCollectionSelection()} */}
                  <Container className={styles.leftBorder}>
                    <Row>
                      <Col>{printCollectionSelection()}</Col>
                    </Row>
                    <Row className="pt-4 pb-4">
                      <Col>{printWalletActions()}</Col>
                    </Row>
                  </Container>
                </Col>
              </Row>
              {/* <Row className="pt-2 pb-5">
                <Col>{printWalletActions()}</Col>
              </Row> */}
            </Container>
          )}
          {!accountResolution.isConnected && printConnect()}
        </Col>
      </Row>
    </Container>
  );
}
