"use client";

import { useAuth } from "@/components/auth/Auth";
import styles from "@/components/nft-image/NFTImage.module.scss";
import { useNftBalanceFromContext } from "@/components/nft-image/NftBalancesContext";
import { useNftBalance } from "@/hooks/useNftBalance";

interface Props {
  readonly contract: string;
  readonly tokenId: number;
  readonly height: 300 | 650 | "full";
}

export default function NFTImageBalance({ contract, tokenId, height }: Props) {
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

  const printBalance = () => {
    if (balanceState.balance > 0) {
      return printBalanceSpan(`SEIZED x${balanceState.balance}`);
    } else {
      return printBalanceSpan("UNSEIZED");
    }
  };

  const printBalanceSpan = (b: string) => {
    return (
      <span
        className={`${styles["balance"]} ${
          height === 650 ? styles["balanceBigger"] : ""
        } `}
      >
        {b}
      </span>
    );
  };

  if (!connectedProfile) {
    return null;
  }

  if (balanceState.isLoading) {
    return printBalanceSpan("...");
  }

  if (balanceState.error) {
    console.error("Failed to fetch NFT balance:", balanceState.error);
    return printBalanceSpan("N/A");
  }

  return printBalance();
}
