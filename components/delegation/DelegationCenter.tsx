import styles from "./Delegation.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useAccount, useNetwork } from "wagmi";
import { areEqualAddresses } from "../../helpers/Helpers";
import Image from "next/image";

import {
  ANY_COLLECTION_PATH,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegation-center/[contract]";
import dynamic from "next/dynamic";
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { sepolia } from "wagmi/chains";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

const ConnectWalletButton = dynamic(() => import("./ConnectWalletButton"), {
  ssr: false,
});

const SwitchNetworkButton = dynamic(() => import("./SwitchNetworkButton"), {
  ssr: false,
});

export default function DelegationCenterComponent() {
  const accountResolution = useAccount();
  const networkResolution = useNetwork();

  function isEnabled() {
    return (
      accountResolution.isConnected &&
      networkResolution.chain?.id == DELEGATION_CONTRACT.chain_id
    );
  }

  const [enabled, setEnabled] = useState(isEnabled());

  useEffect(() => {
    setEnabled(isEnabled());
  }, [accountResolution.isConnected, networkResolution.chain]);

  function printCollectionSelection() {
    return (
      <Container>
        <Row className="pt-3 pb-3">
          <Col>
            <h4>Delegations/Consolidations by Collection</h4>
          </Col>
        </Row>
        {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
          <Row key={c.contract}>
            <Col className={styles.collectionSelectionWrapper}>
              <Container className="pt-2 pb-3">
                <Row className="pt-2 pb-2">
                  <Col
                    xs={4}
                    sm={3}
                    className="d-flex align-items-center justify-content-center">
                    <Image
                      className={styles.collectionSelectionImage2}
                      loading="eager"
                      priority
                      width={0}
                      height={0}
                      src={c.preview}
                      alt={c.display}
                    />
                  </Col>
                  <Col
                    xs={4}
                    sm={5}
                    className="d-flex align-items-center justify-content-start">
                    <h5 className="font-color mb-0">{c.title}</h5>
                  </Col>
                  <Col
                    xs={4}
                    className="no-padding d-flex align-items-center justify-content-end">
                    <span
                      className={`${styles.viewManageBtn} ${
                        !enabled ? styles.viewManageBtnDisabled : ""
                      }`}
                      onClick={() => {
                        if (
                          areEqualAddresses(c.contract, DELEGATION_ALL_ADDRESS)
                        ) {
                          window.location.href = `/delegation-center/${ANY_COLLECTION_PATH}`;
                        } else {
                          window.location.href = `/delegation-center/${c.contract}`;
                        }
                      }}>
                      View/Manage
                    </span>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        ))}
      </Container>
    );
  }

  return (
    <Container className="pt-4 no-padding">
      <Row>
        <Col>
          {!accountResolution.isConnected && <ConnectWalletButton />}
          {accountResolution.isConnected &&
            networkResolution.chain?.id != DELEGATION_CONTRACT.chain_id && (
              <SwitchNetworkButton />
            )}
          <Container>
            <Row>
              <Col xs={12} sm={12} md={4} className="pb-3">
                <Container className="no-padding">
                  <Row className="pt-3">
                    <Col>
                      <h4>
                        <a
                          href={`/delegation-center/getting-started`}
                          className={styles.documentationLink}>
                          <span>
                            <FontAwesomeIcon icon="info-circle"></FontAwesomeIcon>
                            Getting Started
                          </span>
                        </a>
                      </h4>
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col>
                      <span
                        className={`${styles.addNewDelegationBtn} ${
                          !enabled ? styles.addNewDelegationBtnDisabled : ""
                        }`}
                        onClick={() => {
                          window.location.href =
                            "/delegation-center/register-delegation";
                        }}>
                        <FontAwesomeIcon
                          icon="plus"
                          className={styles.buttonIcon}
                        />
                        Register Delegation
                      </span>
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col>
                      <span
                        className={`${styles.addNewDelegationBtn} ${
                          !enabled ? styles.addNewDelegationBtnDisabled : ""
                        }`}
                        onClick={() => {
                          window.location.href =
                            "/delegation-center/register-sub-delegation";
                        }}>
                        <FontAwesomeIcon
                          icon="plus"
                          className={styles.buttonIcon}
                        />
                        Register Sub-Delegation
                      </span>
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col>
                      <span
                        className={`${styles.addNewDelegationBtn} ${
                          !enabled ? styles.addNewDelegationBtnDisabled : ""
                        }`}
                        onClick={() => {
                          window.location.href =
                            "/delegation-center/register-consolidation";
                        }}>
                        <FontAwesomeIcon
                          icon="plus"
                          className={styles.buttonIcon}
                        />
                        Register Consolidation
                      </span>
                    </Col>
                  </Row>
                  <Row className="pt-5">
                    <Col>
                      <h4>NFTDelegation.com Links</h4>
                    </Col>
                  </Row>
                  <Row className="pt-3">
                    <Col>
                      <a
                        href={
                          DELEGATION_CONTRACT.chain_id == sepolia.id
                            ? `https://sepolia.etherscan.io/address/${DELEGATION_CONTRACT.contract}`
                            : `https://etherscan.io/address/${DELEGATION_CONTRACT.contract}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className={styles.delegationLink}>
                        <Image
                          src="/etherscan_w.png"
                          alt="etherscan"
                          width={30}
                          height={30}
                        />
                        <span>Etherscan</span>
                      </a>
                      <a
                        href={`https://github.com/6529-Collections/nftdelegation`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.delegationLink}>
                        <Image
                          src="/github_w.png"
                          alt="github"
                          width={30}
                          height={30}
                        />
                        <span>Github</span>
                      </a>
                    </Col>
                  </Row>
                </Container>
              </Col>
              <Col xs={12} sm={12} md={8} className={`pb-3`}>
                <Container>
                  <Row>
                    <Col>{printCollectionSelection()}</Col>
                  </Row>
                </Container>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
