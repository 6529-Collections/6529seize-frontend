import styles from "./Delegation.module.scss";
import {
  Container,
  Row,
  Col,
  Accordion,
  Table,
  FormCheck,
  Form,
} from "react-bootstrap";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useEnsName,
  useWaitForTransactionReceipt,
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
  MEMES_COLLECTION,
  PRIMARY_ADDRESS_USE_CASE,
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
import {
  DelegationCenterSection,
  DelegationToast,
} from "./DelegationCenterMenu";
import DelegationWallet from "./DelegationWallet";
import NewConsolidationComponent from "./NewConsolidation";
import NewDelegationComponent from "./NewDelegation";
import NewSubDelegationComponent from "./NewSubDelegation";
import UpdateDelegationComponent from "./UpdateDelegation";
import RevokeDelegationWithSubComponent from "./RevokeDelegationWithSub";
import NewAssignPrimaryAddress from "./NewAssignPrimaryAddress";
import { Spinner } from "../dotLoader/DotLoader";

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

interface Revocation {
  use_case: number;
  wallet: string;
}

function getParams(
  address: string | undefined,
  collection: string | undefined,
  functionName: string,
  useCases: any[]
) {
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
    args: [address, collection, PRIMARY_ADDRESS_USE_CASE.use_case],
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

function getReadParams(
  address: string | undefined,
  collection: string | undefined,
  functionName: string,
  useCases?: any[]
) {
  if (!useCases) {
    useCases = DELEGATION_USE_CASES;
  }
  return getParams(address, collection, functionName, useCases);
}

function getActiveDelegationsReadParams(
  address: `0x${string}` | string | undefined,
  collection: `0x${string}` | string | undefined,
  functionName: string
) {
  return getParams(address, collection, functionName, DELEGATION_USE_CASES);
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
  return [];
}

function formatExpiry(myDate: any) {
  const date = new Date(parseInt(myDate) * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDelegationsFromData(data: any) {
  const myDelegations: ContractDelegation[] = [];
  data.map((d: any, index: number) => {
    const walletDelegations: ContractWalletDelegation[] = [];
    let useCase = null;
    if (DELEGATION_USE_CASES.length > index) {
      useCase = DELEGATION_USE_CASES[index];
    } else if (index === PRIMARY_ADDRESS_USE_CASE.index) {
      useCase = PRIMARY_ADDRESS_USE_CASE;
    } else if (index === SUB_DELEGATION_USE_CASE.index) {
      useCase = SUB_DELEGATION_USE_CASE;
    } else if (index === CONSOLIDATION_USE_CASE.index) {
      useCase = CONSOLIDATION_USE_CASE;
    }

    if (useCase && d.result) {
      const delegationsArray = d.result as any[];
      delegationsArray[0].map((wallet: string, i: number) => {
        const myDate = delegationsArray[1][i];
        const myDateDisplay =
          new Date().getTime() / 1000 > myDate
            ? `expired`
            : myDate >= NEVER_DATE
            ? `active - non-expiring`
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
  return myDelegations;
}

export default function CollectionDelegationComponent(props: Readonly<Props>) {
  const toastRef = useRef<HTMLDivElement>(null);
  const accountResolution = useAccount();
  const networkResolution = accountResolution.chain;
  const ensResolution = useEnsName({
    address: accountResolution.address as `0x${string}`,
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

  const [bulkRevocations, setBulkRevocations] = useState<Revocation[]>([]);
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
  const [showAssignPrimaryAddressWithSub, setShowAssignPrimaryAddressWithSub] =
    useState(false);
  const [showRevokeDelegationWithSub, setShowRevokeDelegationWithSub] =
    useState(false);

  function chainsMatch() {
    return networkResolution?.id === DELEGATION_CONTRACT.chain_id;
  }

  useEffect(() => {
    reset();
  }, [accountResolution.address]);

  function getSwitchToHtml() {
    return `<span style="color: red !important;">Switch to ${
      DELEGATION_CONTRACT.chain_id === 1
        ? "Ethereum Mainnet"
        : "Sepolia Network"
    }</span>`;
  }

  const retrieveOutgoingDelegations = useReadContracts({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address,
      props.collection.contract,
      "retrieveDelegationAddressesTokensIDsandExpiredDates"
    ),
    query: {
      enabled: accountResolution.isConnected,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (retrieveOutgoingDelegations.data) {
      const myDelegations = getDelegationsFromData(
        retrieveOutgoingDelegations.data
      );
      setOutgoingDelegations(myDelegations);
      setOutgoingDelegationsLoaded(true);
    }
  }, [retrieveOutgoingDelegations.data]);

  const retrieveOutgoingConsolidations = useReadContracts({
    contracts: getConsolidationReadParams(
      accountResolution.address,
      props.collection.contract,
      outgoingDelegations[CONSOLIDATION_USE_CASE.index]
    ),
    query: {
      enabled: accountResolution.isConnected && outgoingDelegations.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (retrieveOutgoingConsolidations.data) {
      const activeConsolidations: any[] = [];
      outgoingDelegations[CONSOLIDATION_USE_CASE.index].wallets.map(
        (w, index) => {
          activeConsolidations.push({
            wallet: w.wallet,
            status: retrieveOutgoingConsolidations.data[index].result
              ? "consolidation active"
              : "consolidation incomplete",
          });
        }
      );
      setOutgoingActiveConsolidations(activeConsolidations);
    }
  }, [retrieveOutgoingConsolidations.data]);

  const retrieveIncomingDelegations = useReadContracts({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address,
      props.collection.contract,
      "retrieveDelegatorsTokensIDsandExpiredDates"
    ),
    query: {
      enabled: accountResolution.isConnected && incomingDelegations.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (retrieveIncomingDelegations.data) {
      const myDelegations = getDelegationsFromData(
        retrieveIncomingDelegations.data
      );
      setIncomingDelegations(myDelegations);
      setIncomingDelegationsLoaded(true);
    }
  }, [retrieveIncomingDelegations.data]);

  const retrieveIncomingConsolidations = useReadContracts({
    contracts: getConsolidationReadParams(
      accountResolution.address,
      props.collection.contract,
      incomingDelegations[CONSOLIDATION_USE_CASE.index]
    ),
    query: {
      enabled: accountResolution.isConnected && incomingDelegations.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (retrieveIncomingConsolidations.data) {
      const activeConsolidations: any[] = [];
      incomingDelegations[CONSOLIDATION_USE_CASE.index].wallets.map(
        (w, index) => {
          activeConsolidations.push({
            wallet: w.wallet,
            status: retrieveIncomingConsolidations.data[index].result
              ? "consolidation active"
              : "consolidation incomplete",
          });
        }
      );
      setIncomingActiveConsolidations(activeConsolidations);
    }
  }, [retrieveIncomingConsolidations.data]);

  const useCaseLockStatusesGlobalParams = areEqualAddresses(
    props.collection.contract,
    DELEGATION_ALL_ADDRESS
  )
    ? {}
    : {
        contracts: getReadParams(
          DELEGATION_ALL_ADDRESS,
          accountResolution.address,
          "retrieveCollectionUseCaseLockStatus"
        ),
        query: {
          enabled: accountResolution.isConnected,
          refetchInterval: 10000,
        },
      };

  const useCaseLockStatusesGlobal = useReadContracts(
    useCaseLockStatusesGlobalParams
  );

  const useCaseLockStatuses = useReadContracts({
    contracts: getReadParams(
      props.collection.contract,
      accountResolution.address,
      "retrieveCollectionUseCaseLockStatus",
      ALL_USE_CASES
    ),
    query: {
      enabled: accountResolution.isConnected,
      refetchInterval: 10000,
    },
  });

  const [revokeDelegationParams, setRevokeDelegationParams] = useState<any>();
  const [batchRevokeDelegationParams, setBatchRevokeDelegationParams] =
    useState<any>();

  const contractWriteRevoke = useWriteContract();

  const waitContractWriteRevoke = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: contractWriteRevoke.data,
  });

  const contractWriteBatchRevoke = useWriteContract();
  const waitContractWriteBatchRevoke = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: contractWriteBatchRevoke.data,
  });

  const [toast, setToast] = useState<
    { title: string; message: string | undefined } | undefined
  >(undefined);
  const [showToast, setShowToast] = useState(false);

  const [delegationKeys, setDelegationKeys] = useState<any[]>([]);
  const [delegationKeysChanged, setDelegationKeysChanged] = useState(false);
  const [subDelegationKeys, setSubDelegationKeys] = useState<any[]>([]);
  const [subDelegationKeysChanged, setSubDelegationKeysChanged] =
    useState(false);
  const [consolidationKeys, setConsolidationKeys] = useState<any[]>([]);
  const [consolidationKeysChanged, setConsolidationKeysChanged] =
    useState(false);

  const collectionLockReadGlobalParams = areEqualAddresses(
    props.collection.contract,
    DELEGATION_ALL_ADDRESS
  )
    ? {}
    : {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveCollectionLockStatus",
        args: [DELEGATION_ALL_ADDRESS, accountResolution.address],
        query: {
          enabled: accountResolution.isConnected,
          refetchInterval: 10000,
        },
      };

  const collectionLockReadGlobal = useReadContract(
    collectionLockReadGlobalParams
  );

  const collectionLockRead = useReadContract({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: "retrieveCollectionLockStatus",
    args: [props.collection.contract, accountResolution.address],
    query: {
      enabled: accountResolution.isConnected,
      refetchInterval: 10000,
    },
  });

  const collectionLockWrite = useWriteContract();
  const waitCollectionLockWrite = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: collectionLockWrite.data,
  });

  const useCaseLockWrite = useWriteContract();
  const waitUseCaseLockWrite = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: useCaseLockWrite.data,
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
        message:
          contractWriteRevoke.error.message.split("Request Arguments")[0],
      });
    }
    if (contractWriteRevoke.data) {
      if (contractWriteRevoke.data) {
        if (waitContractWriteRevoke.isLoading) {
          setToast({
            title: "Revoking Delegation",
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteRevoke.data
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
                      contractWriteRevoke.data
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
        message:
          contractWriteBatchRevoke.error.message.split("Request Arguments")[0],
      });
    }
    if (contractWriteBatchRevoke.data) {
      if (contractWriteBatchRevoke.data) {
        if (waitContractWriteBatchRevoke.isLoading) {
          setToast({
            title: "Batch Revoking Delegations",
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteBatchRevoke.data
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
                      contractWriteBatchRevoke.data
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
      const title = `${
        collectionLockRead.data ? `Unlocking` : `Locking`
      } Wallet`;
      setToast({
        title,
        message:
          collectionLockWrite.error.message.split("Request Arguments")[0],
      });
    }
    if (collectionLockWrite.data) {
      if (collectionLockWrite.data) {
        if (waitCollectionLockWrite.isLoading) {
          setToast({
            title: `Locking Wallet`,
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      collectionLockWrite.data
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
                      collectionLockWrite.data
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
      useCaseLockStatuses.data?.[lockUseCaseIndex] ? "Unlocking" : "Locking"
    } Wallet on Use Case #${useCase?.use_case} - ${useCase?.display}`;

    if (useCaseLockWrite.error) {
      setToast({
        title: title,
        message: useCaseLockWrite.error.message.split("Request Arguments")[0],
      });
    }
    if (useCaseLockWrite.data) {
      if (useCaseLockWrite.data) {
        if (waitUseCaseLockWrite.isLoading) {
          setToast({
            title: title,
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      useCaseLockWrite.data
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
                      useCaseLockWrite.data
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
      setToast(undefined);
    }
  }, [showToast]);

  useEffect(() => {
    if (toast) {
      setShowToast(true);
    }
  }, [toast]);

  useEffect(() => {
    if (revokeDelegationParams && !revokeDelegationParams.loading) {
      setRevokeDelegationParams({ ...revokeDelegationParams, loading: true });
      contractWriteRevoke.writeContract({
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          revokeDelegationParams
            ? revokeDelegationParams.collection
            : NULL_ADDRESS,
          revokeDelegationParams
            ? revokeDelegationParams.address
            : NULL_ADDRESS,
          revokeDelegationParams ? revokeDelegationParams.use_case : 0,
        ],
        functionName: "revokeDelegationAddress",
      });
    }
  }, [revokeDelegationParams]);

  useEffect(() => {
    if (batchRevokeDelegationParams && !batchRevokeDelegationParams.loading) {
      setBatchRevokeDelegationParams({
        ...batchRevokeDelegationParams,
        loading: true,
      });
      contractWriteBatchRevoke.writeContract({
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          batchRevokeDelegationParams.collections,
          batchRevokeDelegationParams.addresses,
          batchRevokeDelegationParams.use_cases,
        ],
        functionName: "batchRevocations",
      });
    }
  }, [batchRevokeDelegationParams, contractWriteBatchRevoke]);

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

  function getDelegationsCount(delegations: ContractDelegation[]) {
    let count: number = 0;
    delegations.map((del) => {
      if (del.wallets.length > 0) {
        count += del.wallets.length;
      }
    });
    return count;
  }

  function getActiveKeys(
    outDelegations: ContractDelegation[],
    inDelegations: ContractDelegation[]
  ) {
    const outCount = getDelegationsCount(outDelegations);
    const inCount = getDelegationsCount(inDelegations);
    if (outCount > 0 && inCount > 0) {
      return ["0", "1"];
    }
    if (outCount > 0) {
      return ["0"];
    }
    if (inCount > 0) {
      return ["1"];
    }
    return [""];
  }

  useEffect(() => {
    const outDelegations = [...outgoingDelegations].filter(
      (d) =>
        d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    );
    const inDelegations = [...incomingDelegations].filter(
      (d) =>
        d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    );

    if (!delegationKeysChanged) {
      setDelegationKeys(getActiveKeys(outDelegations, inDelegations));
    }
    if (!subDelegationKeysChanged) {
      setSubDelegationKeys(
        getActiveKeys(
          [...outgoingDelegations].filter(
            (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
          ),
          [...incomingDelegations].filter(
            (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
          )
        )
      );
    }
    if (!consolidationKeysChanged) {
      setConsolidationKeys(
        getActiveKeys(
          [...outgoingDelegations].filter(
            (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
          ),
          [...incomingDelegations].filter(
            (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
          )
        )
      );
    }
  }, [outgoingDelegations, incomingDelegations]);

  function printDelegations() {
    const outDelegations = [...outgoingDelegations].filter(
      (d) =>
        d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    );
    const inDelegations = [...incomingDelegations].filter(
      (d) =>
        d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    );
    return (
      <>
        <h5 className="pt-3 pb-1">Delegations</h5>
        <Accordion
          alwaysOpen
          className={styles.collectionDelegationsAccordion}
          activeKey={delegationKeys}>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem}`}
            eventKey={"0"}>
            <Accordion.Header
              onClick={() => {
                if (delegationKeys.includes("0")) {
                  setDelegationKeys(delegationKeys.filter((k) => k != "0"));
                } else {
                  setDelegationKeys([...delegationKeys, "0"]);
                }
                setDelegationKeysChanged(true);
              }}>
              Outgoing
            </Accordion.Header>
            <Accordion.Body>
              {printOutgoingDelegations("delegations", outDelegations)}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem} mt-3`}
            eventKey={"1"}>
            <Accordion.Header
              onClick={() => {
                if (delegationKeys.includes("1")) {
                  setDelegationKeys(delegationKeys.filter((k) => k != "1"));
                } else {
                  setDelegationKeys([...delegationKeys, "1"]);
                }
                setDelegationKeysChanged(true);
              }}>
              Incoming
            </Accordion.Header>
            <Accordion.Body>
              {printIncomingDelegations("delegations", inDelegations)}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </>
    );
  }

  function printSubDelegations() {
    return (
      <>
        <h5 className="pt-5 pb-1">
          Use A Delegation Manager (For Delegations or Consolidations)
        </h5>
        <Accordion
          alwaysOpen
          className={`${styles.collectionDelegationsAccordion} `}
          activeKey={subDelegationKeys}>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem}`}
            eventKey={"0"}>
            <Accordion.Header
              onClick={() => {
                if (subDelegationKeys.includes("0")) {
                  setSubDelegationKeys(
                    subDelegationKeys.filter((k) => k != "0")
                  );
                } else {
                  setSubDelegationKeys([...subDelegationKeys, "0"]);
                }
                setSubDelegationKeysChanged(true);
              }}>
              Outgoing
            </Accordion.Header>
            <Accordion.Body>
              {printOutgoingDelegations(
                "Delegation Managers",
                [...outgoingDelegations].filter(
                  (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem} mt-3`}
            eventKey={"1"}>
            <Accordion.Header
              onClick={() => {
                if (subDelegationKeys.includes("1")) {
                  setSubDelegationKeys(
                    subDelegationKeys.filter((k) => k != "1")
                  );
                } else {
                  setSubDelegationKeys([...subDelegationKeys, "1"]);
                }
                setSubDelegationKeysChanged(true);
              }}>
              Incoming
            </Accordion.Header>
            <Accordion.Body>
              {printIncomingDelegations(
                "Delegation Managers",
                [...incomingDelegations].filter(
                  (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
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
        <h5 className="pt-5 pb-1">Consolidations</h5>
        <Accordion
          alwaysOpen
          className={`${styles.collectionDelegationsAccordion}`}
          activeKey={consolidationKeys}>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem}`}
            eventKey={"0"}>
            <Accordion.Header
              onClick={() => {
                if (consolidationKeys.includes("0")) {
                  setConsolidationKeys(
                    consolidationKeys.filter((k) => k != "0")
                  );
                } else {
                  setConsolidationKeys([...consolidationKeys, "0"]);
                }
                setConsolidationKeysChanged(true);
              }}>
              Outgoing
            </Accordion.Header>
            <Accordion.Body>
              {printOutgoingDelegations(
                "consolidations",
                [...outgoingDelegations].filter(
                  (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem} mt-3`}
            eventKey={"1"}>
            <Accordion.Header
              onClick={() => {
                if (consolidationKeys.includes("1")) {
                  setConsolidationKeys(
                    consolidationKeys.filter((k) => k != "1")
                  );
                } else {
                  setConsolidationKeys([...consolidationKeys, "1"]);
                }
                setConsolidationKeysChanged(true);
              }}>
              Incoming
            </Accordion.Header>
            <Accordion.Body>
              {printIncomingDelegations(
                "consolidations",
                [...incomingDelegations].filter(
                  (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </>
    );
  }

  function printDelegationRowDetails(
    label: string,
    w: ContractWalletDelegation,
    consolidationStatus: string | undefined,
    pending: boolean,
    isConsolidation: boolean
  ) {
    return (
      <span className="d-flex flex-column gap-1">
        <DelegationWallet address={w.wallet} />
        <span className="d-flex align-items-center gap-3">
          <span className="font-color-h">
            {w.all ? `all tokens` : ` - token ID: ${w.tokens}`}
          </span>
          <span
            className={
              w.expiry === "expired"
                ? styles.delegationExpiredLabel
                : styles.delegationActiveLabel
            }>
            {w.expiry}
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
                  content={`${label} consolidation missing`}
                  placement={"top"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"></FontAwesomeIcon>
                </Tippy>
              )}
            </span>
          )}
        </span>
      </span>
    );
  }

  function addToBulkRevocations(del: ContractDelegation, wallet: string) {
    setBulkRevocations((bd) => [
      ...bd,
      {
        use_case: del.useCase.use_case,
        wallet: wallet,
      },
    ]);
  }

  function removeFromBulkRevocations(del: ContractDelegation, wallet: string) {
    const shouldKeepItem = (item: Revocation, del: ContractDelegation) =>
      !(
        item.use_case === del.useCase.use_case &&
        areEqualAddresses(item.wallet, wallet)
      );

    setBulkRevocations((bd) => bd.filter((item) => shouldKeepItem(item, del)));
  }

  function printOutgoingDelegationRow(
    index: number,
    delegations: number,
    del: ContractDelegation,
    w: ContractWalletDelegation,
    consolidationStatus: string | undefined,
    pending: boolean,
    isConsolidation: boolean
  ) {
    return (
      <tr key={`outgoing-${del.useCase.use_case}-${index}-${w.wallet}`}>
        <td>
          <div
            className={`d-flex flex-column gap-2 ${styles.delegationAccordionBlock}`}>
            <span className="d-flex align-items-center justify-content-between">
              <span className="d-flex gap-3 align-items-center">
                {delegations >= 2 && (
                  <FormCheck
                    disabled={
                      bulkRevocations.length == MAX_BULK_ACTIONS &&
                      !bulkRevocations.some(
                        (bd) =>
                          bd.use_case == del.useCase.use_case &&
                          areEqualAddresses(bd.wallet, w.wallet)
                      )
                    }
                    checked={bulkRevocations.some(
                      (bd) =>
                        bd.use_case == del.useCase.use_case &&
                        areEqualAddresses(bd.wallet, w.wallet)
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        addToBulkRevocations(del, w.wallet);
                      } else {
                        removeFromBulkRevocations(del, w.wallet);
                      }
                    }}
                  />
                )}
                {printDelegationRowDetails(
                  "Incoming",
                  w,
                  consolidationStatus,
                  pending,
                  isConsolidation
                )}
              </span>
              <span className="d-flex align-items-center gap-2">
                <Tippy content={"Edit"} placement={"top"} theme={"light"}>
                  <FontAwesomeIcon
                    icon="edit"
                    style={{ cursor: "pointer" }}
                    height={25}
                    onClick={() => {
                      setUpdateDelegationParams({
                        wallet: w.wallet,
                        use_case: del.useCase.use_case,
                        display: del.useCase.display,
                      });
                      setShowUpdateDelegation(true);
                      window.scrollTo(0, 0);
                    }}></FontAwesomeIcon>
                </Tippy>
                <Tippy content={"Revoke"} placement={"top"} theme={"light"}>
                  <FontAwesomeIcon
                    icon="xmark"
                    color="white"
                    fill="white"
                    style={{
                      cursor: "pointer",
                      borderRadius: "25px",
                      backgroundColor: "#c51d34",
                      padding: "5px",
                    }}
                    width={25}
                    height={25}
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
                    }}></FontAwesomeIcon>
                </Tippy>
              </span>
            </span>
          </div>
        </td>
      </tr>
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
                        del.useCase.use_case ===
                        CONSOLIDATION_USE_CASE.use_case;
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
                              consolidationStatus ===
                              "consolidation incomplete";
                            return printOutgoingDelegationRow(
                              index,
                              delegations,
                              del,
                              w,
                              consolidationStatus,
                              pending,
                              isConsolidation
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
                  <tr>
                    <td colSpan={4} className="pt-3">
                      selected:{" "}
                      {bulkRevocations.length === MAX_BULK_ACTIONS
                        ? `${MAX_BULK_ACTIONS} (max)`
                        : bulkRevocations.length}
                      &nbsp;&nbsp;
                      <button
                        disabled={bulkRevocations.length < 2}
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
                        {(contractWriteBatchRevoke.isPending ||
                          waitContractWriteBatchRevoke.isLoading) && (
                          <div className="d-inline">
                            <div
                              className={`spinner-border ${styles.loader}`}
                              role="status">
                              <span className="sr-only"></span>
                            </div>
                          </div>
                        )}
                      </button>
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

  function printIncomingDelegationRow(
    index: number,
    del: ContractDelegation,
    w: ContractWalletDelegation,
    consolidationStatus: string | undefined,
    pending: boolean,
    isConsolidation: boolean
  ) {
    return (
      <tr key={`incoming-${del.useCase.use_case}-${index}-${w.wallet}`}>
        <td>
          <div
            className={`d-flex flex-column gap-2 ${styles.delegationAccordionBlock}`}>
            <span className="d-flex align-items-center gap-3">
              {del.useCase.use_case == SUB_DELEGATION_USE_CASE.use_case ? (
                <FormCheck
                  checked={areEqualAddresses(
                    subDelegationOriginalDelegator,
                    w.wallet
                  )}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSubDelegationOriginalDelegator(w.wallet);
                    } else {
                      setSubDelegationOriginalDelegator(undefined);
                    }
                  }}
                />
              ) : (
                <></>
              )}
              {printDelegationRowDetails(
                "Outgoing",
                w,
                consolidationStatus,
                pending,
                isConsolidation
              )}
            </span>
          </div>
        </td>
      </tr>
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
                        del.useCase.use_case ===
                        CONSOLIDATION_USE_CASE.use_case;
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
                              consolidationStatus ===
                              "consolidation incomplete";
                            return printIncomingDelegationRow(
                              index,
                              del,
                              w,
                              consolidationStatus,
                              pending,
                              isConsolidation
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
                      <td colSpan={2} className="pt-3">
                        <span className="d-flex flex-wrap align-items-center gap-2">
                          <button
                            className={`${styles.useCaseWalletUpdate} ${
                              subDelegationOriginalDelegator === undefined
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
                          </button>
                          <button
                            className={`${styles.useCaseWalletUpdate} ${
                              subDelegationOriginalDelegator === undefined
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
                          </button>
                          <button
                            className={`${styles.useCaseWalletUpdate} ${
                              subDelegationOriginalDelegator === undefined
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
                          </button>
                          {(props.collection.contract ===
                            DELEGATION_ALL_ADDRESS ||
                            props.collection.contract ===
                              MEMES_COLLECTION.contract) && (
                            <button
                              className={`${styles.useCaseWalletUpdate} ${
                                subDelegationOriginalDelegator === undefined
                                  ? styles.useCaseWalletUpdateDisabled
                                  : ""
                              }`}
                              onClick={() => {
                                setShowAssignPrimaryAddressWithSub(true);
                                window.scrollTo(0, 0);
                              }}>
                              <FontAwesomeIcon
                                icon="plus"
                                className={styles.buttonIcon}
                              />
                              Assign Primary Address
                            </button>
                          )}
                          <button
                            className={`${styles.useCaseWalletRevoke} ${
                              subDelegationOriginalDelegator === undefined
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
                          </button>
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
            <button
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
                  collectionLockWrite.writeContract({
                    address: DELEGATION_CONTRACT.contract,
                    abi: DELEGATION_ABI,
                    chainId: DELEGATION_CONTRACT.chain_id,
                    args: [props.collection.contract, !collectionLockRead.data],
                    functionName: "setCollectionLock",
                  });
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
              {(collectionLockWrite.isPending ||
                waitCollectionLockWrite.isLoading) && <Spinner />}
            </button>
          </Col>
        </Row>
        <Row className="pt-3 pb-2">
          <Col xs={12} sm={12} md={4} lg={4} className="pt-2 pb-2">
            <Form.Select
              disabled={!!collectionLockRead.data}
              className={`${styles.formInputLockUseCase} ${
                collectionLockRead.data || collectionLockReadGlobal?.data
                  ? styles.formInputDisabled
                  : ""
              }`}
              value={lockUseCaseValue}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setLockUseCaseValue(value);
                if (value === CONSOLIDATION_USE_CASE.use_case) {
                  setLockUseCaseIndex(18);
                } else if (value === SUB_DELEGATION_USE_CASE.use_case) {
                  setLockUseCaseIndex(17);
                } else if (value === PRIMARY_ADDRESS_USE_CASE.use_case) {
                  setLockUseCaseIndex(16);
                } else {
                  setLockUseCaseIndex(value - 1);
                }
                useCaseLockWrite.reset();
              }}>
              <option value={0}>
                Lock/Unlock Use Case
                {collectionLockRead.data || collectionLockReadGlobal?.data
                  ? ` *`
                  : ``}
              </option>
              {ALL_USE_CASES.map((uc, index) => {
                if (uc.use_case != 1) {
                  const asteriskDisplay = useCaseLockStatusesGlobal.data?.[
                    index
                  ]
                    ? ` *`
                    : ``;
                  const lockDisplay =
                    useCaseLockStatuses.data?.[index] ||
                    useCaseLockStatusesGlobal.data?.[index] ||
                    collectionLockRead.data
                      ? ` - LOCKED${asteriskDisplay}`
                      : ` - UNLOCKED`;
                  return (
                    <option
                      key={`collection-delegation-select-use-case-${uc.use_case}`}
                      value={uc.use_case}>
                      #{uc.use_case} - {uc.display}
                      {lockDisplay}
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
              {!useCaseLockStatusesGlobal.data ||
              (useCaseLockStatusesGlobal?.data &&
                (useCaseLockStatusesGlobal?.data[
                  lockUseCaseIndex
                ] as any as boolean) === false) ? (
                <button
                  className={`${styles.lockUseCaseBtn}`}
                  onClick={() => {
                    const useCase = DELEGATION_USE_CASES[lockUseCaseIndex];
                    const title = `${
                      useCaseLockStatuses?.data?.[lockUseCaseIndex]
                        ? "Unlocking"
                        : "Locking"
                    } Wallet on Use Case #${useCase.use_case} - ${
                      useCase.display
                    }`;
                    let message = "Confirm in your wallet...";

                    if (chainsMatch()) {
                      useCaseLockWrite.writeContract({
                        address: DELEGATION_CONTRACT.contract,
                        abi: DELEGATION_ABI,
                        chainId: DELEGATION_CONTRACT.chain_id,
                        args: [
                          props.collection.contract,
                          lockUseCaseValue,
                          !useCaseLockStatuses.data?.[lockUseCaseIndex],
                        ],
                        functionName: "setCollectionUsecaseLock",
                      });
                    } else {
                      message = getSwitchToHtml();
                    }
                    setToast({ title, message });
                  }}>
                  <FontAwesomeIcon
                    icon={
                      useCaseLockStatuses.data?.[lockUseCaseIndex]
                        ? "lock"
                        : "lock-open"
                    }
                    className={styles.buttonIcon}
                  />
                  {useCaseLockStatuses.data?.[lockUseCaseIndex]
                    ? "Unlock"
                    : "Lock"}{" "}
                  Use Case
                  {(useCaseLockWrite.isPending ||
                    waitUseCaseLockWrite.isLoading) && <Spinner />}
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
        {collectionLockRead.data ? (
          <Row className="pb-3">
            <Col>
              <span className={styles.hint}>* Note:</span> Unlock Wallet to
              lock/unlock specific use cases
            </Col>
          </Row>
        ) : null}
        {collectionLockReadGlobal?.data ? (
          <Row className="pb-3">
            <Col>
              <span className={styles.hint}>* Note:</span> Unlock Wallet on{" "}
              <a href={`/delegation/${ANY_COLLECTION_PATH}`}>All Collections</a>{" "}
              to lock/unlock specific collections and use cases
            </Col>
          </Row>
        ) : null}
      </Container>
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          {props.collection && (
            <Container>
              <Row>
                <Col>
                  <h1 className="mb-0">{props.collection.title}</h1>
                </Col>
              </Row>
              <Row className="pb-4">
                <Col className="d-flex align-items-center justify-content-start">
                  <button
                    className={styles.backBtn}
                    onClick={() =>
                      props.setSection(DelegationCenterSection.CENTER)
                    }>
                    <FontAwesomeIcon icon="circle-arrow-left" />
                    <span className="font-smaller">
                      Back to Delegation Center
                    </span>
                  </button>
                </Col>
              </Row>
              {!showUpdateDelegation &&
                !showCreateNewDelegationWithSub &&
                !showCreateNewSubDelegationWithSub &&
                !showCreateNewConsolidationWithSub &&
                !showAssignPrimaryAddressWithSub &&
                !showRevokeDelegationWithSub && (
                  <>
                    {printDelegations()}
                    {printConsolidations()}
                    {printSubDelegations()}
                    {printLocks()}
                    <Container className="no-padding">
                      <Row className="pt-5 pb-3">
                        <Col className="d-flex align-items-center justify-content-start">
                          <button
                            className={styles.backBtn}
                            onClick={() =>
                              props.setSection(DelegationCenterSection.CENTER)
                            }>
                            <FontAwesomeIcon icon="circle-arrow-left" />
                            Back to Delegation Center
                          </button>
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

              {showAssignPrimaryAddressWithSub &&
                subDelegationOriginalDelegator && (
                  <NewAssignPrimaryAddress
                    subdelegation={{
                      originalDelegator: subDelegationOriginalDelegator,
                      collection: props.collection,
                    }}
                    address={accountResolution.address as string}
                    ens={ensResolution.data}
                    onHide={() => {
                      setShowAssignPrimaryAddressWithSub(false);
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
