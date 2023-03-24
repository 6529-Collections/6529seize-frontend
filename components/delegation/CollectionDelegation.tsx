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
  Form,
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
import { Fragment, useEffect, useRef, useState } from "react";

import {
  DelegationCollection,
  DELEGATION_USE_CASES,
  MAX_BULK_ACTIONS,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { areEqualAddresses, getTransactionLink } from "../../helpers/Helpers";
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import ConnectWalletButton from "./ConnectWalletButton";

const NewDelegationComponent = dynamic(() => import("./NewDelegation"), {
  ssr: false,
});

interface Props {
  collection: DelegationCollection;
  date: Date;
}

function getReadParams(
  address: `0x${string}` | string | undefined,
  collection: `0x${string}` | string | undefined,
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
    });
  });
  return params;
}

function getActiveDelegationsReadParams(
  address: `0x${string}` | string | undefined,
  collection: `0x${string}` | string | undefined,
  date: Date,
  functionName: string
) {
  const params: any = [];

  DELEGATION_USE_CASES.map((uc) => {
    params.push({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: functionName,
      args: [address, collection, date.getTime(), uc.use_case],
    });
  });
  return params;
}

export default function CollectionDelegationComponent(props: Props) {
  const toastRef = useRef<HTMLDivElement>(null);
  const { address, connector, isConnected } = useAccount();
  const ensResolution = useEnsName({
    address: address,
  });

  const [bulkRevocations, setBulkRevocations] = useState<any[]>([]);
  const [showCreateNew, setShowCreateNew] = useState(false);

  const [lockUseCaseValue, setLockUseCaseValue] = useState(0);

  const outgoingDelegations = useContractReads({
    contracts: getReadParams(
      address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      "retrieveDelegationAddresses"
    ),
    watch: true,
  });

  const incomingDelegations = useContractReads({
    contracts: getReadParams(
      address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      "retrieveDelegators"
    ),
    watch: true,
  });

  const outgoingActiveDelegations = useContractReads({
    contracts: getActiveDelegationsReadParams(
      address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      props.date,
      "retrieveActiveDelegations"
    ),
    enabled: outgoingDelegations.data && outgoingDelegations.data?.length > 0,
  });

  const incomingActiveDelegations = useContractReads({
    contracts: getActiveDelegationsReadParams(
      address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      props.date,
      "retrieveActiveDelegators"
    ),
    enabled: incomingDelegations.data && incomingDelegations.data?.length > 0,
  });

  const useCaseLockStatuses = useContractReads({
    contracts: getReadParams(
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      address,
      "retrieveCollectionUseCaseLockStatus"
    ),
    watch: true,
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
    { title: string; message: string | undefined } | undefined
  >(undefined);
  const [showToast, setShowToast] = useState(false);

  const collectionLockRead = useContractRead({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: "retrieveCollectionLockStatus",
    args: [
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      address,
    ],
    watch: true,
  });

  const collectionLockWriteConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      collectionLockRead.data ? false : true,
    ],
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

  const useCaseLockWriteConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      lockUseCaseValue,
      useCaseLockStatuses.data && useCaseLockStatuses.data[lockUseCaseValue - 1]
        ? false
        : true,
    ],
    functionName: "setcollectionUsecaseLock",
    onError: (e) => {},
  });
  const useCaseLockWrite = useContractWrite(useCaseLockWriteConfig.config);
  const waitUseCaseLockWrite = useWaitForTransaction({
    confirmations: 1,
    hash: useCaseLockWrite.data?.hash,
  });

  useEffect(() => {
    useCaseLockStatuses.refetch();
  }, [waitUseCaseLockWrite.isSuccess]);

  useEffect(() => {
    if (contractWriteRevoke.error) {
      setRevokeDelegationParams(undefined);
      setToast({
        title: "Revoking Delegation Failed",
        message: contractWriteRevoke.error.message,
      });
    }
    if (contractWriteRevoke.data) {
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
          setRevokeDelegationParams(undefined);
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
            title: "Locking Collection",
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
            title: "Locking Collection",
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
      setLockUseCaseValue(0);
      useCaseLockWrite.reset();
      collectionLockWrite.reset();
      contractWriteRevoke.reset();
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
                                    delegations < 2 ||
                                    (bulkRevocations.length ==
                                      MAX_BULK_ACTIONS &&
                                      !bulkRevocations.some(
                                        (bd) =>
                                          bd.use_case == useCase.use_case &&
                                          areEqualAddresses(bd.wallet, w)
                                      ))
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
                              <td>
                                {w}{" "}
                                {outgoingActiveDelegations.data ? (
                                  <>
                                    {(
                                      outgoingActiveDelegations.data[
                                        useCase.use_case - 1
                                      ] as string[]
                                    ).includes(w) ? (
                                      <span
                                        className={
                                          styles.delegationActiveLabel
                                        }>
                                        active
                                      </span>
                                    ) : (
                                      <span
                                        className={
                                          styles.delegationExpiredLabel
                                        }>
                                        expired
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span
                                    className={styles.delegationFetchingLabel}>
                                    fetching status
                                  </span>
                                )}
                              </td>
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
                                      collection:
                                        props.collection.contract == "all"
                                          ? DELEGATION_ALL_ADDRESS
                                          : props.collection.contract,
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
                                  {(contractWriteRevoke.isLoading ||
                                    waitContractWriteRevoke.isLoading) &&
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
                {delegations > 1 && (
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
                                &bull; {w}{" "}
                                {incomingActiveDelegations.data ? (
                                  <>
                                    {(
                                      incomingActiveDelegations.data[
                                        useCase.use_case - 1
                                      ] as string[]
                                    ).includes(w) ? (
                                      <span
                                        className={
                                          styles.delegationActiveLabel
                                        }>
                                        active
                                      </span>
                                    ) : (
                                      <span
                                        className={
                                          styles.delegationExpiredLabel
                                        }>
                                        expired
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span
                                    className={styles.delegationFetchingLabel}>
                                    fetching status
                                  </span>
                                )}
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
        <Row className="pt-2 pb-2">
          <Col>
            <>
              <span
                className={styles.addNewDelegationBtn}
                onClick={() => setShowCreateNew(true)}>
                <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                Register Delegation
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
        <Row className="pt-3 pb-3">
          <Col xs={12} sm={12} md={4} lg={4}>
            <Form.Select
              className={`${styles.formInputLockUseCase}`}
              value={lockUseCaseValue}
              onChange={(e) => {
                setLockUseCaseValue(parseInt(e.target.value));
                useCaseLockWrite.reset();
              }}>
              <option value={0}>Select Use Case</option>
              {DELEGATION_USE_CASES.map((uc, index) => {
                return (
                  <option
                    key={`collection-delegation-select-use-case-${uc.use_case}`}
                    value={uc.use_case}>
                    #{uc.use_case} - {uc.display}
                    {useCaseLockStatuses.data &&
                    useCaseLockStatuses.data[index] == true
                      ? " - LOCKED"
                      : ` - UNLOCKED`}
                  </option>
                );
              })}
            </Form.Select>
          </Col>
          {lockUseCaseValue != 0 && (
            <Col xs={12} sm={12} md={3} lg={3}>
              <button
                className={`${styles.lockUseCaseBtn}`}
                onClick={() => {
                  useCaseLockWrite.write?.();
                }}>
                <FontAwesomeIcon
                  icon={
                    useCaseLockStatuses.data &&
                    useCaseLockStatuses.data[lockUseCaseValue - 1]
                      ? "lock"
                      : "lock-open"
                  }
                  className={styles.buttonIcon}
                />
                {useCaseLockStatuses.data &&
                useCaseLockStatuses.data[lockUseCaseValue - 1]
                  ? "Unlock"
                  : "Lock"}{" "}
                Use Case
                {(useCaseLockWrite.isLoading ||
                  waitUseCaseLockWrite.isLoading) && (
                  <div className="d-inline">
                    <div
                      className={`spinner-border ${styles.loader}`}
                      role="status">
                      <span className="sr-only"></span>
                    </div>
                  </div>
                )}
              </button>
            </Col>
          )}
          <Col xs={12} sm={12} md={5} lg={5}>
            {useCaseLockWrite.isLoading && (
              <span className="d-block pt-2">Confirm in your wallet...</span>
            )}
            {useCaseLockWrite.error && (
              <>
                <span className="d-block pt-2">
                  {useCaseLockWrite.error.message}
                </span>
                <a
                  href={""}
                  onClick={(e) => {
                    e.preventDefault();
                    useCaseLockWrite.reset();
                  }}
                  className={styles.etherscanLink}>
                  clear
                </a>
              </>
            )}
            {useCaseLockWrite.data && (
              <>
                <span className="d-block pt-2">
                  Transaction{" "}
                  {waitUseCaseLockWrite.isLoading
                    ? `Submitted`
                    : waitUseCaseLockWrite.data
                    ? `Successful!`
                    : `Failed`}
                  &nbsp;&nbsp;
                  <a
                    href={getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      useCaseLockWrite.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.etherscanLink}>
                    view
                  </a>
                  &nbsp;&nbsp;
                  <a
                    href={""}
                    onClick={(e) => {
                      e.preventDefault();
                      useCaseLockWrite.reset();
                    }}
                    className={styles.etherscanLink}>
                    clear
                  </a>
                </span>
                {waitUseCaseLockWrite.isLoading && (
                  <span className="d-block pt-2">
                    Waiting for Confirmation...
                  </span>
                )}
                {waitUseCaseLockWrite.error && (
                  <span className="d-block pt-2">
                    {waitUseCaseLockWrite.error.message}
                  </span>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    );
  }

  function printSubDelegationActions() {
    const hasSubDelegations =
      incomingDelegations.data &&
      (incomingDelegations.data as any)[15] &&
      (incomingDelegations.data as any)[15].length > 0;
    if (hasSubDelegations) {
      return (
        <Container className="pt-2 pb-5">
          <Row className="pt-5 pb-2">
            <Col>
              <h4>Sub-Delegation Actions</h4>
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
                <span className={styles.revokeDelegationBtn}>
                  <FontAwesomeIcon icon="minus" className={styles.buttonIcon} />
                  Revoke Delegation
                </span>
              </>
            </Col>
          </Row>
        </Container>
      );
    }
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
                  {printSubDelegationActions()}
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
          {!isConnected && <ConnectWalletButton />}
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
