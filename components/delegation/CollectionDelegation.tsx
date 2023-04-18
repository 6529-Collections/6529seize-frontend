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
  SUPPORTED_COLLECTIONS,
  SUB_DELEGATION_USE_CASE,
} from "../../pages/delegations-center/[contract]";
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
import Tippy from "@tippyjs/react";
import { AboutSection } from "../../pages/about/[section]";

const ConnectWalletButton = dynamic(() => import("./ConnectWalletButton"), {
  ssr: false,
});

const SwitchNetworkButton = dynamic(() => import("./SwitchNetworkButton"), {
  ssr: false,
});

const DelegationWallet = dynamic(() => import("./DelegationWallet"), {
  ssr: false,
});

const UpdateDelegationComponent = dynamic(() => import("./UpdateDelegation"), {
  ssr: false,
});

const NewDelegationComponent = dynamic(() => import("./NewDelegation"), {
  ssr: false,
});

const NewSubDelegationComponent = dynamic(() => import("./NewSubDelegation"), {
  ssr: false,
});

const NewConsolidationComponent = dynamic(() => import("./NewConsolidation"), {
  ssr: false,
});

const RevokeDelegationWithSubComponent = dynamic(
  () => import("./RevokeDelegationWithSub"),
  { ssr: false }
);

interface Props {
  collection: DelegationCollection;
}

interface ContractWalletDelegation {
  wallet: string;
  fetched: boolean;
  expiry?: string;
  all?: boolean;
  tokens?: number;
  consolidationStatus?: string;
}

interface ContractDelegation {
  useCase: any;
  wallets: ContractWalletDelegation[];
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
  const [outgoingDelegationsLoaded, setOutgoingDelegationsLoaded] =
    useState(false);

