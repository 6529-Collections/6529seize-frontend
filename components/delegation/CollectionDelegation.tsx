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
  useContractRead,
  useContractReads,
  useContractWrite,
  useEnsName,
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { Fragment, useEffect, useRef, useState } from "react";

import {
  CONSOLIDATION_USE_CASE,
  DelegationCollection,
  DELEGATION_USE_CASES,
  MAX_BULK_ACTIONS,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { areEqualAddresses, getTransactionLink } from "../../helpers/Helpers";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
  NULL_ADDRESS,
} from "../../constants";
import { DELEGATION_ABI } from "../../abis";

const ConnectWalletButton = dynamic(() => import("./ConnectWalletButton"), {
  ssr: false,
});

const SwitchNetworkButton = dynamic(() => import("./SwitchNetworkButton"), {
  ssr: false,
});

const NewDelegationComponent = dynamic(() => import("./NewDelegation"), {
  ssr: false,
});

const UpdateDelegationComponent = dynamic(() => import("./UpdateDelegation"), {
  ssr: false,
});

const NewDelegationWithSubComponent = dynamic(
  () => import("./NewDelegationWithSub"),
  {
    ssr: false,
  }
);

const RevokeDelegationWithSubComponent = dynamic(
  () => import("./RevokeDelegationWithSub"),
  {
    ssr: false,
  }
);

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
      args: [address, collection, uc.use_case],
    });
  });
  return params;
}

