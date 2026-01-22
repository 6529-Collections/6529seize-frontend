"use client";

import { useAuth } from "@/components/auth/Auth";
import { useNftBalance } from "@/hooks/useNftBalance";

export function useShowThankYouForMint({
  contract,
  tokenId,
  enabled = true,
}: {
  readonly contract: string;
  readonly tokenId: number;
  readonly enabled?: boolean;
}) {
  const { connectedProfile } = useAuth();

  const { balance, isLoading, error } = useNftBalance({
    consolidationKey: connectedProfile?.consolidation_key ?? null,
    contract,
    tokenId,
    enabled,
  });

  const showThankYou =
    !!connectedProfile && enabled && !isLoading && !error && balance > 0;

  return { showThankYou, isLoading, error, balance };
}

