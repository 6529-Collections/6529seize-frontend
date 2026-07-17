"use client";

import { useEffect, useRef, useState } from "react";
import {
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { DELEGATION_ABI } from "@/abis/abis";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { getReadParams } from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import { ALL_USE_CASES } from "../delegation-constants";
import type { DelegationToastState } from "../DelegationToast";
import { getTransactionErrorToastMessage } from "./collection-delegation-helpers";

/**
 * Lock state for the collection-delegation screen: collection-level and
 * use-case-level lock reads (for this collection and the all-collections
 * scope), the two lock writes, and the toast titles tied to each in-flight
 * write.
 */
export function useCollectionLocks(options: {
  readonly address: string | undefined;
  readonly isConnected: boolean;
  readonly collection: DelegationCollection;
  readonly showDelegationToast: (toast: DelegationToastState) => void;
}) {
  const { address, isConnected, collection, showDelegationToast } = options;

  // The refs hold the title for the lock write currently in flight. Set them
  // immediately before each writeContract call so success/error toasts stay tied
  // to the user action that opened the wallet.
  const collectionLockToastTitleRef = useRef("Locking Wallet");
  const useCaseLockToastTitleRef = useRef("Locking Wallet");

  const [lockUseCaseValue, setLockUseCaseValue] = useState(0);
  const [lockUseCaseIndex, setLockUseCaseIndex] = useState(0);

  const useCaseLockStatusesGlobalParams = areEqualAddresses(
    collection.contract,
    DELEGATION_ALL_ADDRESS
  )
    ? {}
    : {
        contracts: getReadParams(
          DELEGATION_ALL_ADDRESS,
          address as `0x${string}`,
          "retrieveCollectionUseCaseLockStatus"
        ),
        query: {
          enabled: isConnected,
          refetchInterval: 10000,
        },
      };

  const useCaseLockStatusesGlobal = useReadContracts(
    useCaseLockStatusesGlobalParams
  );

  const useCaseLockStatuses = useReadContracts({
    contracts: getReadParams(
      collection.contract,
      address as `0x${string}`,
      "retrieveCollectionUseCaseLockStatus",
      ALL_USE_CASES
    ),
    query: {
      enabled: isConnected,
      refetchInterval: 10000,
    },
  });

  const { refetch: refetchUseCaseLockStatuses } = useCaseLockStatuses;

  const collectionLockReadGlobalParams = areEqualAddresses(
    collection.contract,
    DELEGATION_ALL_ADDRESS
  )
    ? {}
    : {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveCollectionLockStatus",
        args: [DELEGATION_ALL_ADDRESS, address],
        query: {
          enabled: isConnected,
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
    args: [collection.contract, address],
    query: {
      enabled: isConnected,
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
    if (isConnected) {
      refetchUseCaseLockStatuses();
    }
  }, [isConnected, refetchUseCaseLockStatuses, waitUseCaseLockWrite.isSuccess]);

  useEffect(() => {
    const title = collectionLockToastTitleRef.current;

    if (collectionLockWrite.error) {
      showDelegationToast({
        status: "error",
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
          status: "submitted",
          title,
          transactionHash: collectionLockWrite.data,
        });
      } else if (waitCollectionLockWrite.isSuccess) {
        showDelegationToast({
          status: "success",
          title,
          transactionHash: collectionLockWrite.data,
        });
      } else if (waitCollectionLockWrite.isError) {
        showDelegationToast({
          status: "error",
          title: `${title} Failed`,
          message: getTransactionErrorToastMessage(
            waitCollectionLockWrite.error,
            "Transaction failed while waiting for confirmation."
          ),
          transactionHash: collectionLockWrite.data,
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
        status: "error",
        title,
        message: getTransactionErrorToastMessage(
          useCaseLockWrite.error,
          "Failed to start use-case lock update."
        ),
      });
    }
    if (useCaseLockWrite.data) {
      if (waitUseCaseLockWrite.isLoading) {
        showDelegationToast({
          status: "submitted",
          title,
          transactionHash: useCaseLockWrite.data,
        });
      } else if (waitUseCaseLockWrite.isSuccess) {
        showDelegationToast({
          status: "success",
          title,
          transactionHash: useCaseLockWrite.data,
        });
      } else if (waitUseCaseLockWrite.isError) {
        showDelegationToast({
          status: "error",
          title: `${title} Failed`,
          message: getTransactionErrorToastMessage(
            waitUseCaseLockWrite.error,
            "Transaction failed while waiting for confirmation."
          ),
          transactionHash: useCaseLockWrite.data,
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

  function resetLockWrites() {
    collectionLockToastTitleRef.current = "Locking Wallet";
    useCaseLockToastTitleRef.current = "Locking Wallet";
    useCaseLockWrite.reset();
    collectionLockWrite.reset();
  }

  function resetLockSelection() {
    setLockUseCaseValue(0);
    setLockUseCaseIndex(0);
  }

  function setCollectionLockToastTitle(title: string) {
    collectionLockToastTitleRef.current = title;
  }

  function setUseCaseLockToastTitle(title: string) {
    useCaseLockToastTitleRef.current = title;
  }

  return {
    setCollectionLockToastTitle,
    setUseCaseLockToastTitle,
    lockUseCaseValue,
    setLockUseCaseValue,
    lockUseCaseIndex,
    setLockUseCaseIndex,
    useCaseLockStatusesGlobal,
    useCaseLockStatuses,
    collectionLockReadGlobal,
    collectionLockRead,
    collectionLockWrite,
    waitCollectionLockWrite,
    useCaseLockWrite,
    waitUseCaseLockWrite,
    resetLockWrites,
    resetLockSelection,
  };
}

export type CollectionLocks = ReturnType<typeof useCollectionLocks>;
