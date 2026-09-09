"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
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
import { DELEGATION_CARD_CLASS_NAME } from "../delegation-ui";

export interface Revocation {
  use_case: number;
  wallet: string;
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
  collection: DelegationCollection,
  locale: SupportedLocale
) {
  if (areEqualAddresses(collection.contract, DELEGATION_ALL_ADDRESS)) {
    return t(locale, "delegation.collection.scope.all");
  }

  if (areEqualAddresses(collection.contract, MEMES_COLLECTION.contract)) {
    return t(locale, "delegation.collection.scope.memes");
  }

  if (areEqualAddresses(collection.contract, MEME_LAB_COLLECTION.contract)) {
    return t(locale, "delegation.collection.scope.memeLab");
  }

  if (areEqualAddresses(collection.contract, GRADIENTS_COLLECTION.contract)) {
    return t(locale, "delegation.collection.scope.gradient");
  }

  return t(locale, "delegation.collection.scope.selected");
}

export const CHECKBOX_CLASS =
  "tw-h-4 tw-w-4 tw-flex-none tw-cursor-pointer tw-rounded tw-border tw-border-solid tw-border-white/20 tw-bg-black/30 tw-text-primary-400 focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

export const COLLECTION_PANEL_CLASS = `${DELEGATION_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`;

export const COLLECTION_PANEL_ICON_CLASS =
  "tw-flex tw-h-7 tw-w-5 tw-flex-none tw-items-center tw-justify-center tw-text-iron-300";

export const BUTTON_ICON_CLASS = "tw-h-4 tw-w-4 tw-flex-none";
