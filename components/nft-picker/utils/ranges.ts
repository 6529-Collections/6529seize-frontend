import type { TokenRange, TokenSelection } from "../types";
import { BIGINT_ONE, BIGINT_ZERO, MAX_ENUMERATION, MAX_SAFE } from "./constants";
import { createRangeTooLargeError } from "./errors";

export function canonicalizeRanges(ranges: TokenRange[]): TokenRange[] {
    if (!ranges.length) {
        return [];
    }
    const sorted = [...ranges].sort((a, b) => {
        if (a.start === b.start) {
            if (a.end === b.end) {
                return 0;
            }
            return a.end < b.end ? -1 : 1;
        }
        return a.start < b.start ? -1 : 1;
    });
    const canonical: TokenRange[] = [];
    for (const range of sorted) {
        if (!canonical.length) {
            canonical.push({ start: range.start, end: range.end });
            continue;
        }
        const lastIndex = canonical.length - 1;
        const last = canonical.at(-1);
        if (!last) {
            canonical.push({ start: range.start, end: range.end });
            continue;
        }
        if (range.start <= last.end + BIGINT_ONE) {
            let mergedEnd = last.end;
            if (range.end > last.end) {
                mergedEnd = range.end;
            }
            canonical[lastIndex] = { start: last.start, end: mergedEnd };
            continue;
        }
        canonical.push({ start: range.start, end: range.end });
    }
    return canonical;
}

export function mergeCanonicalRanges(
    current: TokenRange[],
    additions: TokenRange[]
): TokenRange[] {
    if (!additions.length) {
        return current;
    }
    if (!current.length) {
        return canonicalizeRanges(additions);
    }
    return canonicalizeRanges([...current, ...additions]);
}

export function removeTokenFromRanges(
    ranges: TokenRange[],
    tokenId: bigint
): TokenRange[] {
    if (!ranges.length) {
        return ranges;
    }
    const result: TokenRange[] = [];
    for (const range of ranges) {
        if (tokenId < range.start || tokenId > range.end) {
            result.push(range);
            continue;
        }
        if (range.start === range.end && range.start === tokenId) {
            continue;
        }
        if (tokenId === range.start) {
            result.push({ start: range.start + BIGINT_ONE, end: range.end });
            continue;
        }
        if (tokenId === range.end) {
            result.push({ start: range.start, end: range.end - BIGINT_ONE });
            continue;
        }
        result.push(
            { start: range.start, end: tokenId - BIGINT_ONE },
            { start: tokenId + BIGINT_ONE, end: range.end }
        );
    }
    return canonicalizeRanges(result);
}

export function bigintCompare(a: bigint, b: bigint): number {
    if (a === b) {
        return 0;
    }
    return a < b ? -1 : 1;
}

export function sortAndDedupIds(ids: readonly bigint[]): TokenSelection {
    const sorted = [...ids].sort(bigintCompare);
    const result: TokenSelection = [];
    for (const id of sorted) {
        const last = result.at(-1);
        if (last === undefined || last !== id) {
            result.push(id);
        }
    }
    return result;
}

export function toCanonicalRanges(ids: readonly bigint[]): TokenRange[] {
    const sorted = sortAndDedupIds(ids);
    if (sorted.length === 0) {
        return [];
    }
    const ranges: TokenRange[] = [];
    let current: TokenRange = { start: sorted[0], end: sorted[0] };
    for (let index = 1; index < sorted.length; index += 1) {
        const value = sorted[index];
        if (value === current.end + BIGINT_ONE) {
            current = { start: current.start, end: value };
        } else {
            ranges.push(current);
            current = { start: value, end: value };
        }
    }
    ranges.push(current);
    return ranges;
}

export function fromCanonicalRanges(ranges: TokenRange[]): TokenSelection {
    const values: TokenSelection = [];
    let total = BIGINT_ZERO;
    for (const range of ranges) {
        let cursor = range.start;
        const rangeSize = range.end - range.start + BIGINT_ONE;
        if (rangeSize > MAX_ENUMERATION) {
            throw createRangeTooLargeError(rangeSize);
        }
        total += rangeSize;
        if (total > MAX_ENUMERATION) {
            throw createRangeTooLargeError(total);
        }
        while (cursor <= range.end) {
            values.push(cursor);
            cursor += BIGINT_ONE;
        }
    }
    return values;
}

export function tryToNumberArray(ids: TokenSelection): {
    numbers: number[];
    unsafeCount: number;
} {
    const numbers: number[] = [];
    let unsafeCount = 0;
    for (const id of ids) {
        if (id > MAX_SAFE) {
            unsafeCount += 1;
        } else {
            numbers.push(Number(id));
        }
    }
    return { numbers, unsafeCount };
}

export function expandRangesWindow(
    ranges: TokenRange[],
    startIndex: number,
    count: number
): TokenSelection {
    if (count <= 0 || startIndex < 0 || !ranges.length) {
        return [];
    }
    const start = BigInt(startIndex);
    const limit = BigInt(count);
    const result: TokenSelection = [];
    let consumed = BIGINT_ZERO;
    for (const range of ranges) {
        const rangeLength = range.end - range.start + BIGINT_ONE;
        const rangeStartIndex = consumed;
        const rangeEndIndex = consumed + rangeLength;
        if (rangeEndIndex <= start) {
            consumed = rangeEndIndex;
            continue;
        }
        let localStart = range.start;
        if (start > rangeStartIndex) {
            const offset = start - rangeStartIndex;
            localStart = range.start + offset;
        }
        const remaining = limit - BigInt(result.length);
        const available = range.end - localStart + BIGINT_ONE;
        let take = available;
        if (remaining < available) {
            take = remaining;
        }
        for (let step = BIGINT_ZERO; step < take; step += BIGINT_ONE) {
            result.push(localStart + step);
        }
        if (BigInt(result.length) >= limit) {
            break;
        }
        consumed = rangeEndIndex;
    }
    return result;
}
