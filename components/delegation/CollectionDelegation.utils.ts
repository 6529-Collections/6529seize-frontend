import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import {
  CONSOLIDATION_USE_CASE,
  DELEGATION_USE_CASES,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "./delegation-constants";

export interface ContractWalletDelegation {
  wallet: string;
  fetched?: boolean | undefined;
  expiry?: string | undefined;
  all?: boolean | undefined;
  tokens?: number | undefined;
}

export interface ContractDelegation {
  useCase: any;
  wallets: ContractWalletDelegation[];
}

function formatExpiry(myDate: any) {
  const date = new Date(parseInt(myDate) * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getParams(
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

export function getReadParams(
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

export function getDelegationsFromData(data: any) {
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
