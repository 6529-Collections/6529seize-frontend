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
  ANY_COLLECTION_PATH,
  CONSOLIDATION_USE_CASE,
  DelegationCollection,
  DELEGATION_USE_CASES,
  MAX_BULK_ACTIONS,
  SUB_DELEGATION_USE_CASE,
  ALL_USE_CASES,
} from "../../pages/delegation/[...section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { areEqualAddresses, getTransactionLink } from "../../helpers/Helpers";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
  NULL_ADDRESS,
} from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import Tippy from "@tippyjs/react";
import { DelegationCenterSection } from "./DelegationCenterMenu";
import DelegationWallet from "./DelegationWallet";
import NewConsolidationComponent from "./NewConsolidation";
import NewDelegationComponent from "./NewDelegation";
import NewSubDelegationComponent from "./NewSubDelegation";
import UpdateDelegationComponent from "./UpdateDelegation";
import RevokeDelegationWithSubComponent from "./RevokeDelegationWithSub";

interface Props {
  setSection(section: DelegationCenterSection): any;
  collection: DelegationCollection;
}

interface ContractWalletDelegation {
  wallet: string;
  fetched?: boolean;
  expiry?: string;
  all?: boolean;
  tokens?: number;
}

interface ContractDelegation {
  useCase: any;
  wallets: ContractWalletDelegation[];
}

function getReadParams(
  address: `0x${string}` | string | undefined,
  collection: `0x${string}` | string | undefined,
  functionName: string,
  useCases?: any[]
) {
  if (!useCases) {
    useCases = DELEGATION_USE_CASES;
  }
  const params: any = [];
  useCases.map((uc) => {
    params.push({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: functionName,
      args: [address, collection, uc.use_case],
    });
  });
  params.push({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: functionName,
    args: [address, collection, SUB_DELEGATION_USE_CASE.use_case],
  });
  params.push({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: functionName,
    args: [address, collection, CONSOLIDATION_USE_CASE.use_case],
  });
  return params;
}

function getActiveDelegationsReadParams(
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
  params.push({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: functionName,
    args: [address, collection, SUB_DELEGATION_USE_CASE.use_case],
  });
  params.push({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: functionName,
    args: [address, collection, CONSOLIDATION_USE_CASE.use_case],
  });
  return params;
}

function getConsolidationReadParams(
  address: `0x${string}` | string | undefined,
  collection: `0x${string}` | string | undefined,
  consolidationAddresses: ContractDelegation
) {
  const params: any = [];
  if (consolidationAddresses) {
    consolidationAddresses.wallets.map((ca) =>
      params.push({
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "checkConsolidationStatus",
        args: [address, ca.wallet, collection],
      })
    );

    return params;
  }
  return null;
}

