"use client";

import type { ReactNode } from "react";

import { DELEGATION_ABI } from "@/abis/abis";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import { areEqualAddresses, getTransactionLink } from "@/helpers/Helpers";
import styles from "../Delegation.module.css";
import {
  getParams,
  type ContractDelegation,
  type DelegationReadParams,
} from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import {
  DELEGATION_USE_CASES,
  GRADIENTS_COLLECTION,
  MEME_LAB_COLLECTION,
  MEMES_COLLECTION,
} from "../delegation-constants";

export interface Revocation {
  use_case: number;
  wallet: string;
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

export function getTransactionToastMessage(
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

export function getTransactionErrorToastMessage(
  error: { message?: string } | null | undefined,
  fallback: string
) {
  const message = error?.message?.split("Request Arguments")[0]?.trim();
  return message || fallback;
}

export function getActiveDelegationsReadParams(
  address: string | undefined,
  collection: string | undefined,
  functionName: string
) {
  return getParams(address, collection, functionName, DELEGATION_USE_CASES);
}

export function getConsolidationReadParams(
  address: string | undefined,
  collection: string | undefined,
  consolidationAddresses: ContractDelegation | undefined
) {
  if (!consolidationAddresses) {
    return [];
  }
  const params: DelegationReadParams[] = [];
  for (const ca of consolidationAddresses.wallets) {
    params.push({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "checkConsolidationStatus",
      args: [address, ca.wallet, collection],
    });
  }
  return params;
}

export function getCollectionScopeDescription(
  collection: DelegationCollection
) {
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

export const CHECKBOX_CLASS =
  "tw-h-4 tw-w-4 tw-cursor-pointer tw-border-0 tw-bg-white tw-text-black focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";
export const LOCK_SELECT_CLASS =
  "tw-block tw-w-full tw-min-w-0 tw-border tw-border-solid tw-border-iron-300 tw-bg-white tw-px-3 tw-py-2 tw-text-base tw-leading-6 tw-text-black focus:tw-border-primary-400 focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-opacity-75";
