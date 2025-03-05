import styles from "./Delegation.module.scss";
import { Container, Row, Col, Toast, ToastContainer } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { DELEGATION_CONTRACT } from "../../constants";
import { sepolia } from "wagmi/chains";
import { useEnsName } from "wagmi";
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
import { useRouter } from "next/router";
import NewAssignPrimaryAddress from "./NewAssignPrimaryAddress";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";

export enum DelegationCenterSection {
  CENTER = "delegation-center",
  REGISTER_DELEGATION = "register-delegation",
  REGISTER_SUB_DELEGATION = "register-sub-delegation",
  REGISTER_CONSOLIDATION = "register-consolidation",
  ASSIGN_PRIMARY_ADDRESS = "assign-primary-address",
  ANY_COLLECTION = "any-collection",
  MEMES_COLLECTION = "the-memes",
  MEME_LAB_COLLECTION = "meme-lab",
  GRADIENTS_COLLECTION = "6529-gradient",
  WALLET_ARCHITECTURE = "wallet-architecture",
  FAQ = "delegation-faq",
  CONSOLIDATION_USE_CASES = "consolidation-use-cases",
  CHECKER = "wallet-checker",
  HTML = "html",
}

interface Props {
  section: DelegationCenterSection;
  path?: string[];
  setActiveSection(section: DelegationCenterSection): any;
  address_query: string;
  setAddressQuery(address: string): any;
  collection_query: string;
  setCollectionQuery(collection: string): any;
  use_case_query: number;
  setUseCaseQuery(use_case: number): any;
}

export default function DelegationCenterMenu(props: Readonly<Props>) {
  const router = useRouter();
  const accountResolution = useSeizeConnectContext();
  const ensResolution = useEnsName({
    address: accountResolution.address as `0x${string}`,
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
            collection_query={props.collection_query}
            setCollectionQuery={props.setCollectionQuery}
            use_case_query={props.use_case_query}
            setUseCaseQuery={props.setUseCaseQuery}
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
      case DelegationCenterSection.ASSIGN_PRIMARY_ADDRESS:
        return (
          <NewAssignPrimaryAddress
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
            new_primary_address_query={props.address_query}
            setNewPrimaryAddressQuery={props.setAddressQuery}
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
        return (
          <DelegationHTML
            title="Wallet Architecture"
            path="reference-overview-wallet-architecture"
          />
        );
      case DelegationCenterSection.FAQ:
        return <DelegationHTML title="Delegation FAQ" path="delegation-faq" />;
      case DelegationCenterSection.CONSOLIDATION_USE_CASES:
        return (
          <DelegationHTML
            title="Consolidation Use Cases"
            path="consolidation-use-cases"
          />
        );
      case DelegationCenterSection.HTML:
        return (
          <DelegationHTML
            path={props.path && props.path[props.path?.length - 1]}
          />
        );
      case DelegationCenterSection.CHECKER:
        return (
          <WalletCheckerComponent
            address_query={props.address_query}
            setAddressQuery={props.setAddressQuery}
          />
        );
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
                  props.section === DelegationCenterSection.FAQ ||
                  (props.section === DelegationCenterSection.HTML &&
                    router.asPath.startsWith("/delegation/delegation-faq/"))
                    ? styles.menuLeftItemActive
                    : ""
                }`}>
                Delegation FAQs
              </Col>
            </Row>
            <Row className="pt-1 pb-2">
              <Col
                onClick={() =>
                  props.setActiveSection(
                    DelegationCenterSection.CONSOLIDATION_USE_CASES
                  )
                }
                className={`${styles.menuLeftItem} ${
                  props.section ===
                  DelegationCenterSection.CONSOLIDATION_USE_CASES
                    ? styles.menuLeftItemActive
                    : ""
                }`}>
                Consolidation Use Cases
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
                <NFTDelegationLink />
              </Col>
            </Row>
            <Row className="pt-2 pb-2">
              <Col>
                <EtherscanLink />
              </Col>
            </Row>
            <Row className="pt-2 pb-2">
              <Col>
                <GithubLink />
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
                  <Row className="pt-1 pb-2">
                    <Col
                      onClick={() =>
                        props.setActiveSection(
                          DelegationCenterSection.CONSOLIDATION_USE_CASES
                        )
                      }
                      className={`${styles.menuLeftItem} ${
                        props.section ===
                        DelegationCenterSection.CONSOLIDATION_USE_CASES
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Consolidation Use Cases
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
                </Container>
              </Col>
              <Col>
                <Container className="no-padding">
                  <Row className="pt-2 pb-2">
                    <Col>
                      <NFTDelegationLink />
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col>
                      <EtherscanLink />
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col>
                      <GithubLink />
                    </Col>
                  </Row>
                </Container>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      {toast && (
        <DelegationToast
          toastRef={toastRef}
          toast={toast}
          showToast={showToast}
          setShowToast={setShowToast}
        />
      )}
    </Container>
  );
}

function NFTDelegationLink() {
  return (
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
  );
}

function EtherscanLink() {
  return (
    <a
      href={
        DELEGATION_CONTRACT.chain_id === sepolia.id
          ? `https://sepolia.etherscan.io/address/${DELEGATION_CONTRACT.contract}`
          : `https://etherscan.io/address/${DELEGATION_CONTRACT.contract}`
      }
      target="_blank"
      rel="noreferrer"
      className={styles.delegationLink}>
      <Image src="/etherscan_w.png" alt="etherscan" width={30} height={30} />
      <span>Etherscan</span>
    </a>
  );
}

function GithubLink() {
  return (
    <a
      href={`https://github.com/6529-Collections/nftdelegation`}
      target="_blank"
      rel="noreferrer"
      className={styles.delegationLink}>
      <Image src="/github_w.png" alt="github" width={30} height={30} />
      <span>Github</span>
    </a>
  );
}

export function DelegationToast(
  props: Readonly<{
    toastRef: React.RefObject<HTMLDivElement>;
    toast: { title: string; message?: string };
    showToast: boolean;
    setShowToast: (show: boolean) => void;
  }>
) {
  return (
    <div
      className={styles.toastWrapper}
      onClick={(e) => {
        if (!props.toastRef.current?.contains(e.target as Node)) {
          props.setShowToast(false);
        }
      }}>
      <ToastContainer
        position={"top-center"}
        className={styles.toast}
        ref={props.toastRef}>
        <Toast onClose={() => props.setShowToast(false)} show={props.showToast}>
          <Toast.Header>
            <span className="me-auto">{props.toast.title}</span>
          </Toast.Header>
          {props.toast.message && (
            <Toast.Body
              dangerouslySetInnerHTML={{
                __html: props.toast.message,
              }}></Toast.Body>
          )}
        </Toast>
      </ToastContainer>
    </div>
  );
}
