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

  const globalLockRead = useContractRead({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: "retrieveGloballockStatus",
    args: [accountResolution.address],
    watch: true,
    enabled: chainsMatch(),
  });

  const globalLockWriteConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [globalLockRead.data ? false : true],
    functionName: "setglobalLock",
    enabled: chainsMatch(),
  });
  const globalLockWrite = useContractWrite(globalLockWriteConfig.config);
  const waitGlobalLockWrite = useWaitForTransaction({
    confirmations: 1,
    hash: globalLockWrite.data?.hash,
  });

  useEffect(() => {
    if (globalLockWrite.error) {
      setToast({
        title: `${globalLockRead.data ? `Unlocking` : `Locking`} Wallet`,
        message: globalLockWrite.error.message,
      });
    }
    if (globalLockWrite.data) {
      if (globalLockWrite.data?.hash) {
        if (waitGlobalLockWrite.isLoading) {
          setToast({
            title: "Locking Wallet",
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      globalLockWrite.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a><br />Waiting for confirmation...`,
          });
        } else {
          setToast({
            title: "Locking Wallet",
            message: `Transaction Successful!
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      globalLockWrite.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a>`,
          });
        }
      }
    }
  }, [
    globalLockWrite.error,
    globalLockWrite.data,
    waitGlobalLockWrite.isLoading,
  ]);

  useEffect(() => {
    if (!showToast) {
      setToast(undefined);
      globalLockWrite.error = null;
    }
  }, [showToast]);

  function printWalletActions() {
    return (
      <Container>
        <Row>
          <Col>
            <h4>Actions</h4>
          </Col>
        </Row>
        <Row className="pt-2 pb-3">
          <Col>
            <>
              {/* <span className={styles.addNewDelegationBtn}>
                <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                Batch Delegations
              </span> */}
              {globalLockRead.data != null && (
                <span
                  className={styles.lockDelegationBtn}
                  onClick={() => {
                    setToast({
                      title: `${
                        globalLockRead.data ? `Unlocking` : `Locking`
                      } Wallet`,
                      message: "Confirm in your wallet...",
                    });
                    setShowToast(true);
                    globalLockWrite.write?.();
                  }}>
                  <FontAwesomeIcon
                    icon={globalLockRead.data ? "lock" : "lock-open"}
                    className={styles.buttonIcon}
                  />
                  {globalLockRead.data ? "Unlock" : "Lock"} Wallet
                  {(globalLockWrite.isLoading ||
                    waitGlobalLockWrite.isLoading) && (
                    <div className="d-inline">
                      <div
                        className={`spinner-border ${styles.loader}`}
                        role="status">
                        <span className="sr-only"></span>
                      </div>
                    </div>
                  )}
                </span>
              )}
            </>
          </Col>
        </Row>
      </Container>
    );
  }
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
                      <Row className="pt-4 pb-4">
                        <Col>{printWalletActions()}</Col>
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
