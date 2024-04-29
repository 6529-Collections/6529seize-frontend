import styles from "./Delegation.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useAccount } from "wagmi";
import Image from "next/image";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";

import { SUPPORTED_COLLECTIONS } from "../../pages/delegation/[...section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { DelegationCenterSection } from "./DelegationCenterMenu";
import {
  DELEGATION_ALL_ADDRESS,
  MEMES_CONTRACT,
  MEMELAB_CONTRACT,
  GRADIENT_CONTRACT,
} from "../../constants";
import { areEqualAddresses } from "../../helpers/Helpers";

interface Props {
  setSection(section: DelegationCenterSection): any;
}

export default function DelegationCenterComponent(props: Readonly<Props>) {
  const [redirect, setRedirect] = useState<DelegationCenterSection>();
  const accountResolution = useAccount();
  const web3Modal = useWeb3Modal();
  const web3ModalState = useWeb3ModalState();

  const [openConnect, setOpenConnect] = useState(false);

  useEffect(() => {
    if (redirect) {
      if (!accountResolution.isConnected) {
        setOpenConnect(true);
        web3Modal.open();
      } else {
        props.setSection(redirect);
      }
    }
  }, [redirect]);

  useEffect(() => {
    if (!web3ModalState.open) {
      if (openConnect) {
        if (accountResolution.isConnected && redirect) {
          props.setSection(redirect);
        }
      }
      setRedirect(undefined);
    }
  }, [web3ModalState.open]);

  function printCollectionSelection() {
    return (
      <Container className="no-padding">
        <Row className="pt-4 pb-2">
          <Col>
            <h4>Manage by Collection</h4>
          </Col>
        </Row>
        <Row>
          {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
            <Col
              key={c.contract}
              xs={12}
              sm={6}
              md={3}
              className="pt-2 pb-2 d-flex flex-wrap gap-3">
              <button
                key={c.contract}
                className={styles.collectionSelectionButton}
                onClick={() => {
                  const newSection = areEqualAddresses(
                    c.contract,
                    DELEGATION_ALL_ADDRESS
                  )
                    ? DelegationCenterSection.ANY_COLLECTION
                    : areEqualAddresses(c.contract, MEMES_CONTRACT)
                    ? DelegationCenterSection.MEMES_COLLECTION
                    : areEqualAddresses(c.contract, MEMELAB_CONTRACT)
                    ? DelegationCenterSection.MEME_LAB_COLLECTION
                    : areEqualAddresses(c.contract, GRADIENT_CONTRACT)
                    ? DelegationCenterSection.GRADIENTS_COLLECTION
                    : null;
                  if (newSection) {
                    setRedirect(newSection);
                  }
                }}>
                <span className="d-flex align-items-center gap-3">
                  <Image
                    className={styles.collectionSelectionImage}
                    loading="eager"
                    priority
                    width={0}
                    height={0}
                    src={c.preview}
                    alt={c.display}
                  />
                  <span>{c.title}</span>
                </span>
              </button>
            </Col>
          ))}
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="pb-2">
        <Col>
          <h1>
            <span className="font-lightest">Delegation</span> Center
          </h1>
        </Col>
      </Row>
      <Row>
        <Col>
          <Container className={`${styles.delegationCenterSection} pt-4 pb-4`}>
            <Row>
              <Col
                sm={12}
                md={9}
                className="pt-2 pb-2 d-flex align-items-center justify-content-between gap-2">
                <span className="d-flex flex-column">
                  <h3 className="pb-4">Delegations</h3>
                  <span className="d-flex align-items-center gap-3">
                    <Image
                      loading="eager"
                      priority
                      src="/delegation-icon.png"
                      alt="delegation"
                      width={50}
                      height={50}
                    />
                    <ul className="mb-0">
                      <li>
                        Mint with your hot wallet on behalf of your vault wallet
                      </li>
                      <li>Eliminate manual wallet mapping</li>
                    </ul>
                  </span>
                </span>
              </Col>
              <Col
                sm={12}
                md={3}
                className="pt-2 pb-2 d-flex flex-column gap-2 align-items-center justify-content-center">
                <button
                  className={`${styles.addNewDelegationBtn}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_DELEGATION)
                  }>
                  <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                  Delegation
                </button>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Container className={`${styles.delegationCenterSection} pt-4 pb-4`}>
            <Row>
              <Col
                sm={12}
                md={9}
                className="pt-2 pb-2 d-flex align-items-center justify-content-between gap-2">
                <span className="d-flex flex-column">
                  <h3 className="pb-4">Consolidations</h3>
                  <span className="d-flex align-items-center gap-3">
                    <Image
                      loading="eager"
                      priority
                      src="/consolidation-icon.png"
                      alt="consolidation"
                      width={50}
                      height={50}
                    />
                    <ul className="mb-0">
                      <li>
                        Use up to 3 wallets to manage your 6529 Collections NFTs
                      </li>
                      <li>Transfer NFTs between wallets without losing TDH</li>
                    </ul>
                  </span>
                </span>
              </Col>
              <Col
                sm={12}
                md={3}
                className="pt-2 pb-2 d-flex align-items-center justify-content-center">
                <button
                  className={`${styles.addNewDelegationBtn}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_CONSOLIDATION)
                  }>
                  <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                  Consolidation
                </button>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Container className={`${styles.delegationCenterSection} pt-4 pb-4`}>
            <Row>
              <Col
                sm={12}
                md={9}
                className="pt-2 pb-2 d-flex align-items-center justify-content-between gap-2">
                <span className="d-flex flex-column">
                  <h3 className="pb-4">Delegation Management</h3>
                  <span className="d-flex align-items-center gap-3">
                    <Image
                      loading="eager"
                      priority
                      src="/manager-icon.png"
                      alt="delegation-manager"
                      width={50}
                      height={50}
                    />
                    <ul className="mb-0">
                      <li>
                        Give another wallet permission to handle delegations and
                        consolidations on your behalf
                      </li>
                      <li>Increase your wallet security</li>
                    </ul>
                  </span>
                </span>
              </Col>
              <Col
                sm={12}
                md={3}
                className="pt-2 pb-2 d-flex align-items-center justify-content-center">
                <button
                  className={`${styles.addNewDelegationBtn}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_SUB_DELEGATION)
                  }>
                  <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                  Delegation Manager
                </button>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col>{printCollectionSelection()}</Col>
      </Row>
    </Container>
  );
}
