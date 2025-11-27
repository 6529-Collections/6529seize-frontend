import type { TokenRange, Suggestion } from "../types";
import { shortenAddress } from "@/helpers/address.helpers";
import { BIGINT_ZERO } from "./constants";

export function formatCanonical(ranges: TokenRange[]): string {
    return ranges
        .map((range) =>
            range.start === range.end
                ? range.start.toString()
                : `${range.start.toString()}-${range.end.toString()}`
        )
        .join(",");
}

export function formatBigIntWithSeparators(value: bigint): string {
    if (value < BIGINT_ZERO) {
        throw new Error("formatBigIntWithSeparators expects non-negative values");
    }
    const digits = value.toString();

    if (digits.length <= 3) {
        return digits;
    }

    let formatted = "";
    for (let index = 0; index < digits.length; index += 1) {
        const char = digits[digits.length - 1 - index];
        if (index > 0 && index % 3 === 0) {
            formatted = `,${formatted}`;
        }
        formatted = `${char}${formatted}`;
    }

    return formatted;
}

export function formatFloor(value: number | null | undefined): string {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "—";
    }
    const normalized = Math.max(value, 0);
    if (normalized >= 1) {
        return normalized.toFixed(2);
    }
    return normalized.toFixed(3);
}

export function getSuggestionOptionLabel(suggestion: Suggestion): string {
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
