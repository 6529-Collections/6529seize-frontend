"use client";

import clsx from "clsx";
import Image from "next/image";
import { useRef, useId, type ChangeEvent } from "react";

import DistributionPlanVerifiedIcon from "../../distribution-plan-tool/common/DistributionPlanVerifiedIcon";
import type { Suggestion } from "../types";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import { shortenAddress } from "@/helpers/address.helpers";

interface NftSuggestListProps {
    readonly items: Suggestion[];
    readonly activeIndex: number;
    readonly isOpen: boolean;
    readonly hiddenCount: number;
    readonly hideSpam: boolean;
    readonly onToggleSpam: () => void;
    readonly onHover: (index: number) => void;
    readonly onSelect: (item: Suggestion) => void;
}

const ROW_HEIGHT = 64;
const OVERSCAN = 6;
const ACCESSIBLE_SELECT_PLACEHOLDER_VALUE = "__nft_suggest_placeholder__";
const ACCESSIBLE_SELECT_MAX_SIZE = 10;

type SuggestionOptionValue =
    | typeof ACCESSIBLE_SELECT_PLACEHOLDER_VALUE
    | Suggestion["address"];

const isSuggestionAddress = (
    value: SuggestionOptionValue
): value is Suggestion["address"] => value !== ACCESSIBLE_SELECT_PLACEHOLDER_VALUE;

function formatFloor(value: number | null | undefined): string {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "—";
    }
    const normalized = Math.max(value, 0);
    if (normalized >= 1) {
        return normalized.toFixed(2);
    }
    return normalized.toFixed(3);
}

function getSuggestionOptionLabel(suggestion: Suggestion): string {
    const mainLabel = suggestion.name ?? shortenAddress(suggestion.address);
    const labelParts = [mainLabel];
    const shortAddress = shortenAddress(suggestion.address);
    if (shortAddress && shortAddress !== mainLabel) {
        labelParts.push(shortAddress);
    }
    if (suggestion.tokenType) {
        labelParts.push(suggestion.tokenType);
    }
    if (typeof suggestion.floorPriceEth === "number" && !Number.isNaN(suggestion.floorPriceEth)) {
        labelParts.push(`Floor Ξ${formatFloor(suggestion.floorPriceEth)}`);
    }
    if (suggestion.totalSupply) {
        labelParts.push(`Supply ${suggestion.totalSupply}`);
    }
    if (suggestion.safelist === "verified") {
        labelParts.push("Verified");
    }
    if (suggestion.isSpam) {
        labelParts.push("Suspected spam");
    }
    return labelParts.join(" • ");
}

