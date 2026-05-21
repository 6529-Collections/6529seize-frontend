"use client";

import { useAuth } from "@/components/auth/Auth";
import NFTImageBalanceBadge, {
  type NFTImageBalanceBadgeSize,
  type NFTImageBalanceBadgeState,
  type NFTImageBalanceBadgeVariant,
} from "@/components/nft-image/NFTImageBalanceBadge";
import { useNftBalanceFromContext } from "@/components/nft-image/NftBalancesContext";
import { useNftBalance } from "@/hooks/useNftBalance";

interface Props {
  readonly contract: string;
  readonly tokenId: number;
  readonly height: 300 | 650 | "full";
  readonly inline?: boolean | undefined;
  readonly size?: NFTImageBalanceBadgeSize | undefined;
  readonly variant?: NFTImageBalanceBadgeVariant;
}

export default function NFTImageBalance({
  contract,
  tokenId,
  height,
  inline = false,
  size,
  variant = "default",
}: Props) {
  const { connectedProfile } = useAuth();
  const consolidationKey = connectedProfile?.consolidation_key ?? null;
  const contextBalance = useNftBalanceFromContext({
    consolidationKey,
    contract,
    tokenId,
  });

  const {
    balance: nftBalance,
    isLoading,
    error,
  } = useNftBalance({
    consolidationKey,
    contract,
    tokenId,
    enabled: !contextBalance,
  });
  const balanceState = contextBalance ?? {
    balance: nftBalance,
    isLoading,
    error,
  };

  const renderBadge = (state: NFTImageBalanceBadgeState) => (
    <NFTImageBalanceBadge
      state={state}
      balance={balanceState.balance}
      height={height}
      inline={inline}
      size={size}
      variant={variant}
    />
  );

  if (!connectedProfile) {
    return null;
  }

  if (balanceState.isLoading) {
    return renderBadge("loading");
  }

  if (balanceState.error) {
    console.error("Failed to fetch NFT balance:", balanceState.error);
    return renderBadge("error");
  }

  if (balanceState.balance > 0) {
    return renderBadge("seized");
  }

  return renderBadge("unseized");
}
