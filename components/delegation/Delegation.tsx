import styles from "./Delegation.module.scss";
import { Container, Row, Col, ToastContainer, Toast } from "react-bootstrap";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useEnsName,
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { getTransactionLink } from "../../helpers/Helpers";
import { useState, useEffect } from "react";
import Image from "next/image";

import { SUPPORTED_COLLECTIONS } from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { DELEGATION_CONTRACT } from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import { sepolia } from "wagmi/chains";

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
  });

  const [toast, setToast] = useState<
    { title: string; message: string } | undefined
  >(undefined);
  const [showToast, setShowToast] = useState(false);

  function chainsMatch() {
    return networkResolution.chain?.id == DELEGATION_CONTRACT.chain_id;
  }

  useEffect(() => {
    if (!showToast) {
      setToast(undefined);
    }
  }, [showToast]);

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
              xs={6}
              xm={6}
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
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        )}
      {toast && (
        <ToastContainer position={"top-center"} className={styles.toast}>
          <Toast onClose={() => setShowToast(false)} show={showToast}>
            <Toast.Header>
              <strong className="me-auto">{toast.title}</strong>
            </Toast.Header>
            <Toast.Body
              dangerouslySetInnerHTML={{
                __html: toast.message,
              }}></Toast.Body>
          </Toast>
        </ToastContainer>
      )}
    </Container>
  );
}
