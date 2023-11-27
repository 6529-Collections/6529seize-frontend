import styles from "./Delegation.module.scss";
import { Container, Row, Col, Toast, ToastContainer } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { DELEGATION_CONTRACT } from "../../constants";
import { sepolia } from "wagmi/chains";
import { useAccount, useEnsName } from "wagmi";
import {
  ANY_COLLECTION,
  GRADIENTS_COLLECTION,
  MEMES_COLLECTION,
  MEME_LAB_COLLECTION,
} from "../../pages/delegation/[...section]";
import DelegationCenterComponent from "./DelegationCenter";
import CollectionDelegationComponent from "./CollectionDelegation";
import NewConsolidationComponent from "./NewConsolidation";
import NewDelegationComponent from "./NewDelegation";
import NewSubDelegationComponent from "./NewSubDelegation";
import DelegationHTML from "./html/DelegationHTML";
import WalletCheckerComponent from "./walletChecker/WalletChecker";

export enum DelegationCenterSection {
  CENTER = "delegation-center",
  REGISTER_DELEGATION = "register-delegation",
  REGISTER_SUB_DELEGATION = "register-sub-delegation",
  REGISTER_CONSOLIDATION = "register-consolidation",
  ANY_COLLECTION = "any-collection",
  MEMES_COLLECTION = "the-memes",
  MEME_LAB_COLLECTION = "meme-lab",
  GRADIENTS_COLLECTION = "6529-gradient",
  WALLET_ARCHITECTURE = "wallet-architecture",
  FAQ = "delegation-faq",
  CHECKER = "wallet-checker",
  HTML = "html",
}

interface Props {
  section: DelegationCenterSection;
  path?: string[];
  setActiveSection(section: DelegationCenterSection): any;
}

