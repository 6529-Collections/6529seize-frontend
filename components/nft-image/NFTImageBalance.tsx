"use client";

import { useAuth } from "@/components/auth/Auth";
import { useNftBalance } from "@/hooks/useNftBalance";
import styles from "./NFTImage.module.scss";

interface Props {
  readonly contract: string;
  readonly tokenId: number;
  readonly height: 300 | 650 | "full";
}

export default function NFTImageBalance({ contract, tokenId, height }: Props) {
  const { connectedProfile } = useAuth();

  const {
    balance: nftBalance,
    isLoading,
    error,
  } = useNftBalance({
    consolidationKey: connectedProfile?.consolidation_key ?? null,
    contract,
    tokenId,
  });

  const printBalance = () => {
    if (nftBalance > 0) {
      return printBalanceSpan(`SEIZED x${nftBalance}`);
    } else {
      return printBalanceSpan("UNSEIZED");
    }
  };

  const printBalanceSpan = (b: string) => {
    return (
      <span
        className={`${styles["balance"]}  ${
          height === 650 ? styles["balanceBigger"] : ""
        } `}>
        {b}
      </span>
    );
  };

  if (!connectedProfile) {
    return null;
  }

  if (isLoading) {
    return printBalanceSpan("...");
  }

  if (error) {
    console.error("Failed to fetch NFT balance:", error);
    return printBalanceSpan("N/A");
  }

  return printBalance();
}
