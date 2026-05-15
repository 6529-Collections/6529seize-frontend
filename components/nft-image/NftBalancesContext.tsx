"use client";

import type { NftOwner } from "@/entities/IOwner";
import { useNftContractBalances } from "@/hooks/useNftBalance";
import { createContext, useContext, useMemo, type ReactNode } from "react";

interface NftBalancesContextValue {
  readonly consolidationKey: string | null;
  readonly contract: string;
  readonly balancesByTokenId: Map<number, number>;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

const NftBalancesContext = createContext<NftBalancesContextValue | null>(null);

const normalizeContract = (contract: string): string => contract.toLowerCase();

const buildBalancesByTokenId = (balances: NftOwner[]): Map<number, number> => {
  const balancesByTokenId = new Map<number, number>();

  for (const balance of balances) {
    balancesByTokenId.set(
      balance.token_id,
      (balancesByTokenId.get(balance.token_id) ?? 0) + balance.balance
    );
  }

  return balancesByTokenId;
};

export function NftBalancesProvider({
  children,
  consolidationKey,
  contract,
  tokenIds,
  enabled = true,
}: {
  readonly children: ReactNode;
  readonly consolidationKey: string | null;
  readonly contract: string;
  readonly tokenIds: readonly number[];
  readonly enabled?: boolean;
}) {
  const { data, isLoading, error } = useNftContractBalances({
    consolidationKey,
    contract,
    tokenIds,
    enabled,
  });

  const value = useMemo<NftBalancesContextValue>(
    () => ({
      consolidationKey,
      contract: normalizeContract(contract),
      balancesByTokenId: buildBalancesByTokenId(data ?? []),
      isLoading,
      error: error instanceof Error ? error : null,
    }),
    [consolidationKey, contract, data, error, isLoading]
  );

  return (
    <NftBalancesContext.Provider value={value}>
      {children}
    </NftBalancesContext.Provider>
  );
}

export function useNftBalanceFromContext({
  consolidationKey,
  contract,
  tokenId,
}: {
  readonly consolidationKey: string | null;
  readonly contract: string;
  readonly tokenId: number;
}) {
  const context = useContext(NftBalancesContext);

  if (
    !context ||
    !consolidationKey ||
    context.consolidationKey !== consolidationKey ||
    context.contract !== normalizeContract(contract)
  ) {
    return null;
  }

  return {
    balance: context.balancesByTokenId.get(tokenId) ?? 0,
    isLoading: context.isLoading,
    error: context.error,
  };
}