export default function DelegationCenterMenu(props: Readonly<Props>) {
  const accountResolution = useAccount();
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

  function printContent() {
    switch (props.section) {
      case DelegationCenterSection.CENTER:
        return (
          <DelegationCenterComponent
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.REGISTER_DELEGATION:
        return (
          <NewDelegationComponent
            address={accountResolution.address as string}
            ens={ensResolution.data}
            onHide={() => {
              props.setActiveSection(DelegationCenterSection.CENTER);
            }}
            onSetToast={(toast: any) => {
              setToast({
                title: toast.title,
                message: toast.message,
              });
            }}
          />
        );
      case DelegationCenterSection.REGISTER_SUB_DELEGATION:
        return (
          <NewSubDelegationComponent
            address={accountResolution.address as string}
            ens={ensResolution.data}
            onHide={() => {
              props.setActiveSection(DelegationCenterSection.CENTER);
            }}
            onSetToast={(toast: any) => {
              setToast({
                title: toast.title,
                message: toast.message,
              });
            }}
          />
        );
      case DelegationCenterSection.REGISTER_CONSOLIDATION:
        return (
          <NewConsolidationComponent
            address={accountResolution.address as string}
            ens={ensResolution.data}
            onHide={() => {
              props.setActiveSection(DelegationCenterSection.CENTER);
            }}
            onSetToast={(toast: any) => {
              setToast({
                title: toast.title,
                message: toast.message,
              });
            }}
          />
        );
      case DelegationCenterSection.ANY_COLLECTION:
        return (
          <CollectionDelegationComponent
            collection={ANY_COLLECTION}
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.MEMES_COLLECTION:
        return (
          <CollectionDelegationComponent
            collection={MEMES_COLLECTION}
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.MEME_LAB_COLLECTION:
        return (
          <CollectionDelegationComponent
            collection={MEME_LAB_COLLECTION}
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.GRADIENTS_COLLECTION:
        return (
          <CollectionDelegationComponent
            collection={GRADIENTS_COLLECTION}
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.WALLET_ARCHITECTURE:
        return <DelegationHTML path="reference-overview-wallet-architecture" />;
      case DelegationCenterSection.FAQ:
        return <DelegationHTML path="delegation-faq" />;
      case DelegationCenterSection.HTML:
        return (
          <DelegationHTML
            path={props.path && props.path[props.path?.length - 1]}
          />
        );
      case DelegationCenterSection.CHECKER:
        return <WalletCheckerComponent />;
    }
  }

  return (
    <Container className="pt-4">
      <Row>
        <Col className={styles.menuLeft}>
          <Container>
            <Row className="pt-2 pb-2">
              <Col
                onClick={() =>
                  props.setActiveSection(DelegationCenterSection.CENTER)
                }
                className={`${styles.menuLeftItem} ${
                  props.section === DelegationCenterSection.CENTER
                    ? styles.menuLeftItemActive
                    : ""
                }`}>
                Delegation Center
              </Col>
            </Row>
            <Row className="pt-1 pb-2">
              <Col
                onClick={() =>
                  props.setActiveSection(
                    DelegationCenterSection.WALLET_ARCHITECTURE
                  )
                }
                className={`${styles.menuLeftItem} ${
                  props.section === DelegationCenterSection.WALLET_ARCHITECTURE
                    ? styles.menuLeftItemActive
                    : ""
                }`}>
                Wallet Architecture
              </Col>
            </Row>
            <Row className="pt-1 pb-2">
              <Col
                onClick={() =>
                  props.setActiveSection(DelegationCenterSection.FAQ)
                }
                className={`${styles.menuLeftItem} ${
                  props.section === DelegationCenterSection.FAQ
                    ? styles.menuLeftItemActive
                    : ""
                }`}>
                Delegation FAQs
              </Col>
            </Row>
            <Row className="pt-1 pb-2">
              <Col
                onClick={() =>
                  props.setActiveSection(DelegationCenterSection.CHECKER)
                }
                className={`${styles.menuLeftItem} ${
                  props.section === DelegationCenterSection.CHECKER
                    ? styles.menuLeftItemActive
                    : ""
                }`}>
                Wallet Checker
              </Col>
            </Row>
            <Row className="pt-4 pb-2">
              <Col>
                <a
                  href="https://nftdelegation.com/"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.delegationLink}>
                  <Image
                    src="/nftdelegation.jpg"
                    alt="nftdelegation"
                    width={30}
                    height={30}
                  />
                  <span>NFTDelegation.com</span>
                </a>
              </Col>
            </Row>
            <Row className="pt-2 pb-2">
              <Col>
                <a
                  href={
                    DELEGATION_CONTRACT.chain_id === sepolia.id
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
              </Col>
            </Row>
            <Row className="pt-2 pb-2">
              <Col>
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
        {<Col className={styles.menuRight}>{printContent()}</Col>}
      </Row>
      <Row className="pt-4">
        <Col className={styles.menuLeftFull}>
          <Container>
            <Row>
              <Col>
                <Container className="no-padding">
                  <Row className="pt-2 pb-2">
                    <Col
                      onClick={() =>
                        props.setActiveSection(DelegationCenterSection.CENTER)
                      }
                      className={`${styles.menuLeftItem} ${
                        props.section === DelegationCenterSection.CENTER
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Delegation Center
                    </Col>
                  </Row>
                  <Row className="pt-1 pb-2">
                    <Col
                      onClick={() =>
                        props.setActiveSection(
                          DelegationCenterSection.WALLET_ARCHITECTURE
                        )
                      }
                      className={`${styles.menuLeftItem} ${
                        props.section ==
                        DelegationCenterSection.WALLET_ARCHITECTURE
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Wallet Architecture
                    </Col>
                  </Row>
                  <Row className="pt-1 pb-2">
                    <Col
                      onClick={() =>
                        props.setActiveSection(DelegationCenterSection.FAQ)
                      }
                      className={`${styles.menuLeftItem} ${
                        props.section === DelegationCenterSection.FAQ
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Delegation FAQs
                    </Col>
                  </Row>
                </Container>
              </Col>
              <Col>
                <Container className="no-padding">
                  <Row className="pt-2 pb-2">
                    <Col>
                      <a
                        href="https://nftdelegation.com/"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.delegationLink}>
                        <Image
                          src="/nftdelegation.jpg"
                          alt="nftdelegation"
                          width={30}
                          height={30}
                        />
                        <span>NFTDelegation.com</span>
                      </a>
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col>
                      <a
                        href={
                          DELEGATION_CONTRACT.chain_id === sepolia.id
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
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col>
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
          </Container>
        </Col>
      </Row>
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
