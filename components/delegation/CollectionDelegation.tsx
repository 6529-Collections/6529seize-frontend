import styles from "./Delegation.module.scss";
import {
  Container,
  Row,
  Col,
  Accordion,
  Table,
  FormCheck,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import {
  useAccount,
  useConnect,
  useContractRead,
  useContractReads,
  useContractWrite,
  useEnsName,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { Fragment, useEffect, useState } from "react";

import {
  DelegationCollection,
  DELEGATION_USE_CASES,
  MAX_BULK_ACTIONS,
} from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { areEqualAddresses, getTransactionLink } from "../../helpers/Helpers";
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { DELEGATION_ABI } from "../../abis";

const NewDelegationComponent = dynamic(() => import("./NewDelegation"), {
  ssr: false,
});

interface Props {
  collection: DelegationCollection;
}

function getReadParams(
  address: `0x${string}` | undefined,
  collection: string,
  functionName: string
) {
  const params: any = [];
  DELEGATION_USE_CASES.map((uc) => {
    params.push({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: functionName,
      args: [address, collection, uc.use_case],
      watch: true,
    });
  });
  return params;
}

export default function CollectionDelegationComponent(props: Props) {
  const { address, connector, isConnected } = useAccount();
  const connectResolution = useConnect();
  const ensResolution = useEnsName({
    address: address,
  });

  const [bulkRevocations, setBulkRevocations] = useState<any[]>([]);
  const [showCreateNew, setShowCreateNew] = useState(false);

  const outgoingDelegations = useContractReads({
    contracts: getReadParams(
      address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      "retrieveDelegationAddresses"
    ),
  });

  const incomingDelegations = useContractReads({
    contracts: getReadParams(
      address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      "retrieveDelegators"
    ),
  });

  const [revokeDelegationParams, setRevokeDelegationParams] = useState<any>();

  const contractWriteRevokeConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      revokeDelegationParams && revokeDelegationParams.collection,
      revokeDelegationParams && revokeDelegationParams.address,
      revokeDelegationParams && revokeDelegationParams.use_case,
    ],
    functionName: revokeDelegationParams
      ? "revokeDelegationAddress"
      : undefined,
    onError: (e) => {},
  });
  const contractWriteRevoke = useContractWrite(
    contractWriteRevokeConfig.config
  );
  const waitContractWriteRevoke = useWaitForTransaction({
    confirmations: 1,
    hash: contractWriteRevoke.data?.hash,
  });

  const [toast, setToast] = useState<
    { title: string; message: string } | undefined
  >(undefined);
  const [showToast, setShowToast] = useState(false);

  const collectionLockRead = useContractRead({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: "retrieveCollectionLockStatus",
    args: [props.collection.contract, address],
    watch: true,
  });

  console.log(collectionLockRead);

  const collectionLockWriteConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [props.collection.contract, collectionLockRead.data ? false : true],
    functionName: "setcollectionLock",
    onError: (e) => {},
  });
  const collectionLockWrite = useContractWrite(
    collectionLockWriteConfig.config
  );
  const waitCollectionLockWrite = useWaitForTransaction({
    confirmations: 1,
    hash: collectionLockWrite.data?.hash,
  });

  useEffect(() => {
    if (contractWriteRevoke.error) {
      setRevokeDelegationParams(undefined);
      setToast({
        title: "Revoking Delegation Failed",
        message: contractWriteRevoke.error.message,
      });
    }
    if (contractWriteRevoke.data) {
      setRevokeDelegationParams(undefined);
      if (contractWriteRevoke.data?.hash) {
        if (waitContractWriteRevoke.isLoading) {
          setToast({
            title: "Revoking Delegation",
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteRevoke.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a><br />Waiting for confirmation...`,
          });
        } else {
          setToast({
            title: "Revoking Delegation",
            message: `Transaction Successful!
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteRevoke.data.hash
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
    contractWriteRevoke.error,
    contractWriteRevoke.data,
    waitContractWriteRevoke.isLoading,
  ]);

  useEffect(() => {
    if (collectionLockWrite.error) {
      setToast({
        title: `${collectionLockRead.data ? `Unlocking` : `Locking`} Wallet`,
        message: collectionLockWrite.error.message,
      });
    }
    if (collectionLockWrite.data) {
      if (collectionLockWrite.data?.hash) {
        if (waitCollectionLockWrite.isLoading) {
          setToast({
            title: "Locking Wallet",
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      collectionLockWrite.data.hash
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
                      collectionLockWrite.data.hash
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
    collectionLockWrite.error,
    collectionLockWrite.data,
    waitCollectionLockWrite.isLoading,
  ]);

  useEffect(() => {
    if (!showToast) {
      setToast(undefined);
    }
  }, [showToast]);

  useEffect(() => {
    if (revokeDelegationParams) {
      contractWriteRevoke.write?.();
    }
  }, [revokeDelegationParams]);

  function printDelegations() {
    return (
      <Accordion className={styles.collectionDelegationsAccordion}>
        <Accordion.Item
          className={styles.collectionDelegationsAccordionItem}
          eventKey={"0"}>
          <Accordion.Header>Outgoing Delegations</Accordion.Header>
          <Accordion.Body>{printOutgoingDelegations()}</Accordion.Body>
        </Accordion.Item>
        <Accordion.Item
          className={`${styles.collectionDelegationsAccordionItem} mt-4`}
          eventKey={"1"}>
          <Accordion.Header>Incoming Delegations</Accordion.Header>
          <Accordion.Body>{printIncomingDelegations()}</Accordion.Body>
        </Accordion.Item>
      </Accordion>
    );
  }

  function printOutgoingDelegations() {
    let delegations: number = 0;
    if (outgoingDelegations.data) {
      outgoingDelegations.data.map((data: any) => {
        if (data) {
          delegations += data.length;
        }
      });
    }

    return (
      <Container className="no-padding">
        <Row className={styles.delegationsTableScrollContainer}>
          <Col className="pt-2 pb-3">
            <Table className={styles.delegationsTable}>
              <tbody>
                {delegations > 0 ? (
                  outgoingDelegations.data!.map((data: any, index) => {
                    if (data.length > 0) {
                      const useCase = DELEGATION_USE_CASES[index];
                      return (
                        <Fragment key={`outgoing-${useCase}-${index}`}>
                          <tr>
                            <td
                              colSpan={4}
                              className={styles.delegationsTableUseCaseHeader}>
                              #{useCase.use_case} - {useCase.display}
                            </td>
                          </tr>
                          {data.map((w: string) => (
                            <tr key={`outgoing-${useCase}-${index}-${w}`}>
                              <td>
                                <FormCheck
                                  disabled={
                                    bulkRevocations.length ==
                                      MAX_BULK_ACTIONS &&
                                    !bulkRevocations.some(
                                      (bd) =>
                                        bd.use_case == useCase.use_case &&
                                        areEqualAddresses(bd.wallet, w)
                                    )
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setBulkRevocations((bd) => [
                                        ...bd,
                                        {
                                          use_case: useCase.use_case,
                                          wallet: w,
                                        },
                                      ]);
                                    } else {
                                      setBulkRevocations((bd) =>
                                        bd.filter(
                                          (x) =>
                                            !(
                                              x.use_case == useCase.use_case &&
                                              areEqualAddresses(x.wallet, w)
                                            )
                                        )
                                      );
                                    }
                                  }}
                                />
                              </td>
                              <td>{w}</td>
                              <td className="text-right">
                                <span
                                  className={styles.useCaseWalletUpdate}
                                  onClick={() =>
                                    alert(
                                      `\nupdating delegation... \n\ndelegator: ${address}\nuse case: ${useCase.use_case}\naddress: ${w} `
                                    )
                                  }>
                                  Update
                                </span>
                              </td>
                              <td>
                                <span
                                  className={styles.useCaseWalletRevoke}
                                  onClick={() => {
                                    setRevokeDelegationParams({
                                      collection: props.collection.contract,
                                      address: w,
                                      use_case: useCase.use_case,
                                    });
                                    setToast({
                                      title: "Revoking Delegation",
                                      message: "Confirm in your wallet...",
                                    });
                                    setShowToast(true);
                                  }}>
                                  Revoke
                                  {contractWriteRevoke.isLoading &&
                                    areEqualAddresses(
                                      revokeDelegationParams.address,
                                      w
                                    ) &&
                                    revokeDelegationParams.use_case ==
                                      useCase.use_case && (
                                      <div className="d-inline">
                                        <div
                                          className={`spinner-border ${styles.loader}`}
                                          role="status">
                                          <span className="sr-only"></span>
                                        </div>
                                      </div>
                                    )}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    }
                  })
                ) : outgoingDelegations.isLoading ? (
                  <tr>
                    <td colSpan={4}>Fetching outgoing delegations</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4}>No outgoing delegations found</td>
                  </tr>
                )}
                {delegations > 0 && (
                  <>
                    <tr>
                      <td colSpan={4} className="pt-3">
                        selected:{" "}
                        {bulkRevocations.length == 5
                          ? `5 (max)`
                          : bulkRevocations.length}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4}>
                        <span
                          className={`${styles.useCaseWalletRevoke} ${
                            bulkRevocations.length < 2
                              ? `${styles.useCaseWalletRevokeDisabled}`
                              : ``
                          }`}
                          onClick={() =>
                            alert(
                              `\nrevoking delegation... \n\ndelegator: ${address}\nuse case: `
                            )
                          }>
                          Bulk Revoke
                        </span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }

  function printIncomingDelegations() {
    let delegations: number = 0;
    if (incomingDelegations.data) {
      incomingDelegations.data.map((data: any) => {
        if (data) {
          delegations += data.length;
        }
      });
    }

    return (
      <Container className="no-padding">
        <Row className={styles.delegationsTableScrollContainer}>
          <Col className="pt-2 pb-3">
            <Table className={styles.delegationsTable}>
              <tbody>
                {delegations > 0 ? (
                  incomingDelegations.data!.map((data: any, index) => {
                    if (data.length > 0) {
                      const useCase = DELEGATION_USE_CASES[index];
                      return (
                        <Fragment key={`incoming-${useCase}-${index}`}>
                          <tr>
                            <td
                              colSpan={4}
                              className={styles.delegationsTableUseCaseHeader}>
                              #{useCase.use_case} - {useCase.display}
                            </td>
                          </tr>
                          {data.map((w: string) => (
                            <tr key={`incoming-${useCase}-${index}-${w}`}>
                              <td className={styles.incomingDelegationAddress}>
                                &bull; {w}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    }
                  })
                ) : incomingDelegations.isLoading ? (
                  <tr>
                    <td colSpan={4}>Fetching incoming delegations</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4}>No incoming delegations found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }

  function printActions() {
    return (
      <Container>
        <Row className="pt-5 pb-2">
          <Col>
            <h4>Actions</h4>
          </Col>
        </Row>
        <Row className="pt-2 pb-3">
          <Col>
            <>
              <span
                className={styles.addNewDelegationBtn}
                onClick={() => setShowCreateNew(true)}>
                <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                Register Delegation
              </span>
              <span
                className={styles.addNewDelegationBtn}
                onClick={() => setShowCreateNew(true)}>
                <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                Register Delegation with Sub-delegation Rights
              </span>
              <span className={styles.lockDelegationBtn}>
                <FontAwesomeIcon
                  icon="lock-open"
                  className={styles.buttonIcon}
                />
                Lock Use Case
              </span>
              {collectionLockRead.data != null && (
                <span
                  className={styles.lockDelegationBtn}
                  onClick={() => {
                    setToast({
                      title: `${
                        collectionLockRead.data ? `Unlocking` : `Locking`
                      } Collection`,
                      message: "Confirm in your wallet...",
                    });
                    setShowToast(true);
                    collectionLockWrite.write?.();
                  }}>
                  <FontAwesomeIcon
                    icon={collectionLockRead.data ? "lock" : "lock-open"}
                    className={styles.buttonIcon}
                  />
                  {collectionLockRead.data ? "Unlock" : "Lock"} Collection
                  {(collectionLockWrite.isLoading ||
                    waitCollectionLockWrite.isLoading) && (
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

  function printConnect() {
    return (
      <Container className={styles.mainContainer}>
        <Row className="pt-5 pb-3">
          <Col className="text-center">
            <h3 className="float-none">Connect your wallet</h3>
          </Col>
        </Row>
        <Row className="pt-5">
          {connectResolution.connectors.map((connector) => (
            <Col
              key={`${connector.name}`}
              xs={12}
              xm={12}
              md={4}
              className="pt-3 pb-3 d-flex justify-content-center">
              <div
                className={styles.connectBtn}
                onClick={() => {
                  if (connector.ready) {
                    connectResolution.connect({ connector });
                  } else if (connector.name == "MetaMask") {
                    window.open("https://metamask.io/download/", "_blank");
                  }
                }}>
                {connector.name}
              </div>
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
          {isConnected && address && props.collection && (
            <Container className="pt-3 -b-3">
              <Row className="pt-2 pb-2">
                <Col>
                  <h1>{props.collection.display.toUpperCase()} DELEGATIONS</h1>
                </Col>
              </Row>
              {!showCreateNew && (
                <>
                  {printDelegations()}
                  {printActions()}
                </>
              )}
              {showCreateNew && (
                <NewDelegationComponent
                  collection={props.collection}
                  address={address}
                  ens={ensResolution.data}
                  showAddMore={true}
                  showCancel={true}
                  onHide={() => setShowCreateNew(false)}
                />
              )}
            </Container>
          )}
          {!isConnected && printConnect()}
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
