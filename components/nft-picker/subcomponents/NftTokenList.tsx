"use client";

import type { ReactNode } from "react";

import type { SupportedChain, TokenMetadata, TokenRange } from "../types";
import { formatCanonical } from "../utils";
import { VirtualizedTokenList } from "@/components/token-list/VirtualizedTokenList";

interface NftTokenListProps {
  readonly contractAddress?: `0x${string}` | undefined;
  readonly chain: SupportedChain;
  readonly ranges: TokenRange[];
  readonly overscan?: number | undefined;
  readonly variant: "card" | "flat";
  readonly renderTokenExtra?:
    | ((tokenId: bigint, metadata?: TokenMetadata) => ReactNode)
    | undefined
    | undefined;
  readonly onRemove: (tokenId: bigint) => void;
}

export function NftTokenList({
  contractAddress,
  chain,
  ranges,
  overscan,
  variant,
  renderTokenExtra,
  onRemove,
}: NftTokenListProps) {
  const isFlat = variant === "flat";

  return (
    <VirtualizedTokenList
      contractAddress={contractAddress}
      chain={chain}
      ranges={ranges}
      overscan={overscan}
      scrollKey="nft-picker-token-list"
      renderTokenExtra={renderTokenExtra}
      action={
        onRemove
          ? {
              label: "Remove",
              onClick: onRemove,
              getAriaLabel: (tokenLabel: string) =>
                `Remove token ${tokenLabel}`,
              className: isFlat
                ? "tw-h-9 tw-rounded-lg tw-border-white/10 tw-px-3 tw-text-xs tw-font-semibold"
                : undefined,
            }
          : undefined
      }
      className={
        isFlat
          ? "tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/40"
          : undefined
      }
      rowClassName={isFlat ? "tw-px-4" : undefined}
      footerContent={isFlat ? undefined : formatCanonical(ranges)}
      emptyState={
        <div className="tw-text-sm tw-text-iron-300">No tokens selected.</div>
      }
    />
  );
}
