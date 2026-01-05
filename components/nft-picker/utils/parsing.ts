import type { ParseError, TokenRange, TokenSelection } from "../types";
import { BIGINT_ONE, BIGINT_ZERO, MAX_ENUMERATION } from "./constants";
import { makeError, throwParseErrors, isRangeTooLargeError } from "./errors";
import { canonicalizeRanges, fromCanonicalRanges } from "./ranges";

interface Segment {
  value: string;
  start: number;
  end: number;
}

function isDelimiter(char: string): boolean {
  return char === "," || /\s/.test(char);
}

export function tokenize(input: string): Segment[] {
  const parts: Segment[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (char && isDelimiter(char)) {
      i += 1;
      continue;
    }
    const start = i;
    let value = "";
    while (i < input.length && !isDelimiter(input[i] ?? "")) {
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
      part?.value === "-" &&
      segments.length > 0 &&
      index + 1 < parts.length &&
      parts[index + 1]?.value !== "-"
    ) {
      const previous = segments.pop()!;
      const next = parts[index + 1];
      segments.push({
        value: `${previous.value}-${next?.value}`,
        start: previous.start,
        end: next!.end,
      });
      skipNext = true;
      continue;
    }
    segments.push(part!);
  }
  return segments;
}

function parseTokenValue(
  value: string,
  segment: Segment,
  errors: ParseError[],
  overrideStart?: number
): bigint | null {
  if (!value) {
    errors.push(
      makeError(segment.value, segment.start, segment.end, "Token is empty")
    );
    return null;
  }
  if (/^[+-]/.test(value)) {
    errors.push(
      makeError(
        segment.value,
        segment.start,
        segment.end,
        "Negative and signed values are not allowed"
      )
    );
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

function parseSingleTokenSegment(
  value: string,
  segment: Segment,
  errors: ParseError[]
): TokenRange[] {
  const parsedValue = parseTokenValue(value, segment, errors);
  return parsedValue === null ? [] : [{ start: parsedValue, end: parsedValue }];
}

function parseRangeSegment(
  startValueRaw: string,
  endValueRaw: string,
  segment: Segment,
  errors: ParseError[]
): TokenRange | null {
  const startValue = parseTokenValue(startValueRaw, segment, errors);
  const endStartIndex = segment.end - endValueRaw.length;
  const endSegment: Segment = {
    value: endValueRaw,
    start: endStartIndex,
    end: segment.end,
  };
  const endValue = parseTokenValue(
    endValueRaw,
    endSegment,
    errors,
    endStartIndex
  );
  if (startValue === null || endValue === null) {
    return null;
  }
  const reversedRange = startValue > endValue;
  const [rangeStart, rangeEnd] = reversedRange
    ? [endValue, startValue]
    : [startValue, endValue];

  const rangeSize = rangeEnd - rangeStart + BIGINT_ONE;
  if (rangeSize > MAX_ENUMERATION) {
    const limit = MAX_ENUMERATION.toString();
    const size = rangeSize.toString();
    errors.push(
      makeError(
        segment.value,
        segment.start,
        segment.end,
        `Range expands to ${size} tokens, exceeding the limit of ${limit}.`,
        "range-too-large"
      )
    );
    return null;
  }
  return { start: rangeStart, end: rangeEnd };
}

function parseSegmentToRanges(
  segment: Segment,
  errors: ParseError[]
): TokenRange[] {
  if (!segment.value) {
    return [];
  }
  if (
    /^[+-]?\d+$/.test(segment.value) ||
    /^[+-]?0[xX][0-9a-fA-F]+$/.test(segment.value)
  ) {
    return parseSingleTokenSegment(segment.value, segment, errors);
  }
  const parts = segment.value.split("-");
  if (parts.length === 1) {
    return parseSingleTokenSegment(parts[0]!, segment, errors);
  }
  if (parts.length === 2) {
    const range = parseRangeSegment(parts[0]!, parts[1]!, segment, errors);
    return range ? [range] : [];
  }
  errors.push(
    makeError(
      segment.value,
      segment.start,
      segment.end,
      "Invalid range expression"
    )
  );
  return [];
}

export function parseTokenExpressionToRanges(input: string): TokenRange[] {
  if (!input.trim()) {
    return [];
  }
  const segments = tokenize(input);
  const errors: ParseError[] = [];
  const ranges: TokenRange[] = [];
  for (const segment of segments) {
    ranges.push(...parseSegmentToRanges(segment, errors));
  }
  if (errors.length) {
    throwParseErrors(errors);
  }
  const canonical = canonicalizeRanges(ranges);
  const total = canonical.reduce(
    (sum: bigint, range: TokenRange) =>
      sum + (range.end - range.start + BIGINT_ONE),
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
