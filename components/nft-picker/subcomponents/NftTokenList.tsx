"use client";

import type { ReactNode } from "react";

import type {
    SupportedChain,
    TokenMetadata,
    TokenRange,
} from "../types";
import { formatCanonical } from "../utils";
import { VirtualizedTokenList } from "@/components/token-list/VirtualizedTokenList";

interface NftTokenListProps {
    readonly contractAddress?: `0x${string}`;
    readonly chain: SupportedChain;
    readonly ranges: TokenRange[];
    readonly overscan?: number;
    readonly renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
    readonly onRemove: (tokenId: bigint) => void;
}

export function NftTokenList({
    contractAddress,
    chain,
    ranges,
    overscan,
    renderTokenExtra,
    onRemove,
}: NftTokenListProps) {
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
                        getAriaLabel: (tokenLabel: string) => `Remove token ${tokenLabel}`,
                    }
                    : undefined
            }
            footerContent={formatCanonical(ranges)}
            emptyState={<div className="tw-text-sm tw-text-iron-300">No tokens selected.</div>}
        />
    );
}