export default function CollectionDelegationComponent(props: Props) {
  const [currentDate, setCurrentDate] = useState<Date>(props.date);
  const toastRef = useRef<HTMLDivElement>(null);
  const accountResolution = useAccount();
  const networkResolution = useNetwork();
  const ensResolution = useEnsName({
    address: accountResolution.address,
  });

  const [bulkRevocations, setBulkRevocations] = useState<any[]>([]);
  const [showCreateNewDelegation, setShowCreateNewDelegation] = useState(false);
  const [showUpdateDelegation, setShowUpdateDelegation] = useState(false);
  const [showCreateNewDelegationWithSub, setShowCreateNewDelegationWithSub] =
    useState(false);
  const [showRevokeDelegationWithSub, setShowRevokeDelegationWithSub] =
    useState(false);

  const [updateDelegationParams, setUpdateDelegationParams] = useState<
    { wallet: string; use_case: number; display: string } | undefined
  >();

  const [lockUseCaseValue, setLockUseCaseValue] = useState(0);
  const [incomingSubdelegations, setIncomingSubdelegations] = useState<any[]>(
    []
  );

  function chainsMatch() {
    return networkResolution.chain?.id == DELEGATION_CONTRACT.chain_id;
  }

  const outgoingDelegations = useContractReads({
    contracts: getReadParams(
      accountResolution.address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      "retrieveDelegationAddresses"
    ),
    enabled: chainsMatch() && accountResolution.isConnected,
    watch: true,
  });

  const incomingDelegations = useContractReads({
    contracts: getReadParams(
      accountResolution.address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      "retrieveDelegators"
    ),
    enabled: chainsMatch() && accountResolution.isConnected,
    watch: true,
    onSettled(data, error) {
      if (data) {
        const subdelegations = (data as any)[15];
        setIncomingSubdelegations(subdelegations);
      }
    },
  });

  const outgoingActiveDelegations = useContractReads({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      currentDate,
      "retrieveDelegationAddressesTokensIDsandExpiredDates"
    ),
    watch: true,
    enabled:
      chainsMatch() &&
      accountResolution.isConnected &&
      outgoingDelegations.data &&
      outgoingDelegations.data?.length > 0,
  });

  const incomingActiveDelegations = useContractReads({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address,
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      currentDate,
      "retrieveDelegatorsTokensIDsandExpiredDates"
    ),
    watch: true,
    enabled:
      chainsMatch() &&
      accountResolution.isConnected &&
      incomingDelegations.data &&
      incomingDelegations.data?.length > 0,
  });

  const useCaseLockStatuses = useContractReads({
    contracts: getReadParams(
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      accountResolution.address,
      "retrieveCollectionUseCaseLockStatus"
    ),
    enabled: chainsMatch() && accountResolution.isConnected,
    watch: true,
  });

  const [revokeDelegationParams, setRevokeDelegationParams] = useState<any>();
  const [batchRevokeDelegationParams, setBatchRevokeDelegationParams] =
    useState<any>();

  const contractWriteRevokeConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      revokeDelegationParams ? revokeDelegationParams.collection : NULL_ADDRESS,
      revokeDelegationParams ? revokeDelegationParams.address : NULL_ADDRESS,
      revokeDelegationParams ? revokeDelegationParams.use_case : 0,
    ],
    enabled: chainsMatch(),
    functionName: "revokeDelegationAddress",
  });
  const contractWriteRevoke = useContractWrite(
    contractWriteRevokeConfig.config
  );
  const waitContractWriteRevoke = useWaitForTransaction({
    confirmations: 1,
    hash: contractWriteRevoke.data?.hash,
  });

  const contractWriteBatchRevokeConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      batchRevokeDelegationParams && batchRevokeDelegationParams.collections,
      batchRevokeDelegationParams && batchRevokeDelegationParams.addresses,
      batchRevokeDelegationParams && batchRevokeDelegationParams.use_cases,
    ],
    enabled: chainsMatch(),
    functionName: batchRevokeDelegationParams ? "batchRevocations" : undefined,
  });
  const contractWriteBatchRevoke = useContractWrite(
    contractWriteBatchRevokeConfig.config
  );
  const waitContractWriteBatchRevoke = useWaitForTransaction({
    confirmations: 1,
    hash: contractWriteBatchRevoke.data?.hash,
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
      accountResolution.address,
    ],
    enabled: chainsMatch() && accountResolution.isConnected,
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
    enabled: chainsMatch(),
    functionName: "setCollectionLock",
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
    enabled: chainsMatch(),
    functionName: "setCollectionUsecaseLock",
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
    if (contractWriteBatchRevoke.error) {
      setToast({
        title: "Revoking Delegations Failed",
        message: contractWriteBatchRevoke.error.message,
      });
    }
    if (contractWriteBatchRevoke.data) {
      if (contractWriteBatchRevoke.data?.hash) {
        if (waitContractWriteBatchRevoke.isLoading) {
          setToast({
            title: "Batch Revoking Delegations",
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteBatchRevoke.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a><br />Waiting for confirmation...`,
          });
        } else {
          setToast({
            title: "Batch Revoking Delegations",
            message: `Transaction Successful!
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteBatchRevoke.data.hash
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
    contractWriteBatchRevoke.error,
    contractWriteBatchRevoke.data,
    waitContractWriteBatchRevoke.isLoading,
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
    const useCase = DELEGATION_USE_CASES[lockUseCaseValue - 1];
    const title = `${
      useCaseLockStatuses.data && useCaseLockStatuses.data[lockUseCaseValue - 1]
        ? "Unlocking"
        : "Locking"
    } Use Case #${useCase?.use_case} - ${useCase?.display}`;

    if (useCaseLockWrite.error) {
      setToast({
        title: title,
        message: useCaseLockWrite.error.message,
      });
    }
    if (useCaseLockWrite.data) {
      if (useCaseLockWrite.data?.hash) {
        if (waitUseCaseLockWrite.isLoading) {
          setToast({
            title: title,
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      useCaseLockWrite.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a><br />Waiting for confirmation...`,
          });
        } else {
          setToast({
            title: title,
            message: `Transaction Successful!
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      useCaseLockWrite.data.hash
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
    useCaseLockWrite.error,
    useCaseLockWrite.data,
    waitUseCaseLockWrite.isLoading,
  ]);

  useEffect(() => {
    if (!showToast) {
      setRevokeDelegationParams(undefined);
      setBatchRevokeDelegationParams(undefined);
      setToast(undefined);
      setLockUseCaseValue(0);
      useCaseLockWrite.reset();
      collectionLockWrite.reset();
      contractWriteRevoke.reset();
    }
  }, [showToast]);

  useEffect(() => {
    if (
      revokeDelegationParams &&
      !revokeDelegationParams.loading &&
      contractWriteRevoke.write
    ) {
      setRevokeDelegationParams({ ...revokeDelegationParams, loading: true });
      contractWriteRevoke.write();
    }
  }, [revokeDelegationParams, contractWriteRevoke.write]);

  useEffect(() => {
    if (
      batchRevokeDelegationParams &&
      !batchRevokeDelegationParams.loading &&
      contractWriteBatchRevoke.write
    ) {
      setBatchRevokeDelegationParams({
        ...batchRevokeDelegationParams,
        loading: true,
      });
      contractWriteBatchRevoke.write();
    }
  }, [batchRevokeDelegationParams, contractWriteBatchRevoke.write]);

  function formatExpiry(myDate: number) {
    const date = new Date(myDate * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getActiveStatus(delegations: any, w: string, useCaseIndex: number) {
    if (delegations.data) {
      const myCase = delegations.data[useCaseIndex] as any[];
      const index = myCase[0].indexOf(w);
      if (index > -1) {
        const myDate = myCase[1][0].toNumber();
        const myDateDisplay =
          myDate >= NEVER_DATE
            ? `active`
            : `active - expires ${formatExpiry(myDate)}`;
        const active = {
          expiry: myDateDisplay,
          all: myCase[2][index],
          tokens: myCase[3][index].toNumber(),
        };
        return active;
      }
    }
    return false;
  }

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
          <Col className="pb-3">
            <Table className={styles.delegationsTable}>
              <tbody>
                {delegations > 0 ? (
                  outgoingDelegations.data!.map((data: any, index: number) => {
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
                          {data.map((w: string) => {
                            const isActive = getActiveStatus(
                              outgoingActiveDelegations,
                              w,
                              index
                            );
                            return (
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
                                                x.use_case ==
                                                  useCase.use_case &&
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
                                      {isActive ? (
                                        <span
                                          className={
                                            styles.delegationActiveLabel
                                          }>
                                          {isActive.expiry}
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
                                      className={
                                        styles.delegationFetchingLabel
                                      }>
                                      fetching status
                                    </span>
                                  )}
                                  {useCase.use_case == CONSOLIDATION_USE_CASE &&
                                    (incomingDelegations.data &&
                                    (
                                      incomingDelegations.data as any[]
                                    )[16].includes(w) ? (
                                      <span
                                        className={
                                          styles.consolidationActiveLabel
                                        }>
                                        consolidation active
                                      </span>
                                    ) : (
                                      <span
                                        className={
                                          styles.consolidationNotAcceptedLabel
                                        }>
                                        consolidation pending
                                      </span>
                                    ))}
                                </td>
                                <td className="text-right">
                                  <span
                                    className={styles.useCaseWalletUpdate}
                                    onClick={() => {
                                      setUpdateDelegationParams({
                                        wallet: w,
                                        use_case: useCase.use_case,
                                        display: useCase.display,
                                      });
                                      setShowUpdateDelegation(true);
                                      window.scrollTo(0, 0);
                                    }}>
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
                            );
                          })}
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
                      <td colSpan={4} className="pt-5">
                        selected:{" "}
                        {bulkRevocations.length == MAX_BULK_ACTIONS
                          ? `${MAX_BULK_ACTIONS} (max)`
                          : bulkRevocations.length}
                        &nbsp;&nbsp;
                        <span
                          className={`${styles.useCaseWalletRevoke} ${
                            bulkRevocations.length < 2
                              ? `${styles.useCaseWalletRevokeDisabled}`
                              : ``
                          }`}
                          onClick={() => {
                            setBatchRevokeDelegationParams({
                              collections: [...bulkRevocations].map((br) =>
                                props.collection.contract == "all"
                                  ? DELEGATION_ALL_ADDRESS
                                  : props.collection.contract
                              ),
                              addresses: [...bulkRevocations].map(
                                (br) => br.wallet
                              ),
                              use_cases: [...bulkRevocations].map(
                                (br) => br.use_case
                              ),
                            });
                            setToast({
                              title: "Batch Revoking Delegations",
                              message: "Confirm in your wallet...",
                            });
                            setShowToast(true);
                          }}>
                          Batch Revoke
                          {(contractWriteBatchRevoke.isLoading ||
                            waitContractWriteBatchRevoke.isLoading) && (
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
          <Col className="pb-3">
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
                          {data.map((w: string) => {
                            const isActive = getActiveStatus(
                              incomingActiveDelegations,
                              w,
                              index
                            );
                            return (
                              <tr key={`incoming-${useCase}-${index}-${w}`}>
                                <td
                                  className={styles.incomingDelegationAddress}>
                                  &bull; {w}{" "}
                                  {incomingActiveDelegations.data ? (
                                    <>
                                      {isActive ? (
                                        <span
                                          className={
                                            styles.delegationActiveLabel
                                          }>
                                          {isActive.expiry}
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
                                      className={
                                        styles.delegationFetchingLabel
                                      }>
                                      fetching status
                                    </span>
                                  )}
                                  {useCase.use_case == CONSOLIDATION_USE_CASE &&
                                    (outgoingDelegations.data &&
                                    (
                                      outgoingDelegations.data as any[]
                                    )[16].includes(w) ? (
                                      <span
                                        className={
                                          styles.consolidationActiveLabel
                                        }>
                                        consolidation active
                                      </span>
                                    ) : (
                                      <span
                                        className={
                                          styles.delegationExpiredLabel
                                        }>
                                        consolidation pending
                                      </span>
                                    ))}
                                </td>
                              </tr>
                            );
                          })}
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
                onClick={() => {
                  setShowCreateNewDelegation(true);
                  window.scrollTo(0, 0);
                }}>
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
          <Col xs={12} sm={12} md={4} lg={4} className="pt-2 pb-2">
            <Form.Select
              className={`${styles.formInputLockUseCase}`}
              value={lockUseCaseValue}
              onChange={(e) => {
                setLockUseCaseValue(parseInt(e.target.value));
                useCaseLockWrite.reset();
              }}>
              <option value={0}>Select Use Case to lock/unlock</option>
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
            <Col xs={12} sm={12} md={8} lg={8} className="pt-2 pb-2">
              <button
                className={`${styles.lockUseCaseBtn}`}
                onClick={() => {
                  const useCase = DELEGATION_USE_CASES[lockUseCaseValue - 1];
                  setToast({
                    title: `${
                      useCaseLockStatuses.data &&
                      useCaseLockStatuses.data[lockUseCaseValue - 1]
                        ? "Unlocking"
                        : "Locking"
                    } Use Case #${useCase.use_case} - ${useCase.display}`,
                    message: "Confirm in your wallet...",
                  });
                  setShowToast(true);
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
        </Row>
      </Container>
    );
  }

  function printSubDelegationActions() {
    if (incomingSubdelegations.length > 0) {
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
                  onClick={() => {
                    setShowCreateNewDelegationWithSub(true);
                    window.scrollTo(0, 0);
                  }}>
                  <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
                  Register Delegation
                </span>
                <span
                  className={styles.revokeDelegationBtn}
                  onClick={() => {
                    setShowRevokeDelegationWithSub(true);
                    window.scrollTo(0, 0);
                  }}>
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
          {accountResolution.isConnected &&
            accountResolution.address &&
            DELEGATION_CONTRACT.chain_id == networkResolution.chain?.id &&
            props.collection && (
              <Container className="pt-3 -b-3">
                <Row className="pt-2 pb-2">
                  <Col>
                    <h1>
                      {props.collection.display.toUpperCase()} DELEGATIONS
                    </h1>
                  </Col>
                </Row>
                {!showCreateNewDelegation &&
                  !showUpdateDelegation &&
                  !showCreateNewDelegationWithSub &&
                  !showRevokeDelegationWithSub && (
                    <>
                      {printDelegations()}
                      {printActions()}
                      {printSubDelegationActions()}
                    </>
                  )}
                {showCreateNewDelegation && (
                  <NewDelegationComponent
                    collection={props.collection}
                    address={accountResolution.address}
                    ens={ensResolution.data}
                    showAddMore={true}
                    showCancel={true}
                    onHide={() => {
                      setShowCreateNewDelegation(false);
                      setCurrentDate(new Date());
                      incomingActiveDelegations.refetch();
                      outgoingActiveDelegations.refetch();
                    }}
                  />
                )}
                {showUpdateDelegation && updateDelegationParams && (
                  <UpdateDelegationComponent
                    collection={props.collection}
                    address={accountResolution.address}
                    delegation={updateDelegationParams}
                    ens={ensResolution.data}
                    showAddMore={true}
                    showCancel={true}
                    onHide={() => {
                      setShowUpdateDelegation(false);
                      setCurrentDate(new Date());
                      incomingActiveDelegations.refetch();
                      outgoingActiveDelegations.refetch();
                    }}
                  />
                )}
                {showCreateNewDelegationWithSub && (
                  <NewDelegationWithSubComponent
                    incomingDelegations={incomingSubdelegations}
                    collection={props.collection}
                    address={accountResolution.address}
                    ens={ensResolution.data}
                    showAddMore={true}
                    showCancel={true}
                    onHide={() => {
                      setShowCreateNewDelegationWithSub(false);
                      setCurrentDate(new Date());
                      incomingActiveDelegations.refetch();
                      outgoingActiveDelegations.refetch();
                    }}
                  />
                )}
                {showRevokeDelegationWithSub && (
                  <RevokeDelegationWithSubComponent
                    incomingDelegations={incomingSubdelegations}
                    collection={props.collection}
                    address={accountResolution.address}
                    ens={ensResolution.data}
                    showAddMore={true}
                    showCancel={true}
                    onHide={() => {
                      setShowRevokeDelegationWithSub(false);
                      setCurrentDate(new Date());
                      incomingActiveDelegations.refetch();
                      outgoingActiveDelegations.refetch();
                    }}
                  />
                )}
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
