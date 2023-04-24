import styles from "./Delegation.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useAccount } from "wagmi";
import { areEqualAddresses } from "../../helpers/Helpers";
import Image from "next/image";
import { useWeb3Modal } from "@web3modal/react";

import { SUPPORTED_COLLECTIONS } from "../../pages/delegation/[...section]";
import {
  DELEGATION_ALL_ADDRESS,
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { DelegationCenterSection } from "./DelegationCenterMenu";

interface Props {
  setSection(section: DelegationCenterSection): any;
}

export default function DelegationCenterComponent(props: Props) {
  const [redirect, setRedirect] = useState<DelegationCenterSection>();
  const accountResolution = useAccount();
  const web3Modal = useWeb3Modal();

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
    if (!web3Modal.isOpen) {
      if (openConnect) {
        if (accountResolution.isConnected && redirect) {
          props.setSection(redirect);
        }
      }
      setRedirect(undefined);
    }
  }, [web3Modal.isOpen]);

  function printCollectionSelection() {
    return (
      <Container className="no-padding">
        <Row className="pt-4 pb-4">
          <Col>
            <h4>Delegations/Consolidations by Collection</h4>
          </Col>
        </Row>
        <Row>
          {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
            <Col
              key={c.contract}
              xs={12}
              sm={12}
              md={6}
              lg={6}
              className={styles.collectionSelectionWrapper}>
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
                    xs={5}
                    className="d-flex align-items-center justify-content-start">
                    <h5 className="font-color mb-0">{c.title}</h5>
                  </Col>
                  <Col
                    xs={4}
                    className="no-padding d-flex align-items-center justify-content-end">
                    <span
                      className={`${styles.viewManageBtn}`}
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
                      View/Manage
                    </span>
                  </Col>
                </Row>
              </Container>
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
          <h1>DELEGATION CENTER</h1>
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={12} md={6} lg={6} className="pt-2 pb-3">
          <Container className={`${styles.delegationCenterSection} pt-4 pb-4`}>
            <Row>
              <Col className="text-center">
                <Image
                  loading="eager"
                  priority
                  src="/delegation-icon.png"
                  alt="delegation"
                  width={75}
                  height={75}
                />
              </Col>
            </Row>
            <Row className="pt-3 pb-3">
              <Col>
                <h3 className="text-center float-none mb-0">Delegation</h3>
              </Col>
            </Row>
            <Row>
              <Col>
                <ul>
                  <li>
                    Mint with your hot wallet on behalf of your vault wallet
                  </li>
                  <li>Eliminate manual wallet mapping</li>
                  <li>Increase your wallet security</li>
                </ul>
              </Col>
            </Row>
            <Row>
              <Col className={`${styles.addNewDelegationWrapper}`}>
                <span
                  className={`${styles.addNewDelegationBtn}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_DELEGATION)
                  }>
                  <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                  Register Delegation
                </span>
                <span
                  className={`${styles.addNewDelegationBtn} ml-2`}
                  onClick={() => {
                    setRedirect(
                      DelegationCenterSection.REGISTER_SUB_DELEGATION
                    );
                  }}>
                  <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                  Register Sub-Delegation
                </span>
              </Col>
            </Row>
          </Container>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} className="pt-2 pb-3">
          <Container className={`${styles.delegationCenterSection} pt-4 pb-4`}>
            <Row>
              <Col className="text-center">
                <Image
                  loading="eager"
                  priority
                  src="/consolidation-icon.png"
                  alt="consolidation"
                  width={75}
                  height={75}
                />
              </Col>
            </Row>
            <Row className="pt-3 pb-3">
              <Col>
                <h3 className="text-center float-none mb-0">Consolidation</h3>
              </Col>
            </Row>
            <Row>
              <Col>
                <ul>
                  <li>
                    Use up to 3 wallets to manage your 6529 Collections NFTs
                  </li>
                  <li>Transfer NFTs between wallets without losing TDH</li>
                </ul>
              </Col>
            </Row>
            <Row>
              <Col className={`${styles.addNewDelegationWrapper}`}>
                <span
                  className={`${styles.addNewDelegationBtn} ml-2`}
                  onClick={() => {
                    setRedirect(DelegationCenterSection.REGISTER_CONSOLIDATION);
                  }}>
                  <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                  Register Consolidation
                </span>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row>
        <Col>{printCollectionSelection()}</Col>
      </Row>
    </Container>
  );
}
