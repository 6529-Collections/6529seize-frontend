import type { ParseError } from "../types";
import { MAX_ENUMERATION } from "./constants";

export type RangeTooLargeError = Error & {
    code: "range-too-large";
    limit: bigint;
    size: bigint;
};

export const PARSE_ERROR_ARRAY_NAME = "ParseErrorArray";

export type ParseErrorArray = Error & {
    name: typeof PARSE_ERROR_ARRAY_NAME;
    errors: readonly ParseError[];
};

export function createParseErrorArray(errors: ParseError[], message?: string): ParseErrorArray {
    const issues = [...errors] as unknown as ParseErrorArray;
    const primaryMessage = message ?? errors[0]?.message ?? "Invalid token expression";
    issues.message = primaryMessage;
    issues.name = PARSE_ERROR_ARRAY_NAME;
    return issues;
}

export function throwParseErrors(errors: ParseError[], message?: string): never {
    throw createParseErrorArray(errors, message);
}

export function createRangeTooLargeError(size: bigint): RangeTooLargeError {
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

export function makeError(
    input: string,
    start: number,
    end: number,
    message: string,
    code?: string
): ParseError {
    return {
        code,
        input,
        index: start,
        length: Math.max(end - start, input.length || 1),
        message,
    };
}
