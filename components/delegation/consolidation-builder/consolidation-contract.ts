import { DELEGATION_ABI } from "@/abis/abis";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  MEMES_CONTRACT,
  NEVER_DATE,
} from "@/constants/constants";
import type {
  ContractReadResult,
  DelegationReadParams,
} from "../CollectionDelegation.utils";
import {
  CONSOLIDATION_USE_CASE,
  MAX_BULK_ACTIONS,
} from "../delegation-constants";
import {
  getDirectedWalletPairs,
  toDirectedLinkKey,
} from "./consolidation-plan";

// A direction counts when registered on Any Collection or The Memes.
const LINK_STATUS_COLLECTIONS = [DELEGATION_ALL_ADDRESS, MEMES_CONTRACT];

interface ConsolidationStepWriteParams {
  readonly address: `0x${string}`;
  readonly abi: typeof DELEGATION_ABI;
  readonly chainId: number;
  readonly functionName: "registerDelegationAddress" | "batchDelegations";
  readonly args: readonly unknown[];
}

export function getLinkStatusReadParams(
  wallets: readonly string[]
): DelegationReadParams[] {
  return getDirectedWalletPairs(wallets).flatMap(([from, to]) =>
    LINK_STATUS_COLLECTIONS.map((collection) => ({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "retrieveGlobalStatusOfDelegation",
      args: [from, collection, to, CONSOLIDATION_USE_CASE.use_case],
    }))
  );
}

/**
 * Registered directions from `getLinkStatusReadParams` results. Returns
 * undefined until every read has succeeded.
 */
export function getRegisteredLinkKeys(
  wallets: readonly string[],
  data: readonly ContractReadResult[] | undefined
): string[] | undefined {
  const pairs = getDirectedWalletPairs(wallets);
  const collectionCount = LINK_STATUS_COLLECTIONS.length;
  if (
    data?.length !== pairs.length * collectionCount ||
    data.some((read) => read.status !== "success")
  ) {
    return undefined;
  }

  return pairs
    .filter((_pair, pairIndex) =>
      data
        .slice(pairIndex * collectionCount, (pairIndex + 1) * collectionCount)
        .some((read) => read.result === true)
    )
    .map(([from, to]) => toDirectedLinkKey(from, to));
}

/**
 * One transaction registering every target for the signer: a single
 * registration for one target, otherwise one batch with parallel arrays.
 */
export function getConsolidationStepWriteParams(
  targets: readonly string[]
): ConsolidationStepWriteParams {
  const [firstTarget] = targets;
  if (!firstTarget || targets.length > MAX_BULK_ACTIONS) {
    throw new Error(
      `A consolidation step registers 1 to ${MAX_BULK_ACTIONS} links.`
    );
  }
  const base = {
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
  };

  if (targets.length === 1) {
    return {
      ...base,
      functionName: "registerDelegationAddress",
      args: [
        DELEGATION_ALL_ADDRESS,
        firstTarget,
        NEVER_DATE,
        CONSOLIDATION_USE_CASE.use_case,
        true,
        0,
      ],
    };
  }

  return {
    ...base,
    functionName: "batchDelegations",
    args: [
      targets.map(() => DELEGATION_ALL_ADDRESS),
      [...targets],
      targets.map(() => NEVER_DATE),
      targets.map(() => CONSOLIDATION_USE_CASE.use_case),
      targets.map(() => true),
      targets.map(() => 0),
    ],
  };
}
