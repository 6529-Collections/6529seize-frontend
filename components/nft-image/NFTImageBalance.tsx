"use client";

import { useAuth } from "../auth/Auth";
import styles from "./NFTImage.module.scss";
import { useNftBalance } from "../../hooks/useNftBalance";

interface Props {
  readonly contract: string;
  readonly tokenId: number;
  readonly showOwnedIfLoggedIn: boolean;
  readonly showUnseizedIfLoggedIn: boolean;
  readonly height: 300 | 650 | "full";
}

export default function NFTImageBalance({
  contract,
  tokenId,
  showOwnedIfLoggedIn,
  showUnseizedIfLoggedIn,
  height,
}: Props) {
  const { connectedProfile } = useAuth();

  const { balance: nftBalance, error } = useNftBalance({
    consolidationKey: connectedProfile?.consolidation_key ?? null,
    contract,
    tokenId,
  });

  if (error) {
    console.error("Failed to fetch NFT balance:", error);
  }

  return (
    <>
      {nftBalance > 0 && (
        <span
          className={`${styles.balance}  ${
            height === 650 ? styles.balanceBigger : ""
          }`}
        >
          <span>SEIZED{!showOwnedIfLoggedIn && connectedProfile ? ` x${nftBalance}` : ""}</span>
        </span>
      )}
      {showUnseizedIfLoggedIn && connectedProfile && nftBalance === 0 && (
        <span className={`${styles.balance}`}>UNSEIZED</span>
      )}
      {showUnseizedIfLoggedIn && connectedProfile && nftBalance === -1 && (
        <span className={`${styles.balance}`}>...</span>
      )}
    </>
  );
}
