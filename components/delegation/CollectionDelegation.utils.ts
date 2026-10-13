import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT } from "@/constants/constants";
import type { Abi } from "viem";
import type { DelegationUseCase } from "./delegation-constants";
import {
  CONSOLIDATION_USE_CASE,
  DELEGATION_USE_CASES,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "./delegation-constants";
import { isNonExpiringDelegationExpiry } from "./delegation-expiry";

/**
 * Expiry state of an on-chain delegation. `expiresAt` is the raw Unix-seconds
 * instant; views format it in the viewer's locale and time zone.
 */
export type ContractDelegationExpiry =
  | { readonly status: "nonExpiring" }
  | { readonly status: "expired" }
  | { readonly status: "active"; readonly expiresAt: number };

export interface ContractWalletDelegation {
  wallet: string;
  fetched?: boolean | undefined;
  expiry?: ContractDelegationExpiry | undefined;
  all?: boolean | undefined;
  tokens?: number | bigint | undefined;
}

export interface ContractDelegation {
  useCase: DelegationUseCase;
  wallets: ContractWalletDelegation[];
}

export interface ContractReadResult {
  readonly result?: unknown;
  readonly status?: "success" | "failure";
}

/**
 * One entry of a `useReadContracts` `contracts` array targeting the
 * delegation contract.
 */
export interface DelegationReadParams {
  readonly address: `0x${string}`;
  readonly abi: Abi;
  readonly chainId: number;
  readonly functionName: string;
  readonly args: readonly (string | number | undefined)[];
}

/**
 * Decoded result tuple of the delegation contract's
 * `retrieve...TokensIDsandExpiredDates` functions:
 * [wallets, expiry timestamps, all-tokens flags, token ids].
 * viem decodes `uint256` as `bigint` at runtime; unit fixtures use numbers.
 */
type DelegationsResultTuple = readonly [
  readonly string[],
  readonly (number | bigint)[],
  readonly boolean[],
  readonly (number | bigint)[],
];

export function getParams(
  address: string | undefined,
  collection: string | undefined,
  functionName: string,
  useCases: readonly Pick<DelegationUseCase, "use_case">[]
) {
  const params: DelegationReadParams[] = [];
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

export function getReadParams(
  address: string | undefined,
  collection: string | undefined,
  functionName: string,
  useCases?: readonly Pick<DelegationUseCase, "use_case">[]
) {
  if (!useCases) {
    useCases = DELEGATION_USE_CASES;
  }
  return getParams(address, collection, functionName, useCases);
}

function getContractDelegationExpiry(
  useCase: number,
  expiresAt: number
): ContractDelegationExpiry {
  if (
    useCase >= PRIMARY_ADDRESS_USE_CASE.use_case ||
    isNonExpiringDelegationExpiry(expiresAt)
  ) {
    return { status: "nonExpiring" };
  }
  // Matches the contract: DelegationManagement.sol retrieveActiveDelegations
  // and retrieveActiveDelegators count a delegation as active only
  // `if (allExpirations[y] > _date)`, so expiry == now is already expired.
  return Date.now() / 1000 < expiresAt
    ? { status: "active", expiresAt }
    : { status: "expired" };
}

export function getDelegationsFromData(data: readonly ContractReadResult[]) {
  const myDelegations: ContractDelegation[] = [];
  data.map((d, index) => {
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
      const delegationsArray = d.result as DelegationsResultTuple;
      delegationsArray[0].map((wallet: string, i: number) => {
        // Number() keeps bigint/number comparisons uniform; expiries are far
        // below Number.MAX_SAFE_INTEGER, so the conversion is lossless.
        const myDate = Number(delegationsArray[1][i]);
        walletDelegations.push({
          wallet: wallet,
          expiry: getContractDelegationExpiry(useCase.use_case, myDate),
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

/**
 * Multicalls allow individual contract reads to fail. A partial result is not
 * a trustworthy snapshot, so callers must surface a read error instead of
 * interpreting the missing entries as an empty delegation list.
 */
export function getDelegationsFromSuccessfulData(
  data: readonly ContractReadResult[]
) {
  if (data.some((entry) => entry.status === "failure")) {
    return undefined;
  }

  return getDelegationsFromData(data);
}
