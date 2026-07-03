"use client";

import styles from "@/components/nft-image/NFTImage.module.css";

export type NFTImageBalanceBadgeState =
  | "seized"
  | "unseized"
  | "loading"
  | "error";

export type NFTImageBalanceBadgeVariant = "default" | "compact";
export type NFTImageBalanceBadgeSize = "sm" | "md";

interface Props {
  readonly state: NFTImageBalanceBadgeState;
  readonly balance?: number | undefined;
  readonly height: 300 | 650 | "full";
  readonly inline?: boolean | undefined;
  readonly size?: NFTImageBalanceBadgeSize | undefined;
  readonly variant?: NFTImageBalanceBadgeVariant | undefined;
}

const COMPACT_BASE_CLASS =
  "tw-inline-flex tw-max-w-full tw-items-center tw-truncate tw-rounded-md tw-border tw-border-solid tw-font-medium tw-uppercase tw-leading-none";

const COMPACT_SIZE_CLASSES: Record<NFTImageBalanceBadgeSize, string> = {
  sm: "tw-h-6 tw-px-2 tw-text-[0.625rem] tw-tracking-[0.06em]",
  md: "tw-h-7 tw-px-3 tw-text-[0.65625rem] tw-tracking-[0.08em]",
};

const COMPACT_STATE_CLASSES: Record<NFTImageBalanceBadgeState, string> = {
  seized:
    "tw-border-primary-400/25 tw-bg-primary-400/[0.035] tw-text-primary-300/90",
  unseized: "tw-border-iron-800 tw-bg-white/[0.025] tw-text-iron-400",
  loading: "tw-border-iron-800 tw-bg-white/[0.025] tw-text-iron-400",
  error: "tw-border-amber-300/35 tw-text-amber-200",
};

const COMPACT_SEIZED_QUANTITY_CLASS = "tw-text-primary-300/90";

function getNFTImageBalanceLabel(
  state: NFTImageBalanceBadgeState,
  balance = 0
) {
  switch (state) {
    case "seized":
      return `SEIZED x${balance}`;
    case "unseized":
      return "UNSEIZED";
    case "loading":
      return "...";
    case "error":
      return "N/A";
  }
}

export default function NFTImageBalanceBadge({
  state,
  balance,
  height,
  inline = false,
  size = "md",
  variant = "default",
}: Props) {
  const label = getNFTImageBalanceLabel(state, balance);

  if (variant === "compact") {
    if (state === "seized") {
      return (
        <span
          aria-label={label}
          className={`${COMPACT_BASE_CLASS} ${COMPACT_SIZE_CLASSES[size]} ${COMPACT_STATE_CLASSES[state]} tw-gap-1`}
        >
          <span>SEIZED</span>
          <span className={COMPACT_SEIZED_QUANTITY_CLASS}>x{balance ?? 0}</span>
        </span>
      );
    }

    return (
      <span
        className={`${COMPACT_BASE_CLASS} ${COMPACT_SIZE_CLASSES[size]} ${COMPACT_STATE_CLASSES[state]}`}
      >
        {label}
      </span>
    );
  }

  if (inline) {
    return <span className={styles["balanceInline"]}>{label}</span>;
  }

  return (
    <span
      className={`${styles["balance"]} ${
        height === 650 ? styles["balanceBigger"] : ""
      } `}
    >
      {label}
    </span>
  );
}
