"use client";

import Image from "next/image";

import type { ContractOverview } from "../types";
import { shortenAddress } from "@/helpers/address.helpers";

interface NftContractHeaderProps {
    readonly contract: ContractOverview | null;
    readonly onChange: () => void;
    readonly onClear: () => void;
}

export function NftContractHeader({
    contract,
    onChange,
    onClear,
}: NftContractHeaderProps) {

    if (!contract) {
        return null;
    }

    return (
        <section
            className="tw-@container tw-flex tw-flex-col tw-gap-3 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900 tw-p-3 @md:tw-flex-row @md:tw-items-center @md:tw-justify-between"
            aria-label="Selected NFT contract"
        >
            <div className="tw-flex tw-items-start tw-gap-3 @md:tw-items-center">
                <div className="tw-relative tw-h-12 tw-w-12 tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
                    {contract.imageUrl ? (
                        <Image
                            src={contract.imageUrl}
                            alt={contract.name ?? contract.address}
                            fill
                            sizes="48px"
                            className="tw-h-full tw-w-full tw-object-cover"
                        />
                    ) : (
                        <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-sm tw-font-semibold tw-text-iron-300">
                            NFT
                        </div>
                    )}
                </div>
                <div className="tw-flex tw-flex-col tw-gap-1">
                    <div className="tw-flex tw-flex-col">
                        <span className="tw-text-sm tw-font-semibold tw-text-white">
                            {contract.name ?? shortenAddress(contract.address)}
                        </span>
                        <span className="tw-text-xs tw-text-iron-400">
                            {shortenAddress(contract.address)}
                        </span>
                    </div>
                    <div className="tw-flex tw-flex-wrap tw-gap-2 tw-text-xs tw-text-iron-300">
                        {contract.tokenType && (
                            <span className="tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5">
                                {contract.tokenType}
                            </span>
                        )}
                        {contract.totalSupply && (
                            <span className="tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5">
                                Supply {contract.totalSupply}
                            </span>
                        )}
                        {typeof contract.floorPriceEth === "number" &&
                            Number.isFinite(contract.floorPriceEth) && (
                                <span className="tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5">
                                    Floor Ξ{contract.floorPriceEth.toFixed(3)}
                                </span>
                            )}
                    </div>
                </div>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
                <button
                    type="button"
                    className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-1 tw-text-sm tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
                    onClick={onChange}
                >
                    Change
                </button>
                <button
                    type="button"
                    className="tw-rounded tw-bg-primary-500 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-black hover:tw-bg-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
                    onClick={onClear}
                >
                    Clear
                </button>
            </div>
        </section>
    );
}