export function NftSuggestList({
    items,
    activeIndex,
    isOpen,
    hiddenCount,
    hideSpam,
    onToggleSpam,
    onHover,
    onSelect,
}: NftSuggestListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const nativeSelectDescriptionId = useId();
    const nativeSelectSize = Math.min(Math.max(items.length || 0, 1), ACCESSIBLE_SELECT_MAX_SIZE);
    const hasSuggestions = items.length > 0;

    const virtualization = useVirtualizedWaves<Suggestion>(
        items,
        "nft-picker-suggestions",
        scrollContainerRef,
        listContainerRef,
        ROW_HEIGHT,
        OVERSCAN,
        isOpen
    );

    if (!isOpen) {
        return null;
    }

    const handleNativeSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value as SuggestionOptionValue;
        if (!isSuggestionAddress(selectedValue)) {
            return;
        }
        const selectedSuggestion = items.find((item) => item.address === selectedValue);
        if (selectedSuggestion) {
            onSelect(selectedSuggestion);
        }
    };

    return (
        <div
            ref={scrollContainerRef}
            className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-z-20 tw-mt-2 tw-max-h-80 tw-overflow-y-auto tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900"
        >
            <p id={nativeSelectDescriptionId} className="tw-sr-only">
                Choose an NFT collection from the following suggestions.
            </p>
            <select
                id="nft-picker-suggest-list"
                aria-label="NFT collections suggestions"
                aria-describedby={nativeSelectDescriptionId}
                className="tw-sr-only"
                size={nativeSelectSize}
                defaultValue={ACCESSIBLE_SELECT_PLACEHOLDER_VALUE}
                onChange={handleNativeSelectChange}
            >
                <option value={ACCESSIBLE_SELECT_PLACEHOLDER_VALUE} disabled>
                    {hasSuggestions ? "Select a suggestion" : "No suggestions available"}
                </option>
                {items.map((suggestion) => (
                    <option key={suggestion.address} value={suggestion.address}>
                        {getSuggestionOptionLabel(suggestion)}
                    </option>
                ))}
            </select>
            <div
                ref={listContainerRef}
                style={{ height: virtualization.totalHeight, position: "relative" }}
            >
                <ul
                    aria-hidden="true"
                    className="tw-relative tw-m-0 tw-list-none tw-p-0"
                    style={{ height: "100%" }}
                >
                    {virtualization.virtualItems.map((virtual) => {
                        if (virtual.index >= items.length) {
                            return (
                                <li
                                    key="suggestions-sentinel"
                                    className="tw-absolute tw-w-full"
                                    style={{ top: virtual.start, height: virtual.size }}
                                    aria-hidden="true"
                                >
                                    <div
                                        ref={virtualization.sentinelRef}
                                        style={{ height: "100%", width: "100%" }}
                                    />
                                    {!hasSuggestions && (
                                        <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-3 tw-text-sm tw-text-iron-400">
                                            No suggestions available
                                        </div>
                                    )}
                                </li>
                            );
                        }
                        const suggestion = items[virtual.index];
                        const isActive = virtual.index === activeIndex;
                        return (
                            <li
                                key={suggestion.address}
                                id={`nft-suggestion-${virtual.index}`}
                                className="tw-absolute tw-w-full"
                                style={{ top: virtual.start, height: virtual.size }}
                            >
                                <button
                                    type="button"
                                    className={clsx(
                                        "tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-items-center tw-gap-3 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-left tw-transition-colors",
                                        isActive
                                            ? "tw-bg-primary-500/20 tw-text-white"
                                            : "tw-text-iron-200 hover:tw-bg-iron-800"
                                    )}
                                    onMouseEnter={() => onHover(virtual.index)}
                                    onFocus={() => onHover(virtual.index)}
                                    onClick={() => onSelect(suggestion)}
                                >
                                    <div className="tw-relative tw-h-10 tw-w-10">
                                        <div className="tw-h-full tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
                                            {suggestion.imageUrl ? (
                                                <Image
                                                    src={suggestion.imageUrl}
                                                    alt=""
                                                    fill
                                                    sizes="40px"
                                                    className="tw-h-full tw-w-full tw-object-cover"
                                                />
                                            ) : (
                                                <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
                                                    NFT
                                                </div>
                                            )}
                                        </div>
                                        {suggestion.safelist === "verified" && (
                                            <div className="tw-absolute tw-right-[-6px] tw-top-[-6px]">
                                                <DistributionPlanVerifiedIcon />
                                            </div>
                                        )}
                                    </div>
                                    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-1">
                                        <span className="tw-text-sm tw-font-medium tw-text-white">
                                            {suggestion.name ?? shortenAddress(suggestion.address)}
                                        </span>
                                        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
                                            <span>{shortenAddress(suggestion.address)}</span>
                                            {suggestion.tokenType && (
                                                <span className="tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5">
                                                    {suggestion.tokenType}
                                                </span>
                                            )}
                                            <span>Ξ{formatFloor(suggestion.floorPriceEth)}</span>
                                            {suggestion.totalSupply && <span>Supply {suggestion.totalSupply}</span>}
                                            {suggestion.safelist === "verified" && (
                                                <span className="tw-rounded tw-bg-green-500/20 tw-px-2 tw-py-0.5 tw-text-green-300">
                                                    Verified
                                                </span>
                                            )}
                                            {suggestion.isSpam && (
                                                <span className="tw-rounded tw-bg-amber-500/20 tw-px-2 tw-py-0.5 tw-text-amber-300">
                                                    Suspected spam
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {hideSpam && hiddenCount > 0 && (
                <div className="tw-border-t tw-border-iron-700 tw-px-3 tw-py-2 tw-text-xs tw-text-amber-300">
                    Filtered suspected spam collections ({hiddenCount}).
                    <button
                        type="button"
                        className="tw-ml-2 tw-text-primary-400 hover:tw-underline"
                        onClick={onToggleSpam}
                    >
                        Show anyway
                    </button>
                </div>
            )}
        </div>
    );
}
