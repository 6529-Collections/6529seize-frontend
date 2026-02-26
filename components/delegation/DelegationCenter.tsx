"use client";


import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useEffectEvent, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  DELEGATION_ALL_ADDRESS,
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { DelegationCenterSection } from "@/types/enums";

import { SUPPORTED_COLLECTIONS } from "./delegation-constants";
import styles from "./Delegation.module.scss";
interface Props {
  setSection(section: DelegationCenterSection): any;
}

export default function DelegationCenterComponent(props: Readonly<Props>) {
  const [redirect, setRedirect] = useState<DelegationCenterSection>();
  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const [openConnect, setOpenConnect] = useState(false);
  const { setSection } = props;

  const handleRedirect = useEffectEvent((target: DelegationCenterSection) => {
    if (!isConnected) {
      setOpenConnect(true);
      seizeConnect();
      return;
    }

    setSection(target);
  });

  const handleSeizeConnectClosed = useEffectEvent(() => {
    if (openConnect && redirect && isConnected) {
      setSection(redirect);
    }

    setRedirect(undefined);
  });

  useEffect(() => {
    if (!redirect) {
      return;
    }

    handleRedirect(redirect);
  }, [redirect]);

  useEffect(() => {
    if (!seizeConnectOpen) {
      handleSeizeConnectClosed();
    }
  }, [seizeConnectOpen]);

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
              className="pt-2 pb-2 d-flex flex-wrap gap-3"
            >
              <button
                key={c.contract}
                className={styles["collectionSelectionButton"]}
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
                }}
              >
                <span className="d-flex align-items-center gap-3">
                  <Image
                    unoptimized
                    className={styles["collectionSelectionImage"]}
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
          <h1>Delegation Center</h1>
        </Col>
      </Row>
      <Row>
        <Col>
          <Container
            className={`${styles["delegationCenterSection"]} pt-4 pb-4`}
          >
            <Row>
              <Col
                sm={12}
                md={9}
                className="pt-2 pb-2 d-flex align-items-center justify-content-between gap-2"
              >
                <span className="d-flex flex-column">
                  <h3 className="pb-4">Delegations</h3>
                  <span className="d-flex align-items-center gap-3">
                    <Image
                      unoptimized
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
                className="pt-2 pb-2 d-flex flex-column gap-2 align-items-center justify-content-center"
              >
                <button
                  className={`${styles["addNewDelegationBtn"]}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_DELEGATION)
                  }
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={styles["buttonIcon"]}
                  />
                  Delegation
                </button>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Container
            className={`${styles["delegationCenterSection"]} pt-4 pb-4`}
          >
            <Row>
              <Col
                sm={12}
                md={9}
                className="pt-2 pb-2 d-flex align-items-center justify-content-between gap-2"
              >
                <span className="d-flex flex-column">
                  <h3 className="pb-4">Consolidations</h3>
                  <span className="d-flex align-items-center gap-3">
                    <Image
                      unoptimized
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
                className="pt-2 pb-2 d-flex align-items-center justify-content-center"
              >
                <button
                  className={`${styles["addNewDelegationBtn"]}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_CONSOLIDATION)
                  }
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={styles["buttonIcon"]}
                  />
                  Consolidation
                </button>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Container
            className={`${styles["delegationCenterSection"]} pt-4 pb-4`}
          >
            <Row>
              <Col
                sm={12}
                md={9}
                className="pt-2 pb-2 d-flex align-items-center justify-content-between gap-2"
              >
                <span className="d-flex flex-column">
                  <h3 className="pb-4">Delegation Management</h3>
                  <span className="d-flex align-items-center gap-3">
                    <Image
                      unoptimized
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
                className="pt-2 pb-2 d-flex align-items-center justify-content-center"
              >
                <button
                  className={`${styles["addNewDelegationBtn"]}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_SUB_DELEGATION)
                  }
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={styles["buttonIcon"]}
                  />
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