  const [incomingDelegations, setIncomingDelegations] = useState<
    ContractDelegation[]
  >([]);
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
    setOutgoingDelegations([]);
    setIncomingDelegations([]);
    setOutgoingDelegationsLoaded(false);
    setIncomingDelegationsLoaded(false);
  }, [accountResolution.address]);

  const retrieveOutgoingDelegations = useContractReads({
    contracts: getReadParams(
      accountResolution.address,
      props.collection.contract,
      "retrieveDelegationAddresses"
    ),
    enabled: chainsMatch() && accountResolution.isConnected,
    watch: true,
    onSettled(data, error) {
      if (data) {
        const delegations: ContractDelegation[] = [];
        data.map((d, index) => {
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
            (d as string[]).map((w) => {
              walletDelegations.push({ wallet: w, fetched: false });
            });
            delegations.push({
              useCase: useCase,
              wallets: walletDelegations,
            });
          }
        });
        setOutgoingDelegations(delegations);
        setOutgoingDelegationsLoaded(true);
      }
    },
  });

  const retrieveOutgoingDelegationsStatuses = useContractReads({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address,
      props.collection.contract,
      "retrieveDelegationAddressesTokensIDsandExpiredDates"
    ),
    watch: true,
    enabled:
      chainsMatch() &&
      accountResolution.isConnected &&
      outgoingDelegations.length > 0,
    onSettled(data, error) {
      if (data) {
        let delegations = [...outgoingDelegations];
        delegations.map((del, index) => {
          const active = (data as any[])[index];
          del.wallets.map((w) => {
            const i = active[0].indexOf(w.wallet);
            if (i > -1) {
              const myDate = active[1][i].toNumber();
              const myDateDisplay =
                new Date().getTime() / 1000 > myDate
                  ? `expired`
                  : myDate >= NEVER_DATE
                  ? `active`
                  : `active - expires ${formatExpiry(myDate)}`;
              w.expiry = myDateDisplay;
              w.all = active[2][i];
              w.tokens = active[3][i].toNumber();
              w.fetched = true;
            }
          });
        });
        setOutgoingDelegations(delegations);
      }
    },
  });

  const retrieveIncomingDelegations = useContractReads({
    contracts: getConsolidationReadParams(
      accountResolution.address,
      props.collection.contract,
      outgoingDelegations[CONSOLIDATION_USE_CASE.index]
    ),
    watch: true,
    enabled:
      chainsMatch() &&
      accountResolution.isConnected &&
      outgoingDelegations.length > 0,
    onSettled(data, error) {
      if (data) {
        outgoingDelegations.map((d) => {
          if (d.useCase.use_case == CONSOLIDATION_USE_CASE.use_case) {
            d.wallets.map((w, index) => {
              const active = data[index];
              if (active) {
                w.consolidationStatus = "consolidation active";
              } else {
                w.consolidationStatus = "consolidation pending";
              }
            });
          }
        });
      }
    },
  });

  const retrieveIncomingDelegationsStatuses = useContractReads({
    contracts: getReadParams(
      accountResolution.address,
      props.collection.contract,
      "retrieveDelegators"
    ),
    enabled: chainsMatch() && accountResolution.isConnected,
    watch: true,
    onSettled(data, error) {
      if (data) {
        const delegations: ContractDelegation[] = [];
        data.map((d, index) => {
          const walletDelegations: ContractWalletDelegation[] = [];
          const useCase =
            DELEGATION_USE_CASES.length > index
              ? DELEGATION_USE_CASES[index]
              : index == SUB_DELEGATION_USE_CASE.index
              ? SUB_DELEGATION_USE_CASE
              : index == CONSOLIDATION_USE_CASE.index
              ? CONSOLIDATION_USE_CASE
              : null;
          (d as string[]).map((w) => {
            walletDelegations.push({ wallet: w, fetched: false });
          });
          delegations.push({
            useCase: useCase,
            wallets: walletDelegations,
          });
        });
        setIncomingDelegations(delegations);
        setIncomingDelegationsLoaded(true);
      }
    },
  });

  useContractReads({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address,
      props.collection.contract,
      "retrieveDelegatorsTokensIDsandExpiredDates"
    ),
    watch: true,
    enabled:
      chainsMatch() &&
      accountResolution.isConnected &&
      incomingDelegations.length > 0,
    onSettled(data, error) {
      if (data) {
        let delegations = [...incomingDelegations];
        delegations.map((del, index) => {
          const active = (data as any[])[index];
          del.wallets.map((w) => {
            const i = active[0].indexOf(w.wallet);
            if (i > -1) {
              const myDate = active[1][i].toNumber();
              const myDateDisplay =
                new Date().getTime() / 1000 > myDate
                  ? `expired`
                  : myDate >= NEVER_DATE
                  ? `active`
                  : `active - expires ${formatExpiry(myDate)}`;
              w.expiry = myDateDisplay;
              w.all = active[2][i];
              w.tokens = active[3][i].toNumber();
              w.fetched = true;
            }
          });
        });
        setIncomingDelegations(delegations);
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
    enabled:
      chainsMatch() &&
      accountResolution.isConnected &&
      incomingDelegations.length > 0,
    onSettled(data, error) {
      if (data) {
        incomingDelegations.map((d) => {
          if (d.useCase.use_case == CONSOLIDATION_USE_CASE.use_case) {
            d.wallets.map((w, index) => {
              const active = data[index];
              if (active) {
                w.consolidationStatus = "consolidation active";
              } else {
                w.consolidationStatus = "consolidation pending";
              }
            });
          }
        });
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
        enabled: chainsMatch() && accountResolution.isConnected,
        watch: true,
      });

  const useCaseLockStatuses = useContractReads({
    contracts: getReadParams(
      props.collection.contract,
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
        enabled: chainsMatch() && accountResolution.isConnected,
        watch: true,
      });

  const collectionLockRead = useContractRead({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    functionName: "retrieveCollectionLockStatus",
    args: [props.collection.contract, accountResolution.address],
    enabled: chainsMatch() && accountResolution.isConnected,
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
    if (!showToast) {
      setOutgoingDelegations([]);
      setOutgoingDelegationsLoaded(false);
      retrieveOutgoingDelegations.refetch();
      retrieveOutgoingDelegationsStatuses.refetch();

      setIncomingDelegations([]);
      setIncomingDelegationsLoaded(false);
      retrieveIncomingDelegations.refetch();
      retrieveIncomingDelegationsStatuses.refetch();

      setRevokeDelegationParams(undefined);
      setBatchRevokeDelegationParams(undefined);
      setToast(undefined);
      setLockUseCaseValue(0);
      setLockUseCaseIndex(0);
      useCaseLockWrite.reset();
      collectionLockWrite.reset();
      contractWriteRevoke.reset();
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

  function printDelegations() {
    return (
      <>
        <h5 className="float-none pt-3 pb-1">Delegations</h5>
        <Accordion alwaysOpen className={styles.collectionDelegationsAccordion}>
          <Accordion.Item
            className={styles.collectionDelegationsAccordionItem}
            eventKey={"0"}>
            <Accordion.Header>Outgoing Delegations</Accordion.Header>
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
            <Accordion.Header>Incoming Delegations</Accordion.Header>
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
        <h5 className="float-none pt-5 pb-1">Sub-Delegations</h5>
        <Accordion
          alwaysOpen
          className={`${styles.collectionDelegationsAccordion}`}>
          <Accordion.Item
            className={styles.collectionDelegationsAccordionItem}
            eventKey={"0"}>
            <Accordion.Header>Outgoing Sub-Delegations</Accordion.Header>
            <Accordion.Body>
              {printOutgoingDelegations(
                "sub-delegations",
                [...outgoingDelegations].filter(
                  (d) => d.useCase.use_case == SUB_DELEGATION_USE_CASE.use_case
                )
              )}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item
            className={`${styles.collectionDelegationsAccordionItem} mt-3`}
            eventKey={"1"}>
            <Accordion.Header>Incoming Sub-Delegations</Accordion.Header>
            <Accordion.Body>
              {printIncomingDelegations(
                "sub-delegations",
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
            className={styles.collectionDelegationsAccordionItem}
            eventKey={"0"}>
            <Accordion.Header>Outgoing Consolidations</Accordion.Header>
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
            <Accordion.Header>Incoming Consolidations</Accordion.Header>
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
                                  {w.fetched ? (
                                    <span
                                      className={styles.delegationActiveLabel}>
                                      {w.expiry}
                                      {w.all
                                        ? ` - all tokens`
                                        : ` - token ID: ${w.tokens}`}
                                    </span>
                                  ) : (
                                    <span
                                      className={
                                        styles.delegationFetchingLabel
                                      }>
                                      fetching status
                                    </span>
                                  )}
                                  {del.useCase.use_case ==
                                    CONSOLIDATION_USE_CASE.use_case && (
                                    <span
                                      className={
                                        w.consolidationStatus ==
                                        "consolidation active"
                                          ? styles.consolidationActiveLabel
                                          : styles.consolidationNotAcceptedLabel
                                      }>
                                      {w.consolidationStatus}
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
                                      setToast({
                                        title: "Revoking Delegation",
                                        message: "Confirm in your wallet...",
                                      });
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
                            setToast({
                              title: "Batch Revoking Delegations",
                              message: "Confirm in your wallet...",
                            });
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
                                  {w.fetched ? (
                                    <span
                                      className={styles.delegationActiveLabel}>
                                      {w.expiry}
                                      {w.all
                                        ? ` - all tokens`
                                        : ` - token ID: ${w.tokens}`}
                                    </span>
                                  ) : (
                                    <span
                                      className={
                                        styles.delegationFetchingLabel
                                      }>
                                      fetching status
                                    </span>
                                  )}
                                  {del.useCase.use_case ==
                                    CONSOLIDATION_USE_CASE.use_case && (
                                    <span
                                      className={
                                        w.consolidationStatus ==
                                        "consolidation active"
                                          ? styles.consolidationActiveLabel
                                          : styles.consolidationNotAcceptedLabel
                                      }>
                                      {w.consolidationStatus}
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
                          Register Sub-Delegation
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
                {collectionLockRead.data != null && (
                  <span
                    className={`${styles.lockDelegationBtn} ${
                      collectionLockReadGlobal?.data
                        ? styles.lockDelegationBtnDisabled
                        : ""
                    }`}
                    onClick={() => {
                      setToast({
                        title: `${
                          collectionLockRead.data ? `Unlocking` : `Locking`
                        } Wallet`,
                        message: "Confirm in your wallet...",
                      });
                      collectionLockWrite.write?.();
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
                )}
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
                {DELEGATION_USE_CASES.map((uc, index) => {
                  if (uc.use_case != 1) {
                    return (
                      <option
                        key={`collection-delegation-select-use-case-${uc.use_case}`}
                        value={uc.use_case}>
                        #{uc.use_case} - {uc.display}
                        {(useCaseLockStatuses.data &&
                          useCaseLockStatuses.data[index] == true) ||
                        (useCaseLockStatusesGlobal?.data &&
                          useCaseLockStatusesGlobal?.data[index] == true) ||
                        collectionLockRead.data
                          ? ` - LOCKED${
                              useCaseLockStatusesGlobal?.data &&
                              useCaseLockStatusesGlobal?.data[index] == true
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
                  useCaseLockStatusesGlobal?.data[lockUseCaseIndex] ==
                    false) ? (
                  <button
                    className={`${styles.lockUseCaseBtn}`}
                    onClick={() => {
                      const useCase = DELEGATION_USE_CASES[lockUseCaseIndex];
                      setToast({
                        title: `${
                          useCaseLockStatuses.data &&
                          useCaseLockStatuses.data[lockUseCaseIndex]
                            ? "Unlocking"
                            : "Locking"
                        } Wallet on Use Case #${useCase.use_case} - ${
                          useCase.display
                        }`,
                        message: "Confirm in your wallet...",
                      });
                      useCaseLockWrite.write?.();
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
                    <a href={`/delegations-center/${ANY_COLLECTION_PATH}`}>
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
                <a href={`/delegations-center/${ANY_COLLECTION_PATH}`}>
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
                            <a
                              href={`/delegations-center`}
                              className={styles.backBtn}>
                              <FontAwesomeIcon icon="circle-arrow-left" />
                              Back to Delegations Center
                            </a>
                          </Col>
                        </Row>
                      </Container>
                    </>
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
                  subDelegationOriginalDelegator && (
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
          {(!accountResolution.isConnected ||
            networkResolution.chain?.id != DELEGATION_CONTRACT.chain_id) && (
            <Row className="pt-5">
              <Col className="d-flex justify-content-center">
                <h4>
                  <a
                    href={`/delegations-center/documentation`}
                    className={styles.documentationLink}>
                    <span>
                      <FontAwesomeIcon icon="info-circle"></FontAwesomeIcon>
                      Documentation
                    </span>
                  </a>
                </h4>
              </Col>
            </Row>
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
