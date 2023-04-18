import styles from "./Delegation.module.scss";
import { Container, Row, Col, ToastContainer, Toast } from "react-bootstrap";
import { useAccount, useEnsName, useNetwork } from "wagmi";
import { areEqualAddresses } from "../../helpers/Helpers";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

import {
  ANY_COLLECTION_PATH,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegations-center/[contract]";
import dynamic from "next/dynamic";
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { sepolia } from "wagmi/chains";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AboutSection } from "../../pages/about/[section]";

const NewDelegationComponent = dynamic(() => import("./NewDelegation"), {
  ssr: false,
});

const NewSubDelegationComponent = dynamic(() => import("./NewSubDelegation"), {
  ssr: false,
});

const NewConsolidationComponent = dynamic(() => import("./NewConsolidation"), {
  ssr: false,
});

const ConnectWalletButton = dynamic(() => import("./ConnectWalletButton"), {
  ssr: false,
});

const SwitchNetworkButton = dynamic(() => import("./SwitchNetworkButton"), {
  ssr: false,
});

export default function DelegationCenterComponent() {
  const accountResolution = useAccount();
  const networkResolution = useNetwork();

  const ensResolution = useEnsName({
    address: accountResolution.address,
    chainId: 1,
  });

  const [showCreateNewDelegation, setShowCreateNewDelegation] = useState(false);
  const [showCreateNewSubDelegation, setShowCreateNewSubDelegation] =
    useState(false);
  const [showCreateNewConsolidation, setShowCreateNewConsolidation] =
    useState(false);

  const toastRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<
    { title: string; message: string } | undefined
  >(undefined);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) {
      setToast(undefined);
    }
  }, [showToast]);

  useEffect(() => {
    if (toast) {
      setShowToast(true);
    }
  }, [toast]);

  function printCollectionSelection() {
    return (
      <Container className="no-padding">
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
                      className={styles.viewManageBtn}
                      onClick={() => {
                        if (
                          areEqualAddresses(c.contract, DELEGATION_ALL_ADDRESS)
                        ) {
                          window.location.href = `/delegations-center/${ANY_COLLECTION_PATH}`;
                        } else {
                          window.location.href = `/delegations-center/${c.contract}`;
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
    <Container>
      <Row>
        <Col>
          {!showCreateNewDelegation &&
            !showCreateNewSubDelegation &&
            !showCreateNewConsolidation &&
            accountResolution.isConnected &&
            accountResolution.address &&
            DELEGATION_CONTRACT.chain_id == networkResolution.chain?.id && (
              <Container className="pt-4">
                <Row>
                  <Col xs={12} sm={12} md={4} className="pb-3">
                    <Container>
                      <Row className="pt-3">
                        <Col>
                          <h4>
                            <a
                              href={`/delegations-center/getting-started`}
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
                            className={styles.addNewDelegationBtn}
                            onClick={() => {
                              setShowCreateNewDelegation(true);
                              window.scrollTo(0, 0);
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
                            className={styles.addNewDelegationBtn}
                            onClick={() => {
                              setShowCreateNewSubDelegation(true);
                              window.scrollTo(0, 0);
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
                            className={styles.addNewDelegationBtn}
                            onClick={() => {
                              setShowCreateNewConsolidation(true);
                              window.scrollTo(0, 0);
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
                          <h4>Links</h4>
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
                        <Col className="no-padding">
                          {printCollectionSelection()}
                        </Col>
                      </Row>
                    </Container>
                  </Col>
                </Row>
              </Container>
            )}
          {showCreateNewDelegation && (
            <NewDelegationComponent
              address={accountResolution.address as string}
              ens={ensResolution.data}
              onHide={() => {
                setShowCreateNewDelegation(false);
              }}
              onSetToast={(toast: any) => {
                setToast({
                  title: toast.title,
                  message: toast.message,
                });
              }}
            />
          )}
          {showCreateNewSubDelegation && (
            <NewSubDelegationComponent
              address={accountResolution.address as string}
              ens={ensResolution.data}
              onHide={() => {
                setShowCreateNewSubDelegation(false);
              }}
              onSetToast={(toast: any) => {
                setToast({
                  title: toast.title,
                  message: toast.message,
                });
              }}
            />
          )}
          {showCreateNewConsolidation && (
            <NewConsolidationComponent
              address={accountResolution.address as string}
              ens={ensResolution.data}
              onHide={() => {
                setShowCreateNewConsolidation(false);
              }}
              onSetToast={(toast: any) => {
                setToast({
                  title: toast.title,
                  message: toast.message,
                });
              }}
            />
          )}
          {(!accountResolution.isConnected ||
            networkResolution.chain?.id != DELEGATION_CONTRACT.chain_id) && (
            <Container>
              <Row className="pt-5">
                <Col className="d-flex justify-content-center">
                  <h4>
                    <a
                      href={`/delegations-center/getting-started`}
                      className={styles.documentationLink}>
                      <span>
                        <FontAwesomeIcon icon="info-circle"></FontAwesomeIcon>
                        Getting Started
                      </span>
                    </a>
                  </h4>
                </Col>
              </Row>
            </Container>
          )}
          {!accountResolution.isConnected && <ConnectWalletButton />}
          {accountResolution.isConnected &&
            networkResolution.chain?.id != DELEGATION_CONTRACT.chain_id && (
              <SwitchNetworkButton />
            )}
        </Col>
      </Row>
      {/* {!showCreateNewDelegation &&
        !showCreateNewSubDelegation &&
        !showCreateNewConsolidation && (
          <Row className="pt-5 pb-5">
            <Col className="pt-2">
              <Container>
                <Row className={styles.delegationContractLinksHeader}>
                  <Col>Delegation Contract Links</Col>
                </Row>
                <Row className="pt-3 text-center">
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
          </Row>
        )} */}
      {toast && (
        <div
          className={styles.toastWrapper}
          onClick={(e) => {
            if (
              !toastRef.current ||
              !toastRef.current.contains(e.target as Node)
            ) {
              setShowToast(false);
            }
          }}>
          <ToastContainer
            position={"top-center"}
            className={styles.toast}
            ref={toastRef}>
            <Toast onClose={() => setShowToast(false)} show={showToast}>
              <Toast.Header>
                <strong className="me-auto">{toast.title}</strong>
              </Toast.Header>
              {toast.message && (
                <Toast.Body
                  dangerouslySetInnerHTML={{
                    __html: toast.message,
                  }}></Toast.Body>
              )}
            </Toast>
          </ToastContainer>
        </div>
      )}
    </Container>
  );
}
