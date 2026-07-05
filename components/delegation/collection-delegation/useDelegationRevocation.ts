"use client";

import { useEffect, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NULL_ADDRESS } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import type { ContractDelegation } from "../CollectionDelegation.utils";
import type { DelegationToastState } from "../DelegationToast";
import {
  getTransactionErrorToastMessage,
  getTransactionToastMessage,
  type Revocation,
} from "./collection-delegation-helpers";

/**
 * Revocation writes for the collection-delegation screen: single revocation,
 * batch revocation, and the bulk-selection state feeding the batch call.
 * Setting the corresponding params state triggers the contract write.
 */
export function useDelegationRevocation(options: {
  readonly showDelegationToast: (toast: DelegationToastState) => void;
}) {
  const { showDelegationToast } = options;

  const [bulkRevocations, setBulkRevocations] = useState<Revocation[]>([]);

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

  function resetRevocationWrites() {
    contractWriteRevoke.reset();
    contractWriteBatchRevoke.reset();
  }

  function resetRevocationParams() {
    setRevokeDelegationParams(undefined);
    setBatchRevokeDelegationParams(undefined);
  }

  return {
    bulkRevocations,
    addToBulkRevocations,
    removeFromBulkRevocations,
    setRevokeDelegationParams,
    setBatchRevokeDelegationParams,
    batchRevokeInFlight:
      contractWriteBatchRevoke.isPending ||
      waitContractWriteBatchRevoke.isLoading,
    resetRevocationWrites,
    resetRevocationParams,
  };
}

export type DelegationRevocation = ReturnType<typeof useDelegationRevocation>;
