"use client";

import Image from "next/image";

import type { ContractOverview } from "../types";
import { shortenAddress } from "@/helpers/address.helpers";

interface NftContractHeaderProps {
    readonly contract: ContractOverview | null;
    readonly onClear: () => void;
}

export function NftContractHeader({
    contract,
    onClear,
}: NftContractHeaderProps) {

    if (!contract) {
        return null;
    }

    return (
        <section
            className="tw-group tw-relative tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-p-3 tw-transition-colors"
            aria-label="Selected NFT contract"
        >
            <div className="tw-relative tw-h-10 tw-w-10 tw-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
                {contract.imageUrl ? (
                    <Image
                        src={contract.imageUrl}
                        alt={contract.name ?? contract.address}
                        fill
                        sizes="40px"
                        className="tw-h-full tw-w-full tw-object-cover"
                    />
                ) : (
                    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-text-iron-500">
                        NFT
                    </div>
                )}
            </div>

            <div className="tw-flex tw-flex-col tw-gap-0.5 tw-overflow-hidden">
                <div className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
                        {contract.name ?? shortenAddress(contract.address)}
                    </span>
                    {contract.tokenType && (
                        <span className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-400">
                            {contract.tokenType}
                        </span>
                    )}
                </div>

                <div className="tw-flex tw-items-center tw-gap-1.5 tw-truncate tw-text-xs tw-text-iron-400">
                    <span className="tw-font-mono">{shortenAddress(contract.address)}</span>

                    {contract.totalSupply && (
                        <>
                            <span className="tw-text-iron-600">&bull;</span>
                            <span>{new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(Number(contract.totalSupply))} items</span>
                        </>
                    )}

                    {typeof contract.floorPriceEth === "number" && Number.isFinite(contract.floorPriceEth) && (
                        <>
                            <span className="tw-text-iron-600">&bull;</span>
                            <span>Floor {contract.floorPriceEth.toLocaleString(undefined, { maximumFractionDigits: 3 })} ETH</span>
                        </>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={onClear}
                className="tw-ml-auto tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-200 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500/50"
                aria-label="Clear selection"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="tw-h-5 tw-w-5"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </section>
    );
}
