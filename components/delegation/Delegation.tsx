import styles from "./Delegation.module.scss";
import { Container, Row, Col, ToastContainer, Toast } from "react-bootstrap";
import { useAccount, useEnsName, useNetwork } from "wagmi";
import { areEqualAddresses } from "../../helpers/Helpers";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

import {
  ANY_COLLECTION_PATH,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegations/[contract]";
import dynamic from "next/dynamic";
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { sepolia } from "wagmi/chains";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DocumentationSection } from "./documentation/DelegationDocumentation";

const NewDelegationComponent = dynamic(() => import("./NewDelegation"), {
  ssr: false,
});

const ConnectWalletButton = dynamic(() => import("./ConnectWalletButton"), {
  ssr: false,
});

const SwitchNetworkButton = dynamic(() => import("./SwitchNetworkButton"), {
  ssr: false,
});

export default function DelegationComponent() {
  const accountResolution = useAccount();
  const networkResolution = useNetwork();

  const ensResolution = useEnsName({
    address: accountResolution.address,
    chainId: 1,
  });

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
      <Container>
        <Row>
          <Col className="pt-3 pb-5">
            <h4>Delegations by Collection</h4>
          </Col>
        </Row>
        {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
          <Row key={c.contract}>
            <Col className={styles.collectionSelectionWrapper}>
              <Container className="pt-2 pb-3">
                <Row className="pt-2 pb-2">
                  <Col
                    xs={3}
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
                    xs={6}
                    className="d-flex align-items-center justify-content-start">
                    <h5 className="font-color">{c.title}</h5>
                  </Col>
                  <Col
                    xs={3}
                    className="d-flex align-items-center justify-content-end">
                    <span
                      className={styles.viewManageBtn}
                      onClick={() => {
                        if (
                          areEqualAddresses(c.contract, DELEGATION_ALL_ADDRESS)
                        ) {
                          window.location.href = `/delegations/${ANY_COLLECTION_PATH}`;
                        } else {
                          window.location.href = `/delegations/${c.contract}`;
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
    <Container fluid>
      <Row>
        <Col>
          {accountResolution.isConnected &&
            accountResolution.address &&
            DELEGATION_CONTRACT.chain_id == networkResolution.chain?.id && (
              <Container>
                <Row>
                  <Col xs={12} sm={12} md={6} className="pt-3 pb-3">
                    <NewDelegationComponent
                      address={accountResolution.address}
                      ens={ensResolution.data}
                      showCancel={false}
                      showAddMore={false}
                      onHide={() => {
                        //donothing
                      }}
                      onSetToast={(toast: any) => {
                        setToast({
                          title: toast.title,
                          message: toast.message,
                        });
                      }}
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6} className={`pt-3 pb-3`}>
                    <Container className={styles.leftBorder}>
                      <Row>
                        <Col>{printCollectionSelection()}</Col>
                      </Row>
                    </Container>
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
      {accountResolution.isConnected &&
        networkResolution.chain?.id == DELEGATION_CONTRACT.chain_id && (
          <Row className="pt-5 pb-5">
            <Col className="pt-3">
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
                    <a
                      href={`/delegations/documentation/${DocumentationSection.REGISTER_DELEGATION}`}
                      className={styles.delegationLink}>
                      <span>
                        <FontAwesomeIcon icon="info-circle"></FontAwesomeIcon>
                        Documentation
                      </span>
                    </a>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        )}
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
