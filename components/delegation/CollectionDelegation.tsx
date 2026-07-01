"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  useChainId,
  useEnsName,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import styles from "./Delegation.module.scss";

import { DELEGATION_ABI } from "@/abis/abis";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NULL_ADDRESS,
} from "@/constants/constants";
import { areEqualAddresses, getTransactionLink } from "@/helpers/Helpers";
import { DelegationCenterSection } from "@/types/enums";
import {
  faCircleArrowLeft,
  faEdit,
  faInfoCircle,
  faLock,
  faLockOpen,
  faMinus,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { Spinner } from "../dotLoader/DotLoader";
import {
  getDelegationsFromData,
  getParams,
  getReadParams,
  type ContractDelegation,
  type ContractWalletDelegation,
} from "./CollectionDelegation.utils";
import type { DelegationCollection } from "./delegation-constants";
import { DelegationToast, useDelegationToast } from "./DelegationToast";
import {
  ALL_USE_CASES,
  ANY_COLLECTION_PATH,
  CONSOLIDATION_USE_CASE,
  DELEGATION_USE_CASES,
  GRADIENTS_COLLECTION,
  MAX_BULK_ACTIONS,
  MEME_LAB_COLLECTION,
  MEMES_COLLECTION,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "./delegation-constants";
import DelegationWallet from "./DelegationWallet";
import NewAssignPrimaryAddress from "./NewAssignPrimaryAddress";
import NewConsolidationComponent from "./NewConsolidation";
import NewDelegationComponent from "./NewDelegation";
import NewSubDelegationComponent from "./NewSubDelegation";
import RevokeDelegationWithSubComponent from "./RevokeDelegationWithSub";
import UpdateDelegationComponent from "./UpdateDelegation";

interface Props {
  setSection(section: DelegationCenterSection): any;
  collection: DelegationCollection;
}

interface Revocation {
  use_case: number;
  wallet: string;
}

function toggleDisclosureKey(
  key: string,
  setKeys: Dispatch<SetStateAction<string[]>>,
  setChanged: Dispatch<SetStateAction<boolean>>
) {
  setKeys((keys) =>
    keys.includes(key)
      ? keys.filter((current) => current !== key)
      : [...keys, key]
  );
  setChanged(true);
}

type TransactionHash = `0x${string}`;

function getTransactionAnchor(hash: TransactionHash) {
  return (
    <a
      href={getTransactionLink(DELEGATION_CONTRACT.chain_id, hash)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles["etherscanLink"]}
    >
      view
    </a>
  );
}

function getTransactionToastMessage(
  hash: TransactionHash,
  waiting: boolean
): ReactNode {
  if (waiting) {
    return (
      <>
        Transaction submitted... {getTransactionAnchor(hash)}
        <br />
        Waiting for confirmation...
      </>
    );
  }

  return <>Transaction Successful! {getTransactionAnchor(hash)}</>;
}

function getTransactionErrorToastMessage(
  error: { message?: string } | null | undefined,
  fallback: string
) {
  const message = error?.message?.split("Request Arguments")[0]?.trim();
  return message || fallback;
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

function getDelegationsCount(delegations: ContractDelegation[]) {
  let count = 0;
  for (const delegation of delegations) {
    if (delegation.wallets.length > 0) {
      count += delegation.wallets.length;
    }
  }
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

function getCollectionScopeDescription(collection: DelegationCollection) {
  if (areEqualAddresses(collection.contract, DELEGATION_ALL_ADDRESS)) {
    return "Records here apply across every supported delegation collection.";
  }

  if (areEqualAddresses(collection.contract, MEMES_COLLECTION.contract)) {
    return "Records here apply only to The Memes collection.";
  }

  if (areEqualAddresses(collection.contract, MEME_LAB_COLLECTION.contract)) {
    return "Records here apply only to Meme Lab.";
  }

  if (areEqualAddresses(collection.contract, GRADIENTS_COLLECTION.contract)) {
    return "Records here apply only to 6529 Gradient.";
  }

  return "Records here apply to the selected collection scope.";
}

const CHECKBOX_CLASS =
  "tw-h-4 tw-w-4 tw-cursor-pointer tw-border-0 tw-bg-white tw-text-black focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";
const LOCK_SELECT_CLASS =
  "tw-block tw-w-full tw-min-w-0 tw-border tw-border-solid tw-border-iron-300 tw-bg-white tw-px-3 tw-py-2 tw-text-base tw-leading-6 tw-text-black focus:tw-border-primary-400 focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-opacity-75";

function DelegationDisclosurePanel(
  props: Readonly<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: ReactNode;
    className?: string | undefined;
  }>
) {
  return (
    <section
      className={`tw-overflow-hidden tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 ${props.className ?? ""}`}
    >
      <h6 className="tw-m-0">
        <button
          type="button"
          className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-bg-iron-800 tw-px-4 tw-py-3 tw-text-left tw-font-bold tw-text-iron-50 hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          aria-expanded={props.isOpen}
          onClick={props.onToggle}
        >
          <span>{props.title}</span>
          <span aria-hidden="true">{props.isOpen ? "-" : "+"}</span>
        </button>
      </h6>
      {props.isOpen && (
        <div className="tw-bg-iron-950 tw-p-3">{props.children}</div>
      )}
    </section>
  );
}

export default function CollectionDelegationComponent(props: Readonly<Props>) {
  const accountResolution = useSeizeConnectContext();
  const previousAccountAddressRef = useRef<string | undefined>(undefined);
  // The refs hold the title for the lock write currently in flight. Set them
  // immediately before each writeContract call so success/error toasts stay tied
  // to the user action that opened the wallet.
  const collectionLockToastTitleRef = useRef("Locking Wallet");
  const useCaseLockToastTitleRef = useRef("Locking Wallet");
  const networkResolution = useChainId();
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
    return networkResolution === DELEGATION_CONTRACT.chain_id;
  }

  function getSwitchToMessage() {
    return (
      <span className={styles["switchNetworkMessage"]}>
        Switch to{" "}
        {DELEGATION_CONTRACT.chain_id === 1
          ? "Ethereum Mainnet"
          : "Sepolia Network"}
      </span>
    );
  }

  const retrieveOutgoingDelegations = useReadContracts({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address as `0x${string}`,
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
      accountResolution.address as `0x${string}`,
      props.collection.contract,
      outgoingDelegations[CONSOLIDATION_USE_CASE.index]!
    ),
    query: {
      enabled: accountResolution.isConnected && outgoingDelegations.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (!retrieveOutgoingConsolidations.data) {
      return;
    }

    const consolidationDelegations =
      outgoingDelegations[CONSOLIDATION_USE_CASE.index];

    if (!consolidationDelegations?.wallets.length) {
      setOutgoingActiveConsolidations([]);
      return;
    }

    const activeConsolidations = consolidationDelegations.wallets.map(
      (walletDelegation, index) => ({
        wallet: walletDelegation.wallet,
        status: retrieveOutgoingConsolidations.data?.[index]?.result
          ? "consolidation active"
          : "consolidation incomplete",
      })
    );

    setOutgoingActiveConsolidations(activeConsolidations);
  }, [outgoingDelegations, retrieveOutgoingConsolidations.data]);

  const retrieveIncomingDelegations = useReadContracts({
    contracts: getActiveDelegationsReadParams(
      accountResolution.address as `0x${string}`,
      props.collection.contract,
      "retrieveDelegatorsTokensIDsandExpiredDates"
    ),
    query: {
      enabled: accountResolution.isConnected,
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
      accountResolution.address as `0x${string}`,
      props.collection.contract,
      incomingDelegations[CONSOLIDATION_USE_CASE.index]!
    ),
    query: {
      enabled: accountResolution.isConnected && incomingDelegations.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (!retrieveIncomingConsolidations.data) {
      return;
    }

    const consolidationDelegations =
      incomingDelegations[CONSOLIDATION_USE_CASE.index];

    if (!consolidationDelegations?.wallets.length) {
      setIncomingActiveConsolidations([]);
      return;
    }

    const activeConsolidations = consolidationDelegations.wallets.map(
      (walletDelegation, index) => ({
        wallet: walletDelegation.wallet,
        status: retrieveIncomingConsolidations.data?.[index]?.result
          ? "consolidation active"
          : "consolidation incomplete",
      })
    );

    setIncomingActiveConsolidations(activeConsolidations);
  }, [incomingDelegations, retrieveIncomingConsolidations.data]);

  const useCaseLockStatusesGlobalParams = areEqualAddresses(
    props.collection.contract,
    DELEGATION_ALL_ADDRESS
  )
    ? {}
    : {
        contracts: getReadParams(
          DELEGATION_ALL_ADDRESS,
          accountResolution.address as `0x${string}`,
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
      accountResolution.address as `0x${string}`,
      "retrieveCollectionUseCaseLockStatus",
      ALL_USE_CASES
    ),
    query: {
      enabled: accountResolution.isConnected,
      refetchInterval: 10000,
    },
  });

  const { refetch: refetchUseCaseLockStatuses } = useCaseLockStatuses;

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

  const {
    toastRef,
    toast,
    showToast,
    showDelegationToast,
    clearDelegationToast,
    setToastVisibility,
  } = useDelegationToast();

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
      refetchUseCaseLockStatuses();
    }
  }, [
    accountResolution.isConnected,
    refetchUseCaseLockStatuses,
    waitUseCaseLockWrite.isSuccess,
  ]);

  useEffect(() => {
    if (contractWriteRevoke.error) {
      showDelegationToast({
        title: "Revoking Delegation Failed",
        message: getTransactionErrorToastMessage(
          contractWriteRevoke.error,
          "Failed to start revoking delegation."
        ),
      });
    }
    if (contractWriteRevoke.data) {
      if (waitContractWriteRevoke.isLoading) {
        showDelegationToast({
          title: "Revoking Delegation",
          message: getTransactionToastMessage(contractWriteRevoke.data, true),
        });
      } else if (waitContractWriteRevoke.isSuccess) {
        showDelegationToast({
          title: "Revoking Delegation",
          message: getTransactionToastMessage(contractWriteRevoke.data, false),
        });
      } else if (waitContractWriteRevoke.isError) {
        showDelegationToast({
          title: "Revoking Delegation Failed",
          message: getTransactionErrorToastMessage(
            waitContractWriteRevoke.error,
            "Transaction failed while waiting for confirmation."
          ),
        });
      }
    }
  }, [
    contractWriteRevoke.error,
    contractWriteRevoke.data,
    showDelegationToast,
    waitContractWriteRevoke.error,
    waitContractWriteRevoke.isError,
    waitContractWriteRevoke.isLoading,
    waitContractWriteRevoke.isSuccess,
  ]);

  useEffect(() => {
    if (contractWriteBatchRevoke.error) {
      showDelegationToast({
        title: "Revoking Delegations Failed",
        message: getTransactionErrorToastMessage(
          contractWriteBatchRevoke.error,
          "Failed to start revoking delegations."
        ),
      });
    }
    if (contractWriteBatchRevoke.data) {
      if (waitContractWriteBatchRevoke.isLoading) {
        showDelegationToast({
          title: "Batch Revoking Delegations",
          message: getTransactionToastMessage(
            contractWriteBatchRevoke.data,
            true
          ),
        });
      } else if (waitContractWriteBatchRevoke.isSuccess) {
        setBulkRevocations([]);
        showDelegationToast({
          title: "Batch Revoking Delegations",
          message: getTransactionToastMessage(
            contractWriteBatchRevoke.data,
            false
          ),
        });
      } else if (waitContractWriteBatchRevoke.isError) {
        showDelegationToast({
          title: "Revoking Delegations Failed",
          message: getTransactionErrorToastMessage(
            waitContractWriteBatchRevoke.error,
            "Transaction failed while waiting for confirmation."
          ),
        });
      }
    }
  }, [
    contractWriteBatchRevoke.error,
    contractWriteBatchRevoke.data,
    showDelegationToast,
    waitContractWriteBatchRevoke.error,
    waitContractWriteBatchRevoke.isError,
    waitContractWriteBatchRevoke.isLoading,
    waitContractWriteBatchRevoke.isSuccess,
  ]);

  useEffect(() => {
    const title = collectionLockToastTitleRef.current;

    if (collectionLockWrite.error) {
      showDelegationToast({
        title,
        message: getTransactionErrorToastMessage(
          collectionLockWrite.error,
          "Failed to start wallet lock update."
        ),
      });
    }
    if (collectionLockWrite.data) {
      if (waitCollectionLockWrite.isLoading) {
        showDelegationToast({
          title,
          message: getTransactionToastMessage(collectionLockWrite.data, true),
        });
      } else if (waitCollectionLockWrite.isSuccess) {
        showDelegationToast({
          title,
          message: getTransactionToastMessage(collectionLockWrite.data, false),
        });
      } else if (waitCollectionLockWrite.isError) {
        showDelegationToast({
          title: `${title} Failed`,
          message: getTransactionErrorToastMessage(
            waitCollectionLockWrite.error,
            "Transaction failed while waiting for confirmation."
          ),
        });
      }
    }
  }, [
    collectionLockWrite.error,
    collectionLockWrite.data,
    showDelegationToast,
    waitCollectionLockWrite.error,
    waitCollectionLockWrite.isError,
    waitCollectionLockWrite.isLoading,
    waitCollectionLockWrite.isSuccess,
  ]);

  useEffect(() => {
    const title = useCaseLockToastTitleRef.current;

    if (useCaseLockWrite.error) {
      showDelegationToast({
        title: title,
        message: getTransactionErrorToastMessage(
          useCaseLockWrite.error,
          "Failed to start use-case lock update."
        ),
      });
    }
    if (useCaseLockWrite.data) {
      if (waitUseCaseLockWrite.isLoading) {
        showDelegationToast({
          title: title,
          message: getTransactionToastMessage(useCaseLockWrite.data, true),
        });
      } else if (waitUseCaseLockWrite.isSuccess) {
        showDelegationToast({
          title: title,
          message: getTransactionToastMessage(useCaseLockWrite.data, false),
        });
      } else if (waitUseCaseLockWrite.isError) {
        showDelegationToast({
          title: `${title} Failed`,
          message: getTransactionErrorToastMessage(
            waitUseCaseLockWrite.error,
            "Transaction failed while waiting for confirmation."
          ),
        });
      }
    }
  }, [
    useCaseLockWrite.error,
    useCaseLockWrite.data,
    showDelegationToast,
    waitUseCaseLockWrite.error,
    waitUseCaseLockWrite.isError,
    waitUseCaseLockWrite.isLoading,
    waitUseCaseLockWrite.isSuccess,
  ]);

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
  }, [contractWriteRevoke, revokeDelegationParams]);

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

  function resetDelegationWriteResults() {
    collectionLockToastTitleRef.current = "Locking Wallet";
    useCaseLockToastTitleRef.current = "Locking Wallet";
    useCaseLockWrite.reset();
    collectionLockWrite.reset();
    contractWriteRevoke.reset();
    contractWriteBatchRevoke.reset();
  }

  function setCollectionToastVisibility(show: boolean) {
    setToastVisibility(show);
    if (!show) {
      resetDelegationWriteResults();
    }
  }

  const reset = useEffectEvent((options?: { clearToast?: boolean }) => {
    setOutgoingDelegations([]);
    setOutgoingDelegationsLoaded(false);
    retrieveOutgoingDelegations.refetch();

    setIncomingDelegations([]);
    setIncomingDelegationsLoaded(false);
    retrieveIncomingDelegations.refetch();

    setRevokeDelegationParams(undefined);
    setBatchRevokeDelegationParams(undefined);
    if (options?.clearToast) {
      clearDelegationToast();
    }
    setLockUseCaseValue(0);
    setLockUseCaseIndex(0);
    resetDelegationWriteResults();
  });

  useEffect(() => {
    const previousAddress = previousAccountAddressRef.current;
    const currentAddress = accountResolution.address;

    previousAccountAddressRef.current = currentAddress;

    reset({
      clearToast: Boolean(
        previousAddress && previousAddress !== currentAddress
      ),
    });
  }, [accountResolution.address]);

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
  }, [
    incomingDelegations,
    outgoingDelegations,
    consolidationKeysChanged,
    delegationKeysChanged,
    subDelegationKeysChanged,
  ]);

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
        <h5 className="tw-pb-1 tw-pt-3">Delegations</h5>
        <p className={styles["collectionSectionIntro"]}>
          Delegations let another wallet use NFT utility for this collection
          scope without moving the NFT.
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title="Outgoing Delegations"
            isOpen={delegationKeys.includes("0")}
            onToggle={() =>
              toggleDisclosureKey(
                "0",
                setDelegationKeys,
                setDelegationKeysChanged
              )
            }
          >
            {printOutgoingDelegations("delegations", outDelegations)}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title="Incoming Delegations"
            isOpen={delegationKeys.includes("1")}
            onToggle={() =>
              toggleDisclosureKey(
                "1",
                setDelegationKeys,
                setDelegationKeysChanged
              )
            }
          >
            {printIncomingDelegations("delegations", inDelegations)}
          </DelegationDisclosurePanel>
        </div>
      </>
    );
  }

  function printSubDelegations() {
    return (
      <>
        <h5 className="tw-pb-1 tw-pt-4">Delegation Managers</h5>
        <p className={styles["collectionSectionIntro"]}>
          Manager rights let another wallet maintain delegations or
          consolidations for this collection scope.
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title="Outgoing Manager Rights"
            isOpen={subDelegationKeys.includes("0")}
            onToggle={() =>
              toggleDisclosureKey(
                "0",
                setSubDelegationKeys,
                setSubDelegationKeysChanged
              )
            }
          >
            {printOutgoingDelegations(
              "Delegation Managers",
              [...outgoingDelegations].filter(
                (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
              )
            )}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title="Incoming Manager Rights"
            isOpen={subDelegationKeys.includes("1")}
            onToggle={() =>
              toggleDisclosureKey(
                "1",
                setSubDelegationKeys,
                setSubDelegationKeysChanged
              )
            }
          >
            {printIncomingDelegations(
              "Delegation Managers",
              [...incomingDelegations].filter(
                (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
              ),
              true
            )}
          </DelegationDisclosurePanel>
        </div>
      </>
    );
  }

  function printConsolidations() {
    return (
      <>
        <h5 className="tw-pb-1 tw-pt-4">Consolidations</h5>
        <p className={styles["collectionSectionIntro"]}>
          Consolidations link wallets you control so 6529 can treat them
          together for collection metrics.
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title="Outgoing Consolidations"
            isOpen={consolidationKeys.includes("0")}
            onToggle={() =>
              toggleDisclosureKey(
                "0",
                setConsolidationKeys,
                setConsolidationKeysChanged
              )
            }
          >
            {printOutgoingDelegations(
              "consolidations",
              [...outgoingDelegations].filter(
                (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
              )
            )}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title="Incoming Consolidations"
            isOpen={consolidationKeys.includes("1")}
            onToggle={() =>
              toggleDisclosureKey(
                "1",
                setConsolidationKeys,
                setConsolidationKeysChanged
              )
            }
          >
            {printIncomingDelegations(
              "consolidations",
              [...incomingDelegations].filter(
                (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
              )
            )}
          </DelegationDisclosurePanel>
        </div>
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
      <span className="tw-flex tw-flex-col tw-gap-1">
        <DelegationWallet address={w.wallet} />
        <span className="tw-flex tw-items-center tw-gap-3">
          <span className="font-color-h">
            {w.all ? `all tokens` : ` - token ID: ${w.tokens}`}
          </span>
          <span
            className={
              w.expiry === "expired"
                ? styles["delegationExpiredLabel"]
                : styles["delegationActiveLabel"]
            }
          >
            {w.expiry}
          </span>
          {isConsolidation && (
            <span
              className={
                !pending
                  ? styles["consolidationActiveLabel"]
                  : styles["consolidationNotAcceptedLabel"]
              }
            >
              {consolidationStatus}
              {pending && (
                <>
                  <FontAwesomeIcon
                    className={styles["infoIcon"]}
                    icon={faInfoCircle}
                    data-tooltip-id={`consolidation-missing-${label}`}
                  ></FontAwesomeIcon>
                  <Tooltip
                    id={`consolidation-missing-${label}`}
                    style={{
                      backgroundColor: "#1F2937",
                      color: "white",
                      padding: "4px 8px",
                    }}
                  >
                    {label} consolidation missing
                  </Tooltip>
                </>
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
    delegationIndex: number,
    walletIndex: number,
    delegations: number,
    del: ContractDelegation,
    w: ContractWalletDelegation,
    consolidationStatus: string | undefined,
    pending: boolean,
    isConsolidation: boolean
  ) {
    return (
      <tr
        key={`outgoing-${del.useCase.use_case}-${delegationIndex}-${walletIndex}-${w.wallet}`}
      >
        <td>
          <div className="tw-flex tw-flex-col tw-gap-2 tw-bg-[rgb(34,34,34)] tw-px-[15px] tw-pb-2.5 tw-pt-3">
            <span className="tw-flex tw-items-center tw-justify-between">
              <span className="tw-flex tw-items-center tw-gap-3">
                {delegations >= 2 && (
                  <input
                    aria-label={`Select ${w.wallet} for bulk revoke`}
                    type="checkbox"
                    className={CHECKBOX_CLASS}
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
              <span className="tw-flex tw-items-center tw-gap-2">
                <>
                  <FontAwesomeIcon
                    icon={faEdit}
                    style={{ cursor: "pointer" }}
                    height={25}
                    data-tooltip-id={`edit-${del.useCase.use_case}-${w.wallet}`}
                    onClick={() => {
                      setUpdateDelegationParams({
                        wallet: w.wallet,
                        use_case: del.useCase.use_case,
                        display: del.useCase.display,
                      });
                      setShowUpdateDelegation(true);
                      window.scrollTo(0, 0);
                    }}
                  ></FontAwesomeIcon>
                  <Tooltip
                    id={`edit-${del.useCase.use_case}-${w.wallet}`}
                    style={{
                      backgroundColor: "#1F2937",
                      color: "white",
                      padding: "4px 8px",
                    }}
                  >
                    Edit
                  </Tooltip>
                </>
                <>
                  <FontAwesomeIcon
                    icon={faXmark}
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
                    data-tooltip-id={`revoke-${del.useCase.use_case}-${w.wallet}`}
                    onClick={() => {
                      const title = "Revoking Delegation";
                      let message: ReactNode = "Confirm in your wallet...";
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
                        message = getSwitchToMessage();
                      }
                      showDelegationToast({ title, message });
                    }}
                  ></FontAwesomeIcon>
                  <Tooltip
                    id={`revoke-${del.useCase.use_case}-${w.wallet}`}
                    style={{
                      backgroundColor: "#1F2937",
                      color: "white",
                      padding: "4px 8px",
                    }}
                  >
                    Revoke
                  </Tooltip>
                </>
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
      <div className="tw-w-full tw-p-0">
        <div className={styles["delegationsTableScrollContainer"]}>
          <div className="tw-w-full">
            <table className={`${styles["delegationsTable"]} tw-w-full`}>
              <tbody>
                {delegations > 0 ? (
                  myDelegations.map((del, index: number) => {
                    if (!del.wallets.length) return null;
                    const isConsolidation =
                      del.useCase.use_case === CONSOLIDATION_USE_CASE.use_case;
                    return (
                      <Fragment
                        key={`outgoing-${del.useCase.use_case}-${index}`}
                      >
                        <tr>
                          <td
                            colSpan={4}
                            className={styles["delegationsTableUseCaseHeader"]}
                          >
                            #{del.useCase.use_case} - {del.useCase.display}
                          </td>
                        </tr>
                        {del.wallets.map((w, walletIndex) => {
                          const consolidationStatus =
                            outgoingActiveConsolidations.find((i) =>
                              areEqualAddresses(w.wallet, i.wallet)
                            )?.status;
                          const pending =
                            consolidationStatus === "consolidation incomplete";
                          return printOutgoingDelegationRow(
                            index,
                            walletIndex,
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
                  })
                ) : !outgoingDelegationsLoaded ? (
                  <tr>
                    <td colSpan={4}>
                      Fetching outgoing {scope} for {props.collection.title}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4}>
                      No outgoing {scope} found for {props.collection.title}
                    </td>
                  </tr>
                )}
                {delegations > 1 && (
                  <tr>
                    <td colSpan={4} className="tw-pt-3">
                      selected:{" "}
                      {bulkRevocations.length === MAX_BULK_ACTIONS
                        ? `${MAX_BULK_ACTIONS} (max)`
                        : bulkRevocations.length}
                      &nbsp;&nbsp;
                      <button
                        disabled={bulkRevocations.length < 2}
                        className={`${styles["useCaseWalletRevoke"]} ${
                          bulkRevocations.length < 2
                            ? `${styles["useCaseWalletRevokeDisabled"]}`
                            : ``
                        }`}
                        onClick={() => {
                          const title = "Batch Revoking Delegations";
                          let message: ReactNode = "Confirm in your wallet...";
                          if (chainsMatch()) {
                            setBatchRevokeDelegationParams({
                              collections: [...bulkRevocations].map(() =>
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
                            message = getSwitchToMessage();
                          }
                          showDelegationToast({ title, message });
                        }}
                      >
                        Batch Revoke
                        {(contractWriteBatchRevoke.isPending ||
                          waitContractWriteBatchRevoke.isLoading) && (
                          <span
                            className="tw-inline-flex tw-items-center"
                            role="status"
                          >
                            <Spinner dimension={20} />
                            <span className="tw-sr-only">
                              Transaction pending
                            </span>
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function printIncomingDelegationRow(
    delegationIndex: number,
    walletIndex: number,
    del: ContractDelegation,
    w: ContractWalletDelegation,
    consolidationStatus: string | undefined,
    pending: boolean,
    isConsolidation: boolean
  ) {
    return (
      <tr
        key={`incoming-${del.useCase.use_case}-${delegationIndex}-${walletIndex}-${w.wallet}`}
      >
        <td>
          <div className="tw-flex tw-flex-col tw-gap-2 tw-bg-[rgb(34,34,34)] tw-px-[15px] tw-pb-2.5 tw-pt-3">
            <span className="tw-flex tw-items-center tw-gap-3">
              {del.useCase.use_case == SUB_DELEGATION_USE_CASE.use_case ? (
                <input
                  aria-label={`Select ${w.wallet} as original delegator`}
                  type="checkbox"
                  className={CHECKBOX_CLASS}
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
      <div className="tw-w-full tw-p-0">
        <div className={styles["delegationsTableScrollContainer"]}>
          <div className="tw-w-full">
            <table className={`${styles["delegationsTable"]} tw-w-full`}>
              <tbody>
                {delegations > 0 ? (
                  myDelegations.map((del, index: number) => {
                    if (!del.wallets.length) return null;

                    const isConsolidation =
                      del.useCase.use_case === CONSOLIDATION_USE_CASE.use_case;
                    return (
                      <Fragment
                        key={`incoming-${del.useCase.use_case}-${index}`}
                      >
                        <tr>
                          <td
                            colSpan={4}
                            className={styles["delegationsTableUseCaseHeader"]}
                          >
                            #{del.useCase.use_case} - {del.useCase.display}
                          </td>
                        </tr>
                        {del.wallets.map((w, walletIndex) => {
                          const consolidationStatus =
                            incomingActiveConsolidations.find((i) =>
                              areEqualAddresses(w.wallet, i.wallet)
                            )?.status;
                          const pending =
                            consolidationStatus === "consolidation incomplete";
                          return printIncomingDelegationRow(
                            index,
                            walletIndex,
                            del,
                            w,
                            consolidationStatus,
                            pending,
                            isConsolidation
                          );
                        })}
                      </Fragment>
                    );
                  })
                ) : !incomingDelegationsLoaded ? (
                  <tr>
                    <td colSpan={4}>
                      Fetching incoming {scope} for {props.collection.title}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4}>
                      No incoming {scope} found for {props.collection.title}
                    </td>
                  </tr>
                )}
                {incomingDelegationsLoaded &&
                  isSubdelegation &&
                  delegations > 0 && (
                    <tr>
                      <td colSpan={2} className="tw-pt-3">
                        <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                          <button
                            className={`${styles["useCaseWalletUpdate"]} ${
                              subDelegationOriginalDelegator === undefined
                                ? styles["useCaseWalletUpdateDisabled"]
                                : ""
                            }`}
                            onClick={() => {
                              setShowCreateNewDelegationWithSub(true);
                              window.scrollTo(0, 0);
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              className={styles["buttonIcon"]}
                            />
                            Register Delegation
                          </button>
                          <button
                            className={`${styles["useCaseWalletUpdate"]} ${
                              subDelegationOriginalDelegator === undefined
                                ? styles["useCaseWalletUpdateDisabled"]
                                : ""
                            }`}
                            onClick={() => {
                              setShowCreateNewSubDelegationWithSub(true);
                              window.scrollTo(0, 0);
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              className={styles["buttonIcon"]}
                            />
                            Register Delegation Manager
                          </button>
                          <button
                            className={`${styles["useCaseWalletUpdate"]} ${
                              subDelegationOriginalDelegator === undefined
                                ? styles["useCaseWalletUpdateDisabled"]
                                : ""
                            }`}
                            onClick={() => {
                              setShowCreateNewConsolidationWithSub(true);
                              window.scrollTo(0, 0);
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              className={styles["buttonIcon"]}
                            />
                            Register Consolidation
                          </button>
                          {(props.collection.contract ===
                            DELEGATION_ALL_ADDRESS ||
                            props.collection.contract ===
                              MEMES_COLLECTION.contract) && (
                            <button
                              className={`${styles["useCaseWalletUpdate"]} ${
                                subDelegationOriginalDelegator === undefined
                                  ? styles["useCaseWalletUpdateDisabled"]
                                  : ""
                              }`}
                              onClick={() => {
                                setShowAssignPrimaryAddressWithSub(true);
                                window.scrollTo(0, 0);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faPlus}
                                className={styles["buttonIcon"]}
                              />
                              Assign Primary Address
                            </button>
                          )}
                          <button
                            className={`${styles["useCaseWalletRevoke"]} ${
                              subDelegationOriginalDelegator === undefined
                                ? styles["useCaseWalletRevokeDisabled"]
                                : ""
                            }`}
                            onClick={() => {
                              setShowRevokeDelegationWithSub(true);
                              window.scrollTo(0, 0);
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faMinus}
                              className={styles["buttonIcon"]}
                            />
                            Revoke
                          </button>
                        </span>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function printLocks() {
    return (
      <div className="tw-w-full tw-p-0">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-2 tw-pt-5">
          <div className="tw-w-full tw-px-3">
            <h4>
              Locks{" "}
              <>
                <FontAwesomeIcon
                  className={styles["infoIcon"]}
                  icon={faInfoCircle}
                  data-tooltip-id="locks-info"
                ></FontAwesomeIcon>
                <Tooltip
                  id="locks-info"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  Locks only block incoming delegations for this collection
                  scope. They do not revoke outgoing records.
                </Tooltip>
              </>
            </h4>
            <p className={styles["collectionSectionIntro"]}>
              Locks block incoming delegations for this collection scope. They
              do not stop delegations you already made to other wallets.
            </p>
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-2 tw-pt-2">
          <div className="tw-w-full tw-px-3">
            <button
              className={`${styles["lockDelegationBtn"]} ${
                collectionLockReadGlobal?.data
                  ? styles["lockDelegationBtnDisabled"]
                  : ""
              }`}
              onClick={() => {
                const title = `${
                  collectionLockRead.data ? `Unlocking` : `Locking`
                } Wallet`;
                let message: ReactNode = "Confirm in your wallet...";
                collectionLockToastTitleRef.current = title;
                if (chainsMatch()) {
                  collectionLockWrite.writeContract({
                    address: DELEGATION_CONTRACT.contract,
                    abi: DELEGATION_ABI,
                    chainId: DELEGATION_CONTRACT.chain_id,
                    args: [props.collection.contract, !collectionLockRead.data],
                    functionName: "setCollectionLock",
                  });
                } else {
                  message = getSwitchToMessage();
                }
                showDelegationToast({ title, message });
              }}
            >
              <FontAwesomeIcon
                icon={collectionLockRead.data ? faLock : faLockOpen}
                className={styles["buttonIcon"]}
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
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-2 tw-pt-3">
          <div className="tw-w-full tw-px-3 tw-pb-2 tw-pt-2 md:tw-w-1/3">
            <select
              aria-label="Lock or unlock use case"
              disabled={!!collectionLockRead.data}
              className={`${styles["formInputLockUseCase"]} ${LOCK_SELECT_CLASS} ${
                collectionLockRead.data || collectionLockReadGlobal?.data
                  ? styles["formInputDisabled"]
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
                useCaseLockToastTitleRef.current = "Locking Wallet";
                useCaseLockWrite.reset();
              }}
            >
              <option value={0}>
                Lock/Unlock Use Case
                {collectionLockRead.data || collectionLockReadGlobal?.data
                  ? ` *`
                  : ``}
              </option>
              {ALL_USE_CASES.map((uc, index) => {
                if (uc.use_case === 1) return null;
                const asteriskDisplay = useCaseLockStatusesGlobal.data?.[index]
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
                    value={uc.use_case}
                  >
                    #{uc.use_case} - {uc.display}
                    {lockDisplay}
                  </option>
                );
              })}
            </select>
          </div>
          {lockUseCaseValue != 0 && (
            <div className="tw-flex tw-w-full tw-items-center tw-px-3 tw-pb-2 tw-pt-2 md:tw-w-2/3">
              {!useCaseLockStatusesGlobal.data ||
              (useCaseLockStatusesGlobal?.data &&
                (useCaseLockStatusesGlobal?.data[
                  lockUseCaseIndex
                ] as any as boolean) === false) ? (
                <button
                  className={`${styles["lockUseCaseBtn"]}`}
                  onClick={() => {
                    const useCase = DELEGATION_USE_CASES[lockUseCaseIndex];
                    const title = `${
                      useCaseLockStatuses?.data?.[lockUseCaseIndex]
                        ? "Unlocking"
                        : "Locking"
                    } Wallet on Use Case #${useCase?.use_case} - ${
                      useCase?.display
                    }`;
                    let message: ReactNode = "Confirm in your wallet...";
                    useCaseLockToastTitleRef.current = title;

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
                      message = getSwitchToMessage();
                    }
                    showDelegationToast({ title, message });
                  }}
                >
                  <FontAwesomeIcon
                    icon={
                      useCaseLockStatuses.data?.[lockUseCaseIndex]
                        ? faLock
                        : faLockOpen
                    }
                    className={styles["buttonIcon"]}
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
                  <span className={styles["hint"]}>* Note:</span> Unlock use
                  case in{" "}
                  <Link href={`/delegation/${ANY_COLLECTION_PATH}`}>
                    All Collections
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        {collectionLockRead.data ? (
          <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-3">
            <div className="tw-w-full tw-px-3">
              <span className={styles["hint"]}>* Note:</span> Unlock Wallet to
              lock/unlock specific use cases
            </div>
          </div>
        ) : null}
        {collectionLockReadGlobal?.data ? (
          <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-3">
            <div className="tw-w-full tw-px-3">
              <span className={styles["hint"]}>* Note:</span> Unlock Wallet on{" "}
              <Link href={`/delegation/${ANY_COLLECTION_PATH}`}>
                All Collections
              </Link>{" "}
              to lock/unlock specific collections and use cases
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="tw-w-full tw-p-0">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-px-3">
          {props.collection && (
            <div className="tw-mx-auto tw-w-full">
              <div
                className={`-tw-mx-3 tw-flex tw-flex-wrap ${styles["collectionDelegationBackRow"]}`}
              >
                <div className="tw-w-full tw-px-3">
                  <button
                    className={styles["backBtn"]}
                    onClick={() =>
                      props.setSection(DelegationCenterSection.CENTER)
                    }
                  >
                    <FontAwesomeIcon icon={faCircleArrowLeft} />
                    <span className="font-smaller">
                      Back to Delegation Center
                    </span>
                  </button>
                </div>
              </div>
              <div
                className={`-tw-mx-3 tw-flex tw-flex-wrap ${styles["collectionDelegationTitleRow"]}`}
              >
                <div className="tw-w-full tw-px-3">
                  <h1 className="tw-mb-0">{props.collection.title}</h1>
                  <p className={styles["collectionIntro"]}>
                    {getCollectionScopeDescription(props.collection)}
                  </p>
                </div>
              </div>
              {!showUpdateDelegation &&
                !showCreateNewDelegationWithSub &&
                !showCreateNewSubDelegationWithSub &&
                !showCreateNewConsolidationWithSub &&
                !showAssignPrimaryAddressWithSub &&
                !showRevokeDelegationWithSub && (
                  <>
                    {!accountResolution.isConnected ? (
                      <section
                        className={styles["connectRequired"]}
                        aria-labelledby="collection-connect-heading"
                      >
                        <h2 id="collection-connect-heading">
                          Connect Wallet to Manage {props.collection.title}
                        </h2>
                        <p>
                          Connect the wallet whose outgoing and incoming records
                          you want to review.
                        </p>
                        <button
                          type="button"
                          className={styles["connectRequiredButton"]}
                          onClick={accountResolution.seizeConnect}
                        >
                          Connect Wallet
                        </button>
                      </section>
                    ) : (
                      <>
                        {printDelegations()}
                        {printConsolidations()}
                        {printSubDelegations()}
                        {printLocks()}
                        <div className="tw-w-full tw-p-0">
                          <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-3 tw-pt-5">
                            <div className="tw-flex tw-w-full tw-items-center tw-justify-start tw-px-3">
                              <button
                                className={styles["backBtn"]}
                                onClick={() =>
                                  props.setSection(
                                    DelegationCenterSection.CENTER
                                  )
                                }
                              >
                                <FontAwesomeIcon icon={faCircleArrowLeft} />
                                <span className="font-smaller">
                                  Back to Delegation Center
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
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
                    onSetToast={showDelegationToast}
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
                    onSetToast={showDelegationToast}
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
                    onSetToast={showDelegationToast}
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
                    onSetToast={showDelegationToast}
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
                    onSetToast={showDelegationToast}
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
                    onSetToast={showDelegationToast}
                  />
                )}
            </div>
          )}
        </div>
      </div>
      {toast && (
        <DelegationToast
          toastRef={toastRef}
          toast={toast}
          showToast={showToast}
          setShowToast={setCollectionToastVisibility}
        />
      )}
    </div>
  );
}
