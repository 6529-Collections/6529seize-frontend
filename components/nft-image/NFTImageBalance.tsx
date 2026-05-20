"use client";

import { useAuth } from "@/components/auth/Auth";
import styles from "@/components/nft-image/NFTImage.module.scss";
import { useNftBalanceFromContext } from "@/components/nft-image/NftBalancesContext";
import { useNftBalance } from "@/hooks/useNftBalance";

interface Props {
  readonly contract: string;
  readonly tokenId: number;
  readonly height: 300 | 650 | "full";
  readonly inline?: boolean | undefined;
  readonly variant?: "default" | "collection-card";
}

type BalanceDisplayState = "seized" | "unseized" | "loading" | "error";

const COLLECTION_CARD_BALANCE_BASE_CLASS =
  "tw-inline-flex tw-h-6 tw-max-w-full tw-items-center tw-truncate tw-rounded-md tw-border tw-border-solid tw-px-2 tw-text-[0.6875rem] tw-font-medium tw-leading-none";

const COLLECTION_CARD_BALANCE_STATE_CLASSES: Record<
  BalanceDisplayState,
  string
> = {
  seized:
    "tw-border-emerald-400/25 tw-bg-emerald-500/15 tw-font-semibold tw-text-emerald-200",
  unseized: "tw-border-white/[0.06] tw-bg-transparent tw-text-iron-500",
  loading: "tw-border-white/[0.06] tw-bg-transparent tw-text-iron-500",
  error: "tw-border-amber-300/25 tw-bg-amber-400/15 tw-text-amber-100",
};

export default function NFTImageBalance({
  contract,
  tokenId,
  height,
  inline = false,
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

  const printBalance = () => {
    if (balanceState.balance > 0) {
      return printBalanceSpan(
        variant === "collection-card"
          ? `Seized x ${balanceState.balance}`
          : `SEIZED x${balanceState.balance}`,
        "seized"
      );
    } else {
      return printBalanceSpan(
        variant === "collection-card" ? "Unseized" : "UNSEIZED",
        "unseized"
      );
    }
  };

  const printBalanceSpan = (b: string, state: BalanceDisplayState) => {
    if (variant === "collection-card") {
      return (
        <span
          className={`${COLLECTION_CARD_BALANCE_BASE_CLASS} ${COLLECTION_CARD_BALANCE_STATE_CLASSES[state]}`}
        >
          {b}
        </span>
      );
    }

    if (inline) {
      return <span className={styles["balanceInline"]}>{b}</span>;
    }

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
    return printBalanceSpan("...", "loading");
  }

  if (balanceState.error) {
    console.error("Failed to fetch NFT balance:", balanceState.error);
    return printBalanceSpan("N/A", "error");
  }

  return printBalance();
}
