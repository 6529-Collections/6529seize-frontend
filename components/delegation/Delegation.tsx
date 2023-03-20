import styles from "./Delegation.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useAccount, useConnect, useEnsName } from "wagmi";
import { formatAddress } from "../../helpers/Helpers";
import { useState } from "react";
import Image from "next/image";

import { SUPPORTED_COLLECTIONS } from "../../pages/delegations/[contract]";

export default function DelegationComponent() {
  const { address, connector, isConnected } = useAccount();
  const connectResolution = useConnect();
  const ensResolution = useEnsName({
    address: address,
  });

  const [collection, setCollection] = useState<string | undefined>(undefined);

  function printCollectionSelection() {
    return (
      <Container>
        <Row className="pt-4 pb-4">
          <Col>
            <h4>Choose Collection</h4>
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
            <Col
              key={c.contract}
              xs={12}
              xm={12}
              md={4}
              onClick={() => {
                window.location.href = `/delegations/${c.contract}`;
              }}
              className={styles.collectionSelectionWrapper}>
              <Container className="pb-3">
                <Row>
                  <Col className="pt-3 pb-3">
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
          {isConnected && address && (
            <Container>
              <Row className="pt-5 pb-3">
                <Col className="text-center">
                  <h4 className={styles.connectedAsHeader}>
                    Connected as{" "}
                    {ensResolution.data && `${ensResolution.data} - `}
                    {formatAddress(address)}
                  </h4>
                </Col>
              </Row>
              {!collection && printCollectionSelection()}
            </Container>
          )}
          {!isConnected && printConnect()}
        </Col>
      </Row>
    </Container>
  );
}