export default function CollectionDelegationComponent(props: Props) {
  const toastRef = useRef<HTMLDivElement>(null);
  const accountResolution = useAccount();
  const networkResolution = useNetwork();
  const ensResolution = useEnsName({
    address: accountResolution.address,
    chainId: 1,
  });

  const [outgoingDelegations, setOutgoingDelegations] = useState<
    ContractDelegation[]
  >([]);
  const [outgoingActiveConsolidations, setOutgoingActiveConsolidations] =
    useState<{ wallet: string; status: string }[]>([]);
  const [outgoingDelegationsLoaded, setOutgoingDelegationsLoaded] =
    useState(false);

  const [incomingDelegations, setIncomingDelegations] = useState<
    ContractDelegation[]
  >([]);
  const [incomingActiveConsolidations, setIncomingActiveConsolidations] =
    useState<{ wallet: string; status: string }[]>([]);
  const [incomingDelegationsLoaded, setIncomingDelegationsLoaded] =
    useState(false);

  const [bulkRevocations, setBulkRevocations] = useState<any[]>([]);
  const [showUpdateDelegation, setShowUpdateDelegation] = useState(false);

  const [updateDelegationParams, setUpdateDelegationParams] = useState<
    { wallet: string; use_case: number; display: string } | undefined
  >();

  const [lockUseCaseValue, setLockUseCaseValue] = useState(0);
  const [lockUseCaseIndex, setLockUseCaseIndex] = useState(0);

  const [subDelegationOriginalDelegator, setSubDelegationOriginalDelegator] =
    useState<string | undefined>(undefined);
  const [showCreateNewDelegationWithSub, setShowCreateNewDelegationWithSub] =
    useState(false);
  const [
    showCreateNewSubDelegationWithSub,
    setShowCreateNewSubDelegationWithSub,
  ] = useState(false);
  const [
    showCreateNewConsolidationWithSub,
    setShowCreateNewConsolidationWithSub,
  ] = useState(false);
  const [showRevokeDelegationWithSub, setShowRevokeDelegationWithSub] =
    useState(false);

  function chainsMatch() {
    return networkResolution.chain?.id == DELEGATION_CONTRACT.chain_id;
  }

  useEffect(() => {
    reset();
  }, [accountResolution.address]);

  function getSwitchToHtml() {
    return `<span style="color: red !important;">Switch to ${
      DELEGATION_CONTRACT.chain_id == 1 ? "Ethereum Mainnet" : "Sepolia Network"
    }</span>`;
  }

  const retrieveOutgoingDelegations = useContractReads({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address,
      props.collection.contract,
      "retrieveDelegationAddressesTokensIDsandExpiredDates"
    ),
    watch: true,
    enabled: accountResolution.isConnected,
    onSettled(data, error) {
      if (data) {
        const myDelegations: ContractDelegation[] = [];
        data.map((d, index: number) => {
          const walletDelegations: ContractWalletDelegation[] = [];
          const useCase =
            DELEGATION_USE_CASES.length > index
              ? DELEGATION_USE_CASES[index]
              : index == SUB_DELEGATION_USE_CASE.index
              ? SUB_DELEGATION_USE_CASE
              : index == CONSOLIDATION_USE_CASE.index
              ? CONSOLIDATION_USE_CASE
              : null;
          if (useCase) {
            const delegationsArray = d.result as any[];
            delegationsArray[0].map((wallet: string, i: number) => {
              const myDate = delegationsArray[1][i];
              const myDateDisplay =
                new Date().getTime() / 1000 > myDate
                  ? `expired`
                  : myDate >= NEVER_DATE
                  ? `active`
                  : `active - expires ${formatExpiry(myDate)}`;
              walletDelegations.push({
                wallet: wallet,
                expiry: myDateDisplay,
                all: delegationsArray[2][i],
                tokens: delegationsArray[3][i],
              });
            });
            myDelegations.push({
              useCase: useCase,
              wallets: walletDelegations,
            });
          }
        });
        setOutgoingDelegations(myDelegations);
        setOutgoingDelegationsLoaded(true);
      }
    },
  });

  useContractReads({
    contracts: getConsolidationReadParams(
      accountResolution.address,
      props.collection.contract,
      outgoingDelegations[CONSOLIDATION_USE_CASE.index]
    ),
    watch: true,
    enabled: accountResolution.isConnected && outgoingDelegations.length > 0,
    onSettled(data, error) {
      if (data && outgoingDelegations[CONSOLIDATION_USE_CASE.index]) {
        const activeConsolidations: any[] = [];
        outgoingDelegations[CONSOLIDATION_USE_CASE.index].wallets.map(
          (w, index) => {
            activeConsolidations.push({
              wallet: w.wallet,
              status: data[index]
                ? "consolidation active"
                : "consolidation incomplete",
            });
          }
        );
        setOutgoingActiveConsolidations(activeConsolidations);
      }
    },
  });

  const retrieveIncomingDelegations = useContractReads({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address,
      props.collection.contract,
      "retrieveDelegatorsTokensIDsandExpiredDates"
    ),
    watch: true,
    enabled: accountResolution.isConnected && incomingDelegations.length > 0,
    onSettled(data, error) {
      if (data) {
        const myDelegations: ContractDelegation[] = [];
        data.map((d, index: number) => {
          const walletDelegations: ContractWalletDelegation[] = [];
          const useCase =
            DELEGATION_USE_CASES.length > index
              ? DELEGATION_USE_CASES[index]
              : index == SUB_DELEGATION_USE_CASE.index
              ? SUB_DELEGATION_USE_CASE
              : index == CONSOLIDATION_USE_CASE.index
              ? CONSOLIDATION_USE_CASE
              : null;
          if (useCase) {
            const delegationsArray = d.result as any[];
            delegationsArray[0].map((wallet: string, i: number) => {
              const myDate = delegationsArray[1][i];
              const myDateDisplay =
                new Date().getTime() / 1000 > myDate
                  ? `expired`
                  : myDate >= NEVER_DATE
                  ? `active`
                  : `active - expires ${formatExpiry(myDate)}`;
              walletDelegations.push({
                wallet: wallet,
                expiry: myDateDisplay,
                all: delegationsArray[2][i],
                tokens: delegationsArray[3][i],
              });
            });
            myDelegations.push({
              useCase: useCase,
              wallets: walletDelegations,
            });
          }
        });
        setIncomingDelegations(myDelegations);
        setIncomingDelegationsLoaded(true);
      }
    },
  });

  useContractReads({
    contracts: getConsolidationReadParams(
      accountResolution.address,
      props.collection.contract,
      incomingDelegations[CONSOLIDATION_USE_CASE.index]
    ),
    watch: true,
    enabled: accountResolution.isConnected && incomingDelegations.length > 0,
    onSettled(data, error) {
      if (data && incomingDelegations[CONSOLIDATION_USE_CASE.index]) {
        const activeConsolidations: any[] = [];
        incomingDelegations[CONSOLIDATION_USE_CASE.index].wallets.map(
          (w, index) => {
            activeConsolidations.push({
              wallet: w.wallet,
              status: data[index]
                ? "consolidation active"
                : "consolidation incomplete",
            });
          }
        );
        setIncomingActiveConsolidations(activeConsolidations);
      }
    },
  });

  const useCaseLockStatusesGlobal = areEqualAddresses(
    props.collection.contract,
    DELEGATION_ALL_ADDRESS
  )
    ? null
    : useContractReads({
        contracts: getReadParams(
          DELEGATION_ALL_ADDRESS,
          accountResolution.address,
          "retrieveCollectionUseCaseLockStatus"
        ),
        enabled: accountResolution.isConnected,
        watch: true,
      });

  const useCaseLockStatuses = useContractReads({
    contracts: getReadParams(
      props.collection.contract,
      accountResolution.address,
      "retrieveCollectionUseCaseLockStatus",
      ALL_USE_CASES
    ),
    enabled: accountResolution.isConnected,
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

  const collectionLockReadGlobal = areEqualAddresses(
    props.collection.contract,
    DELEGATION_ALL_ADDRESS
  )
    ? null
    : useContractRead({
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveCollectionLockStatus",
        args: [DELEGATION_ALL_ADDRESS, accountResolution.address],
        enabled: accountResolution.isConnected,
        watch: true,
      });

  const collectionLockRead = useContractRead({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: "retrieveCollectionLockStatus",
    args: [props.collection.contract, accountResolution.address],
    enabled: accountResolution.isConnected,
    watch: true,
  });

  const collectionLockWriteConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [props.collection.contract, collectionLockRead.data ? false : true],
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
      props.collection.contract,
      lockUseCaseValue,
      useCaseLockStatuses.data && useCaseLockStatuses.data[lockUseCaseIndex]
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
    if (accountResolution.isConnected) {
      useCaseLockStatuses.refetch();
    }
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
          setBulkRevocations([]);
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
            title: `Locking Wallet`,
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
            title: `Locking Wallet`,
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
    const useCase = DELEGATION_USE_CASES[lockUseCaseIndex];
    const title = `${
      useCaseLockStatuses.data && useCaseLockStatuses.data[lockUseCaseIndex]
        ? "Unlocking"
        : "Locking"
    } Wallet on Use Case #${useCase?.use_case} - ${useCase?.display}`;

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
    if (!showToast && outgoingDelegationsLoaded && incomingDelegationsLoaded) {
      reset();
    }
  }, [showToast]);

  useEffect(() => {
    if (toast) {
      setShowToast(true);
    }
  }, [toast]);

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

  function reset() {
    setOutgoingDelegations([]);
    setOutgoingDelegationsLoaded(false);
    retrieveOutgoingDelegations.refetch();

    setIncomingDelegations([]);
    setIncomingDelegationsLoaded(false);
    retrieveIncomingDelegations.refetch();

    setRevokeDelegationParams(undefined);
    setBatchRevokeDelegationParams(undefined);
    setToast(undefined);
    setLockUseCaseValue(0);
    setLockUseCaseIndex(0);
    useCaseLockWrite.reset();
    collectionLockWrite.reset();
    contractWriteRevoke.reset();
  }

  function printDelegations() {
    return (
      <>
        <h5 className="float-none pt-3 pb-1">Delegations</h5>
        <Accordion alwaysOpen className={styles.collectionDelegationsAccordion}>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem}`}
            eventKey={"0"}>
            <Accordion.Header>Outgoing</Accordion.Header>
            <Accordion.Body>
              {printOutgoingDelegations(
                "delegations",
                [...outgoingDelegations].filter(
                  (d) =>
                    d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
                    d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem} mt-3`}
            eventKey={"1"}>
            <Accordion.Header>Incoming</Accordion.Header>
            <Accordion.Body>
              {printIncomingDelegations(
                "delegations",
                [...incomingDelegations].filter(
                  (d) =>
                    d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
                    d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </>
    );
  }

  function printSubDelegations() {
    return (
      <>
        <h5 className="float-none pt-5 pb-1">
          Delegation Managers (Sub-Delegations)
        </h5>
        <Accordion
          alwaysOpen
          className={`${styles.collectionDelegationsAccordion} `}>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem}`}
            eventKey={"0"}>
            <Accordion.Header>Outgoing</Accordion.Header>
            <Accordion.Body>
              {printOutgoingDelegations(
                "Delegation Managers",
                [...outgoingDelegations].filter(
                  (d) => d.useCase.use_case == SUB_DELEGATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem} mt-3`}
            eventKey={"1"}>
            <Accordion.Header>Incoming</Accordion.Header>
            <Accordion.Body>
              {printIncomingDelegations(
                "Delegation Managers",
                [...incomingDelegations].filter(
                  (d) => d.useCase.use_case == SUB_DELEGATION_USE_CASE.use_case
                ),
                true
              )}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </>
    );
  }

  function printConsolidations() {
    return (
      <>
        <h5 className="float-none pt-5 pb-1">Consolidations</h5>
        <Accordion
          alwaysOpen
          className={`${styles.collectionDelegationsAccordion}`}>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem}`}
            eventKey={"0"}>
            <Accordion.Header>Outgoing</Accordion.Header>
            <Accordion.Body>
              {printOutgoingDelegations(
                "consolidations",
                [...outgoingDelegations].filter(
                  (d) => d.useCase.use_case == CONSOLIDATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem} mt-3`}
            eventKey={"1"}>
            <Accordion.Header>Incoming</Accordion.Header>
            <Accordion.Body>
              {printIncomingDelegations(
                "consolidations",
                [...incomingDelegations].filter(
                  (d) => d.useCase.use_case == CONSOLIDATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </>
    );
  }

  function printOutgoingDelegations(
    scope: string,
    myDelegations: ContractDelegation[]
  ) {
    let delegations: number = 0;
    myDelegations.map((del) => {
      if (del.wallets.length > 0) {
        delegations += del.wallets.length;
      }
    });

    return (
      <Container className="no-padding">
        <Row className={styles.delegationsTableScrollContainer}>
          <Col className="pb-3">
            <Table className={styles.delegationsTable}>
              <tbody>
                {delegations > 0 ? (
                  myDelegations.map((del, index: number) => {
                    if (del.wallets.length > 0) {
                      const isConsolidation =
                        del.useCase.use_case == CONSOLIDATION_USE_CASE.use_case;
                      return (
                        <Fragment
                          key={`outgoing-${del.useCase.use_case}-${index}`}>
                          <tr>
                            <td
                              colSpan={4}
                              className={styles.delegationsTableUseCaseHeader}>
                              #{del.useCase.use_case} - {del.useCase.display}
                            </td>
                          </tr>
                          {del.wallets.map((w, addressIndex: number) => {
                            const consolidationStatus =
                              outgoingActiveConsolidations.find((i) =>
                                areEqualAddresses(w.wallet, i.wallet)
                              )?.status;
                            const pending =
                              consolidationStatus == "consolidation incomplete";
                            return (
                              <tr
                                key={`outgoing-${del.useCase.use_case}-${index}-${w.wallet}-${addressIndex}`}>
                                <td className={styles.formCheckColumn}>
                                  <FormCheck
                                    disabled={
                                      delegations < 2 ||
                                      (bulkRevocations.length ==
                                        MAX_BULK_ACTIONS &&
                                        !bulkRevocations.some(
                                          (bd) =>
                                            bd.use_case ==
                                              del.useCase.use_case &&
                                            areEqualAddresses(
                                              bd.wallet,
                                              w.wallet
                                            )
                                        ))
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setBulkRevocations((bd) => [
                                          ...bd,
                                          {
                                            use_case: del.useCase.use_case,
                                            wallet: w.wallet,
                                          },
                                        ]);
                                      } else {
                                        setBulkRevocations((bd) =>
                                          bd.filter(
                                            (x) =>
                                              !(
                                                x.use_case ==
                                                  del.useCase.use_case &&
                                                areEqualAddresses(
                                                  x.wallet,
                                                  w.wallet
                                                )
                                              )
                                          )
                                        );
                                      }
                                    }}
                                  />
                                </td>
                                <td>
                                  <DelegationWallet address={w.wallet} />{" "}
                                  <span
                                    className={styles.delegationActiveLabel}>
                                    {w.expiry}
                                    {w.all
                                      ? ` - all tokens`
                                      : ` - token ID: ${w.tokens}`}
                                  </span>
                                  {isConsolidation && (
                                    <span
                                      className={
                                        !pending
                                          ? styles.consolidationActiveLabel
                                          : styles.consolidationNotAcceptedLabel
                                      }>
                                      {consolidationStatus}
                                      {pending && (
                                        <Tippy
                                          content={
                                            "Incoming consolidation missing"
                                          }
                                          placement={"top"}
                                          theme={"light"}>
                                          <FontAwesomeIcon
                                            className={styles.infoIcon}
                                            icon="info-circle"></FontAwesomeIcon>
                                        </Tippy>
                                      )}
                                    </span>
                                  )}
                                </td>
                                <td className="text-right">
                                  <span
                                    className={styles.useCaseWalletUpdate}
                                    onClick={() => {
                                      setUpdateDelegationParams({
                                        wallet: w.wallet,
                                        use_case: del.useCase.use_case,
                                        display: del.useCase.display,
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
                                      const title = "Revoking Delegation";
                                      let message = "Confirm in your wallet...";

                                      if (chainsMatch()) {
                                        setRevokeDelegationParams({
                                          collection: areEqualAddresses(
                                            props.collection.contract,
                                            DELEGATION_ALL_ADDRESS
                                          )
                                            ? DELEGATION_ALL_ADDRESS
                                            : props.collection.contract,
                                          address: w.wallet,
                                          use_case: del.useCase.use_case,
                                        });
                                      } else {
                                        message = getSwitchToHtml();
                                      }
                                      setToast({ title, message });
                                    }}>
                                    Revoke
                                    {(contractWriteRevoke.isLoading ||
                                      waitContractWriteRevoke.isLoading) &&
                                      areEqualAddresses(
                                        revokeDelegationParams.address,
                                        w.wallet
                                      ) &&
                                      revokeDelegationParams.use_case ==
                                        del.useCase.use_case && (
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
                ) : !outgoingDelegationsLoaded ? (
                  <tr>
                    <td colSpan={4}>Fetching outgoing {scope}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4}>No outgoing {scope} found</td>
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
                            const title = "Batch Revoking Delegations";
                            let message = "Confirm in your wallet...";

                            if (chainsMatch()) {
                              setBatchRevokeDelegationParams({
                                collections: [...bulkRevocations].map((br) =>
                                  areEqualAddresses(
                                    props.collection.contract,
                                    DELEGATION_ALL_ADDRESS
                                  )
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
                            } else {
                              message = getSwitchToHtml();
                            }
                            setToast({ title, message });
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

  function printIncomingDelegations(
    scope: string,
    myDelegations: ContractDelegation[],
    isSubdelegation?: boolean
  ) {
    let delegations: number = 0;
    myDelegations.map((del) => {
      if (del.wallets.length > 0) {
        delegations += del.wallets.length;
      }
    });

    return (
      <Container className="no-padding">
        <Row className={styles.delegationsTableScrollContainer}>
          <Col className="pb-3">
            <Table className={styles.delegationsTable}>
              <tbody>
                {delegations > 0 ? (
                  myDelegations.map((del, index: number) => {
                    if (del.wallets.length > 0) {
                      const isConsolidation =
                        del.useCase.use_case == CONSOLIDATION_USE_CASE.use_case;
                      return (
                        <Fragment
                          key={`incoming-${del.useCase.use_case}-${index}`}>
                          <tr>
                            <td
                              colSpan={4}
                              className={styles.delegationsTableUseCaseHeader}>
                              #{del.useCase.use_case} - {del.useCase.display}
                            </td>
                          </tr>
                          {del.wallets.map((w) => {
                            const consolidationStatus =
                              incomingActiveConsolidations.find((i) =>
                                areEqualAddresses(w.wallet, i.wallet)
                              )?.status;
                            const pending =
                              consolidationStatus == "consolidation incomplete";
                            return (
                              <tr
                                key={`incoming-${del.useCase}-${index}-${w.wallet}`}>
                                <td className={styles.formCheckColumn}>
                                  {del.useCase.use_case ==
                                  SUB_DELEGATION_USE_CASE.use_case ? (
                                    <FormCheck
                                      checked={areEqualAddresses(
                                        subDelegationOriginalDelegator,
                                        w.wallet
                                      )}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSubDelegationOriginalDelegator(
                                            w.wallet
                                          );
                                        } else {
                                          setSubDelegationOriginalDelegator(
                                            undefined
                                          );
                                        }
                                      }}
                                    />
                                  ) : (
                                    <>&nbsp;&bull;&nbsp;</>
                                  )}
                                </td>
                                <td>
                                  <DelegationWallet address={w.wallet} />{" "}
                                  <span
                                    className={styles.delegationActiveLabel}>
                                    {w.expiry}
                                    {w.all
                                      ? ` - all tokens`
                                      : ` - token ID: ${w.tokens}`}
                                  </span>
                                  {isConsolidation && (
                                    <span
                                      className={
                                        !pending
                                          ? styles.consolidationActiveLabel
                                          : styles.consolidationNotAcceptedLabel
                                      }>
                                      {consolidationStatus}
                                      {pending && (
                                        <Tippy
                                          content={
                                            "Outgoing consolidation missing"
                                          }
                                          placement={"top"}
                                          theme={"light"}>
                                          <FontAwesomeIcon
                                            className={styles.infoIcon}
                                            icon="info-circle"></FontAwesomeIcon>
                                        </Tippy>
                                      )}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    }
                  })
                ) : !incomingDelegationsLoaded ? (
                  <tr>
                    <td colSpan={4}>Fetching incoming {scope}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4}>No incoming {scope} found</td>
                  </tr>
                )}
                {incomingDelegationsLoaded &&
                  isSubdelegation &&
                  delegations > 0 && (
                    <tr>
                      <td colSpan={2} className="pt-5">
                        <span
                          className={`${styles.useCaseWalletUpdate} ${
                            subDelegationOriginalDelegator == undefined
                              ? styles.useCaseWalletUpdateDisabled
                              : ""
                          }`}
                          onClick={() => {
                            setShowCreateNewDelegationWithSub(true);
                            window.scrollTo(0, 0);
                          }}>
                          <FontAwesomeIcon
                            icon="plus"
                            className={styles.buttonIcon}
                          />
                          Register Delegation
                        </span>
                        <span
                          className={`${styles.useCaseWalletUpdate} ${
                            subDelegationOriginalDelegator == undefined
                              ? styles.useCaseWalletUpdateDisabled
                              : ""
                          }`}
                          onClick={() => {
                            setShowCreateNewSubDelegationWithSub(true);
                            window.scrollTo(0, 0);
                          }}>
                          <FontAwesomeIcon
                            icon="plus"
                            className={styles.buttonIcon}
                          />
                          Register Delegation Manager
                        </span>
                        <span
                          className={`${styles.useCaseWalletUpdate} ${
                            subDelegationOriginalDelegator == undefined
                              ? styles.useCaseWalletUpdateDisabled
                              : ""
                          }`}
                          onClick={() => {
                            setShowCreateNewConsolidationWithSub(true);
                            window.scrollTo(0, 0);
                          }}>
                          <FontAwesomeIcon
                            icon="plus"
                            className={styles.buttonIcon}
                          />
                          Register Consolidation
                        </span>
                        <span
                          className={`${styles.useCaseWalletRevoke} ${
                            subDelegationOriginalDelegator == undefined
                              ? styles.useCaseWalletRevokeDisabled
                              : ""
                          }`}
                          onClick={() => {
                            setShowRevokeDelegationWithSub(true);
                            window.scrollTo(0, 0);
                          }}>
                          <FontAwesomeIcon
                            icon="minus"
                            className={styles.buttonIcon}
                          />
                          Revoke
                        </span>
                      </td>
                    </tr>
                  )}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }

  function printLocks() {
    return (
      <Container className="no-padding">
        <>
          <Row className="pt-5 pb-2">
            <Col>
              <h4>
                Locks{" "}
                <Tippy
                  content={
                    "Lock Wallet or Use Case to stop accepting incoming delegations"
                  }
                  placement={"right"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"></FontAwesomeIcon>
                </Tippy>
              </h4>
            </Col>
          </Row>
          <Row className="pt-2 pb-2">
            <Col>
              <>
                {/* {collectionLockRead.data != null && ( */}
                <span
                  className={`${styles.lockDelegationBtn} ${
                    collectionLockReadGlobal?.data
                      ? styles.lockDelegationBtnDisabled
                      : ""
                  }`}
                  onClick={() => {
                    const title = `${
                      collectionLockRead.data ? `Unlocking` : `Locking`
                    } Wallet`;
                    let message = "Confirm in your wallet...";

                    if (chainsMatch()) {
                      collectionLockWrite.write?.();
                    } else {
                      message = getSwitchToHtml();
                    }
                    setToast({ title, message });
                  }}>
                  <FontAwesomeIcon
                    icon={collectionLockRead.data ? "lock" : "lock-open"}
                    className={styles.buttonIcon}
                  />
                  {collectionLockRead.data ? "Unlock" : "Lock"} Wallet
                  {collectionLockReadGlobal?.data &&
                  !areEqualAddresses(
                    props.collection.contract,
                    DELEGATION_ALL_ADDRESS
                  )
                    ? ` *`
                    : ``}
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
                {/* )} */}
              </>
            </Col>
          </Row>
          <Row className="pt-3 pb-2">
            <Col xs={12} sm={12} md={4} lg={4} className="pt-2 pb-2">
              <Form.Select
                disabled={collectionLockRead.data ? true : false}
                className={`${styles.formInputLockUseCase} ${
                  collectionLockRead.data || collectionLockReadGlobal?.data
                    ? styles.formInputDisabled
                    : ""
                }`}
                value={lockUseCaseValue}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setLockUseCaseValue(value);
                  if (value == CONSOLIDATION_USE_CASE.use_case) {
                    setLockUseCaseIndex(16);
                  } else {
                    setLockUseCaseIndex(value - 1);
                  }
                  useCaseLockWrite.reset();
                }}>
                <option value={0}>
                  <>
                    Lock/Unlock Use Case
                    {collectionLockRead.data || collectionLockReadGlobal?.data
                      ? ` *`
                      : ``}
                  </>
                </option>
                {ALL_USE_CASES.map((uc, index) => {
                  if (uc.use_case != 1) {
                    return (
                      <option
                        key={`collection-delegation-select-use-case-${uc.use_case}`}
                        value={uc.use_case}>
                        #{uc.use_case} - {uc.display}
                        {(useCaseLockStatuses.data &&
                          (useCaseLockStatuses.data[index] as any as boolean) ==
                            true) ||
                        (useCaseLockStatusesGlobal?.data &&
                          (useCaseLockStatusesGlobal?.data[
                            index
                          ] as any as boolean) == true) ||
                        collectionLockRead.data
                          ? ` - LOCKED${
                              useCaseLockStatusesGlobal?.data &&
                              (useCaseLockStatusesGlobal?.data[
                                index
                              ] as any as boolean) == true
                                ? ` *`
                                : ``
                            }`
                          : ` - UNLOCKED`}
                      </option>
                    );
                  }
                })}
              </Form.Select>
            </Col>
            {lockUseCaseValue != 0 && (
              <Col
                xs={12}
                sm={12}
                md={8}
                lg={8}
                className="pt-2 pb-2 d-flex align-items-center">
                {!useCaseLockStatusesGlobal ||
                (useCaseLockStatusesGlobal?.data &&
                  (useCaseLockStatusesGlobal?.data[
                    lockUseCaseIndex
                  ] as any as boolean) == false) ? (
                  <button
                    className={`${styles.lockUseCaseBtn}`}
                    onClick={() => {
                      const useCase = DELEGATION_USE_CASES[lockUseCaseIndex];
                      const title = `${
                        useCaseLockStatuses.data &&
                        useCaseLockStatuses.data[lockUseCaseIndex]
                          ? "Unlocking"
                          : "Locking"
                      } Wallet on Use Case #${useCase.use_case} - ${
                        useCase.display
                      }`;
                      let message = "Confirm in your wallet...";

                      if (chainsMatch()) {
                        useCaseLockWrite.write?.();
                      } else {
                        message = getSwitchToHtml();
                      }
                      setToast({ title, message });
                    }}>
                    <FontAwesomeIcon
                      icon={
                        useCaseLockStatuses.data &&
                        useCaseLockStatuses.data[lockUseCaseIndex]
                          ? "lock"
                          : "lock-open"
                      }
                      className={styles.buttonIcon}
                    />
                    {useCaseLockStatuses.data &&
                    useCaseLockStatuses.data[lockUseCaseIndex]
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
                ) : (
                  <div>
                    <span className={styles.hint}>* Note:</span> Unlock use case
                    in{" "}
                    <a href={`/delegation/${ANY_COLLECTION_PATH}`}>
                      All Collections
                    </a>
                  </div>
                )}
              </Col>
            )}
          </Row>
          {collectionLockRead.data && (
            <Row className="pb-3">
              <Col>
                <span className={styles.hint}>* Note:</span> Unlock Wallet to
                lock/unlock specific use cases
              </Col>
            </Row>
          )}
          {collectionLockReadGlobal?.data && (
            <Row className="pb-3">
              <Col>
                <span className={styles.hint}>* Note:</span> Unlock Wallet on{" "}
                <a href={`/delegation/${ANY_COLLECTION_PATH}`}>
                  All Collections
                </a>{" "}
                to lock/unlock specific collections and use cases
              </Col>
            </Row>
          )}
        </>
      </Container>
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          {props.collection && (
            <Container>
              <Row className="pb-2">
                <Col>
                  <h1>{props.collection.title.toUpperCase()}</h1>
                </Col>
              </Row>
              {!showUpdateDelegation &&
                !showCreateNewDelegationWithSub &&
                !showCreateNewSubDelegationWithSub &&
                !showCreateNewConsolidationWithSub &&
                !showRevokeDelegationWithSub && (
                  <>
                    {printDelegations()}
                    {printSubDelegations()}
                    {printConsolidations()}
                    {printLocks()}
                    <Container className="no-padding">
                      <Row className="pt-5 pb-3">
                        <Col className="d-flex align-items-center justify-content-start">
                          <span
                            className={styles.backBtn}
                            onClick={() =>
                              props.setSection(DelegationCenterSection.CENTER)
                            }>
                            <FontAwesomeIcon icon="circle-arrow-left" />
                            Back to Delegation Center
                          </span>
                        </Col>
                      </Row>
                    </Container>
                  </>
                )}
              {showUpdateDelegation &&
                updateDelegationParams &&
                accountResolution.address && (
                  <UpdateDelegationComponent
                    collection={props.collection}
                    address={accountResolution.address}
                    delegation={updateDelegationParams}
                    ens={ensResolution.data}
                    showAddMore={true}
                    showCancel={true}
                    onHide={() => {
                      setShowUpdateDelegation(false);
                    }}
                    onSetToast={(toast: any) => {
                      setToast({
                        title: toast.title,
                        message: toast.message,
                      });
                    }}
                  />
                )}
              {showCreateNewDelegationWithSub &&
                subDelegationOriginalDelegator && (
                  <NewDelegationComponent
                    subdelegation={{
                      originalDelegator: subDelegationOriginalDelegator,
                      collection: props.collection,
                    }}
                    address={accountResolution.address as string}
                    ens={ensResolution.data}
                    onHide={() => {
                      setShowCreateNewDelegationWithSub(false);
                      setSubDelegationOriginalDelegator(undefined);
                    }}
                    onSetToast={(toast: any) => {
                      setToast({
                        title: toast.title,
                        message: toast.message,
                      });
                    }}
                  />
                )}
              {showCreateNewSubDelegationWithSub &&
                subDelegationOriginalDelegator && (
                  <NewSubDelegationComponent
                    subdelegation={{
                      originalDelegator: subDelegationOriginalDelegator,
                      collection: props.collection,
                    }}
                    address={accountResolution.address as string}
                    ens={ensResolution.data}
                    onHide={() => {
                      setShowCreateNewSubDelegationWithSub(false);
                      setSubDelegationOriginalDelegator(undefined);
                    }}
                    onSetToast={(toast: any) => {
                      setToast({
                        title: toast.title,
                        message: toast.message,
                      });
                    }}
                  />
                )}
              {showCreateNewConsolidationWithSub &&
                subDelegationOriginalDelegator && (
                  <NewConsolidationComponent
                    subdelegation={{
                      originalDelegator: subDelegationOriginalDelegator,
                      collection: props.collection,
                    }}
                    address={accountResolution.address as string}
                    ens={ensResolution.data}
                    onHide={() => {
                      setShowCreateNewConsolidationWithSub(false);
                      setSubDelegationOriginalDelegator(undefined);
                    }}
                    onSetToast={(toast: any) => {
                      setToast({
                        title: toast.title,
                        message: toast.message,
                      });
                    }}
                  />
                )}

              {showRevokeDelegationWithSub &&
                subDelegationOriginalDelegator &&
                accountResolution.address && (
                  <RevokeDelegationWithSubComponent
                    originalDelegator={subDelegationOriginalDelegator}
                    collection={props.collection}
                    address={accountResolution.address}
                    ens={ensResolution.data}
                    showAddMore={true}
                    onHide={() => {
                      setShowRevokeDelegationWithSub(false);
                      setSubDelegationOriginalDelegator(undefined);
                    }}
                    onSetToast={(toast: any) => {
                      setToast({
                        title: toast.title,
                        message: toast.message,
                      });
                    }}
                  />
                )}
            </Container>
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
