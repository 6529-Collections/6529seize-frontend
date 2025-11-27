import type { TokenRange } from "../types";
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
