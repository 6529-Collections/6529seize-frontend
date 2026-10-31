import type { Log } from "@sentry/nextjs";
import {
  sanitizeString,
  sanitizeUrlString,
  URL_DETAIL_KEY_PATTERN,
  URL_VALUE_KEY_PATTERN,
} from "@/utils/sentry-sanitizer";
import { isSensitiveSentryLogAttribute } from "./sentrySensitiveFields";

const REDACTED = "[Filtered]";
const MAX_DEPTH = 8;
const OMIT_ATTRIBUTE = Symbol("omit-log-attribute");
const USER_ATTRIBUTE_PATTERN = /^user\./i;
const EMBEDDED_URL_PATTERN = /\bhttps?:\/\/[^\s"'<>]+/gi;
const TRAILING_URL_PUNCTUATION = new Set(".,;:!?)]}".split(""));
const KEY_VALUE_PATTERN = /([\w.-]{1,64})=([^&\s"'<>]+)/g;
const JSON_PAIR_PATTERN = /"([\w.-]{1,64})"\s*:\s*"[^"]*"/g;
const EMAIL_PATTERN =
  /\b[\w.%+-]{1,64}@[A-Za-z\d-]{1,63}\.[A-Za-z\d.-]{1,189}\b/g;
const WALLET_ADDRESS_PATTERN = /\b0x[a-fA-F\d]{40}\b/g;

function sanitizeEmbeddedUrl(match: string): string {
  let end = match.length;
  while (end > 0 && TRAILING_URL_PUNCTUATION.has(match.charAt(end - 1))) {
    end -= 1;
  }
  // Same reduction as event URLs: path family only, no query or fragment.
  return `${String(sanitizeUrlString(match.slice(0, end)))}${match.slice(end)}`;
}

function redactSensitiveKeyValue(pair: string, key: string): string {
  return isSensitiveSentryLogAttribute(key) ? `${key}=${REDACTED}` : pair;
}

function redactSensitiveJsonPair(pair: string, key: string): string {
  return isSensitiveSentryLogAttribute(key) ? `"${key}":"${REDACTED}"` : pair;
}

function scrubLogText(value: string): string {
  return sanitizeString(
    value
      .replaceAll(EMBEDDED_URL_PATTERN, sanitizeEmbeddedUrl)
      .replaceAll(KEY_VALUE_PATTERN, redactSensitiveKeyValue)
      .replaceAll(JSON_PAIR_PATTERN, redactSensitiveJsonPair)
      .replaceAll(EMAIL_PATTERN, REDACTED)
      .replaceAll(WALLET_ADDRESS_PATTERN, REDACTED)
  );
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizeLogObject(
  value: Record<string, unknown>,
  depth: number,
  seen: WeakSet<object>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const sanitized = sanitizeLogEntry(key, nestedValue, depth, seen);
    if (sanitized !== OMIT_ATTRIBUTE) {
      result[key] = sanitized;
    }
  }
  return result;
}

function sanitizeLogValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (typeof value === "string") {
    return scrubLogText(value);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "symbol" || typeof value === "function") {
    return REDACTED;
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  if (value instanceof String) {
    return scrubLogText(String(value));
  }
  if (value instanceof Error) {
    return scrubLogText(`${value.name}: ${value.message}`);
  }
  if (value instanceof Date) {
    return value;
  }
  if (depth > MAX_DEPTH || seen.has(value)) {
    return REDACTED;
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeLogValue(item, depth + 1, seen));
    }
    return isPlainObject(value)
      ? sanitizeLogObject(value, depth, seen)
      : REDACTED;
  } finally {
    seen.delete(value);
  }
}

function sanitizeLogEntry(
  key: string,
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (URL_DETAIL_KEY_PATTERN.test(key)) {
    return OMIT_ATTRIBUTE;
  }
  if (isSensitiveSentryLogAttribute(key)) {
    return REDACTED;
  }
  if (URL_VALUE_KEY_PATTERN.test(key) && typeof value === "string") {
    return sanitizeUrlString(value);
  }
  return sanitizeLogValue(value, depth + 1, seen);
}

/**
 * `beforeSendLog` sanitizer. Structured logs skip `beforeSend`, so the message
 * and attributes get the same reductions as events (URL path families, secret
 * patterns and sensitive keys) plus free-text scrubbing for wallet addresses,
 * emails and URL-embedded credentials. Returns `null` (drops the log) if the
 * log cannot be sanitized.
 */
export function sanitizeSentryLog(log: Log): Log | null {
  try {
    const seen = new WeakSet<object>();
    const attributes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(log.attributes ?? {})) {
      // Events never carry user identity; logs follow the same default.
      if (USER_ATTRIBUTE_PATTERN.test(key)) {
        continue;
      }
      const sanitized = sanitizeLogEntry(key, value, 0, seen);
      if (sanitized !== OMIT_ATTRIBUTE) {
        attributes[key] = sanitized;
      }
    }

    // Template-based messages (`logger.fmt`) arrive as String objects.
    return {
      ...log,
      message: scrubLogText(String(log.message)),
      attributes,
    };
  } catch {
    return null;
  }
}
