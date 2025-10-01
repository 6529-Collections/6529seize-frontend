import type {
  ParseError,
  TokenRange,
  TokenSelection,
} from "./NftPicker.types";

export const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);

interface Segment {
  value: string;
  start: number;
  end: number;
}

function isDelimiter(char: string): boolean {
  return char === "," || /\s/.test(char);
}

function tokenize(input: string): Segment[] {
  const parts: Segment[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (isDelimiter(char)) {
      i += 1;
      continue;
    }
    const start = i;
    let value = "";
    while (i < input.length && !isDelimiter(input[i])) {
      value += input[i];
      i += 1;
    }
    parts.push({ value, start, end: i });
  }
  if (!parts.length) {
    return [];
  }
  const segments: Segment[] = [];
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (
      part.value === "-" &&
      segments.length > 0 &&
      index + 1 < parts.length &&
      parts[index + 1].value !== "-"
    ) {
      const previous = segments.pop()!;
      const next = parts[index + 1];
      segments.push({
        value: `${previous.value}-${next.value}`,
        start: previous.start,
        end: next.end,
      });
      index += 1;
      continue;
    }
    segments.push(part);
  }
  return segments;
}

function makeError(segment: Segment, message: string): ParseError {
  return {
    input: segment.value,
    index: segment.start,
    length: Math.max(segment.end - segment.start, segment.value.length || 1),
    message,
  };
}

function parseTokenValue(
  value: string,
  segment: Segment,
  errors: ParseError[],
  overrideStart?: number
): bigint | null {
  if (!value) {
    errors.push(makeError(segment, "Token is empty"));
    return null;
  }
  if (/^[+-]/.test(value)) {
    errors.push(makeError(segment, "Negative and signed values are not allowed"));
    return null;
  }
  const isHex = /^0[xX][0-9a-fA-F]+$/.test(value);
  const isDecimal = /^\d+$/.test(value);
  if (!isHex && !isDecimal) {
    const start = overrideStart ?? segment.start;
    errors.push({
      input: value,
      index: start,
      length: value.length,
      message: "Invalid token format",
    });
    return null;
  }
  try {
    return BigInt(value);
  } catch (error) {
    const start = overrideStart ?? segment.start;
    errors.push({
      input: value,
      index: start,
      length: value.length,
      message: "Unable to parse token value",
    });
    return null;
  }
}

export function parseTokenExpressionToBigints(input: string): TokenSelection {
  if (!input.trim()) {
    return [];
  }
  const segments = tokenize(input);
  const errors: ParseError[] = [];
  const values: bigint[] = [];
  segments.forEach((segment) => {
    if (!segment.value) {
      return;
    }
    const parts = segment.value.split("-");
    if (parts.length === 1) {
      const value = parseTokenValue(parts[0], segment, errors);
      if (value !== null) {
        values.push(value);
      }
      return;
    }
    if (parts.length === 2) {
      const [startValueRaw, endValueRaw] = parts;
      const startValue = parseTokenValue(startValueRaw, segment, errors);
      const endStartIndex = segment.end - endValueRaw.length;
      const endSegment: Segment = {
        value: endValueRaw,
        start: endStartIndex,
        end: segment.end,
      };
      const endValue = parseTokenValue(endValueRaw, endSegment, errors, endStartIndex);
      if (startValue === null || endValue === null) {
        return;
      }
      let rangeStart = startValue;
      let rangeEnd = endValue;
      if (rangeStart > rangeEnd) {
        const temp = rangeStart;
        rangeStart = rangeEnd;
        rangeEnd = temp;
      }
      for (let cursor = rangeStart; cursor <= rangeEnd; cursor += BIGINT_ONE) {
        values.push(cursor);
      }
      return;
    }
    errors.push(makeError(segment, "Invalid range expression"));
  });
  if (errors.length) {
    throw errors;
  }
  return values;
}

export function bigintCompare(a: bigint, b: bigint): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

export function sortAndDedupIds(ids: TokenSelection): TokenSelection {
  const sorted = [...ids].sort(bigintCompare);
  const result: TokenSelection = [];
  for (const id of sorted) {
    if (result.length === 0 || result[result.length - 1] !== id) {
      result.push(id);
    }
  }
  return result;
}

// TODO: remove once callers migrate to sortAndDedupIds.
export const mergeAndSort = sortAndDedupIds;

export function toCanonicalRanges(ids: TokenSelection): TokenRange[] {
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
  ranges.forEach((range) => {
    let cursor = range.start;
    while (cursor <= range.end) {
      values.push(cursor);
      cursor += BIGINT_ONE;
    }
  });
  return values;
}

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
  const raw = value.toString();
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function tryToNumberArray(ids: TokenSelection): {
  numbers: number[];
  unsafeCount: number;
} {
  const numbers: number[] = [];
  let unsafeCount = 0;
  ids.forEach((id) => {
    if (id > MAX_SAFE) {
      unsafeCount += 1;
    } else {
      numbers.push(Number(id));
    }
  });
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
    const take = available < remaining ? available : remaining;
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
