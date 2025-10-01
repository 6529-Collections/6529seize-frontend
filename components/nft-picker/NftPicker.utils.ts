import type {
  ParseError,
  TokenRange,
  TokenSelection,
} from "./NftPicker.types";

export const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
export const MAX_ENUMERATION = BigInt(10_000);
const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);

export type RangeTooLargeError = Error & {
  code: "range-too-large";
  limit: bigint;
  size: bigint;
};

type ParseErrorArray = ParseError[] & Error;

function createParseErrorArray(errors: ParseError[], message?: string): ParseErrorArray {
  const issues = [...errors];
  const primaryMessage = message ?? issues[0]?.message ?? "Invalid token expression";
  const errorArray = Object.assign(issues, new Error(primaryMessage)) as ParseErrorArray;
  errorArray.name = "ParseErrorArray";
  return errorArray;
}

function throwParseErrors(errors: ParseError[], message?: string): never {
  throw createParseErrorArray(errors, message);
}

function createRangeTooLargeError(size: bigint): RangeTooLargeError {
  const error = new Error(
    `Range expands to ${size.toString()} tokens, exceeding the limit of ${MAX_ENUMERATION.toString()}.`
  ) as RangeTooLargeError;
  error.name = "RangeTooLargeError";
  error.code = "range-too-large";
  error.limit = MAX_ENUMERATION;
  error.size = size;
  return error;
}

export function isRangeTooLargeError(value: unknown): value is RangeTooLargeError {
  if (!(value instanceof Error)) {
    return false;
  }
  const candidate = value as Partial<RangeTooLargeError>;
  return candidate.code === "range-too-large" && typeof candidate.size === "bigint";
}

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
  let skipNext = false;
  for (let index = 0; index < parts.length; index += 1) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
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
      skipNext = true;
      continue;
    }
    segments.push(part);
  }
  return segments;
}

function makeError(segment: Segment, message: string, code?: string): ParseError {
  return {
    code,
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
  return BigInt(value);
}

function canonicalizeRanges(ranges: TokenRange[]): TokenRange[] {
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

export function parseTokenExpressionToRanges(input: string): TokenRange[] {
  if (!input.trim()) {
    return [];
  }
  const segments = tokenize(input);
  const errors: ParseError[] = [];
  const ranges: TokenRange[] = [];
  for (const segment of segments) {
    if (!segment.value) {
      continue;
    }
    const parts = segment.value.split("-");
    if (parts.length === 1) {
      const value = parseTokenValue(parts[0], segment, errors);
      if (value !== null) {
        ranges.push({ start: value, end: value });
      }
      continue;
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
        continue;
      }
      const [rangeStart, rangeEnd] = startValue <= endValue
        ? [startValue, endValue]
        : [endValue, startValue];
      const rangeSize = rangeEnd - rangeStart + BIGINT_ONE;
      if (rangeSize > MAX_ENUMERATION) {
        const limit = MAX_ENUMERATION.toString();
        const size = rangeSize.toString();
        errors.push(
          makeError(
            segment,
            `Range expands to ${size} tokens, exceeding the limit of ${limit}.`,
            "range-too-large"
          )
        );
        continue;
      }
      ranges.push({ start: rangeStart, end: rangeEnd });
      continue;
    }
    errors.push(makeError(segment, "Invalid range expression"));
  }
  if (errors.length) {
    throwParseErrors(errors);
  }
  const canonical = canonicalizeRanges(ranges);
  const total = canonical.reduce(
    (sum, range) => sum + (range.end - range.start + BIGINT_ONE),
    BIGINT_ZERO
  );
  if (total > MAX_ENUMERATION) {
    const trimmed = input.trim();
    const displayValue = trimmed.length ? trimmed : input;
    const parseError: ParseError = {
      code: "range-too-large",
      input: displayValue,
      index: 0,
      length: Math.max(displayValue.length, 1),
      message: `Selection expands to ${total.toString()} tokens, exceeding the limit of ${MAX_ENUMERATION.toString()}.`,
    };
    throwParseErrors([parseError], parseError.message);
  }
  return canonical;
}

export function parseTokenExpressionToBigints(input: string): TokenSelection {
  const ranges = parseTokenExpressionToRanges(input);
  try {
    return fromCanonicalRanges(ranges);
  } catch (error) {
    if (isRangeTooLargeError(error)) {
      const trimmed = input.trim();
      const displayValue = trimmed.length ? trimmed : input;
      const parseError: ParseError = {
        code: error.code,
        input: displayValue,
        index: 0,
        length: Math.max(displayValue.length, 1),
        message: error.message,
      };
      throwParseErrors([parseError], error.message);
    }
    throw error;
  }
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

/** @deprecated Use sortAndDedupIds instead. */
export const mergeAndSort = sortAndDedupIds;

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
  ranges.forEach((range) => {
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
  const isNegative = raw.startsWith("-");
  const digits = isNegative ? raw.slice(1) : raw;

  if (digits.length <= 3) {
    return isNegative ? `-${digits}` : digits;
  }

  let formatted = "";
  for (let index = 0; index < digits.length; index += 1) {
    const char = digits[digits.length - 1 - index];
    if (index > 0 && index % 3 === 0) {
      formatted = `,${formatted}`;
    }
    formatted = `${char}${formatted}`;
  }

  return isNegative ? `-${formatted}` : formatted;
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
